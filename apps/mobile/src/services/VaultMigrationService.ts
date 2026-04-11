import * as FileSystem from 'expo-file-system';
import { executeSql, runSql } from '../db';
import { API_CONFIG } from '@/constants';

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  localUri?: string;
  thumbnail?: string;
  localThumbnailUri?: string;
}

interface VaultUploadResult {
  fileId: string;
  fileUniqueId: string;
  fileSize: number;
  mimeType: string;
}

/**
 * VaultMigrationService handles background upload of local media files
 * to the naŭ Storage Vault (Telegram private channel).
 *
 * Key behavior:
 * - Files are NOT removed from the phone after upload (cloud backup only)
 * - Each media item in a post's mediaData array gets its own vault_file_id
 * - The migration runs silently in the background, throttled to avoid flooding
 * - Posts track their vault migration status individually
 */
class VaultMigrationService {
  private isRunning = false;
  private readonly BATCH_SIZE = 3; // Upload 3 items per batch
  private readonly THROTTLE_MS = 2000; // 2 seconds between uploads

  /**
   * Start the vault migration process.
   * Finds posts with local media that haven't been backed up to the Vault yet.
   * Should be called once on app startup.
   */
  async startMigration(): Promise<void> {
    if (this.isRunning) {
      console.log('[VaultMigration] Already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('[VaultMigration] Starting background media vault migration...');

    try {
      // Find processed posts that have NOT been vault-migrated
      const posts = await executeSql<{
        id: number;
        mediaData: string;
        vault_file_id: string | null;
        vault_migration_status: string | null;
      }>(
        `SELECT id, mediaData, vault_file_id, vault_migration_status
         FROM posts
         WHERE isProcessed = 1
           AND mediaData IS NOT NULL
           AND mediaData != '[]'
           AND (vault_migration_status IS NULL OR vault_migration_status = 'pending' OR vault_migration_status = 'error')
           AND is_deleted = 0
         ORDER BY id ASC
         LIMIT ?`,
        [this.BATCH_SIZE],
      );

      if (posts.length === 0) {
        console.log('[VaultMigration] No pending media to migrate.');
        this.isRunning = false;
        return;
      }

      console.log(`[VaultMigration] Found ${posts.length} posts to migrate.`);

      for (const post of posts) {
        try {
          await this.migratePostMedia(post.id, post.mediaData);
          await this.sleep(this.THROTTLE_MS);
        } catch (error) {
          console.error(`[VaultMigration] Failed to migrate post ${post.id}:`, error);
          await runSql(
            "UPDATE posts SET vault_migration_status = 'error' WHERE id = ?",
            [post.id],
          );
        }
      }

      // Check if there's more work to do (recursive continuation)
      const remaining = await executeSql<{ count: number }>(
        `SELECT COUNT(*) as count FROM posts
         WHERE isProcessed = 1
           AND mediaData IS NOT NULL
           AND mediaData != '[]'
           AND (vault_migration_status IS NULL OR vault_migration_status = 'pending' OR vault_migration_status = 'error')
           AND is_deleted = 0`,
      );

      if (remaining[0]?.count > 0) {
        console.log(`[VaultMigration] ${remaining[0].count} posts remaining, continuing...`);
        this.isRunning = false;
        // Schedule the next batch after a longer pause
        setTimeout(() => this.startMigration(), 5000);
      } else {
        console.log('[VaultMigration] All media has been migrated to the Vault!');
      }
    } catch (error) {
      console.error('[VaultMigration] Critical error during migration:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Migrate a single post's media items to the Vault.
   * Each media file (image/video) that has a local URI gets uploaded individually.
   * The vault_file_id is stored as a JSON map: { "localUri": "telegram_file_id", ... }
   */
  private async migratePostMedia(postId: number, mediaDataJson: string): Promise<void> {
    let mediaItems: MediaItem[];
    try {
      mediaItems = JSON.parse(mediaDataJson);
    } catch {
      console.warn(`[VaultMigration] Invalid mediaData for post ${postId}, skipping.`);
      await runSql(
        "UPDATE posts SET vault_migration_status = 'error' WHERE id = ?",
        [postId],
      );
      return;
    }

    if (!Array.isArray(mediaItems) || mediaItems.length === 0) return;

    // Mark as uploading
    await runSql(
      "UPDATE posts SET vault_migration_status = 'uploading' WHERE id = ?",
      [postId],
    );

    const vaultMap: Record<string, string> = {};
    let allSuccess = true;

    for (const item of mediaItems) {
      const localPath = item.localUri;
      if (!localPath) continue;

      // Verify file exists locally
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (!fileInfo.exists) {
        console.warn(`[VaultMigration] Local file missing for post ${postId}: ${localPath}`);
        continue;
      }

      try {
        const result = await this.uploadFileToVault(localPath, item.type);
        if (result) {
          vaultMap[localPath] = result.fileId;
          console.log(`[VaultMigration] Uploaded ${item.type} for post ${postId}: file_id=${result.fileId}`);
        }
      } catch (error) {
        console.error(`[VaultMigration] Failed to upload file for post ${postId}:`, error);
        allSuccess = false;
      }
    }

    // Save vault file IDs to the post
    if (Object.keys(vaultMap).length > 0) {
      await runSql(
        "UPDATE posts SET vault_file_id = ?, vault_migration_status = ? WHERE id = ?",
        [
          JSON.stringify(vaultMap),
          allSuccess ? 'done' : 'error',
          postId,
        ],
      );
    } else if (!allSuccess) {
      await runSql(
        "UPDATE posts SET vault_migration_status = 'error' WHERE id = ?",
        [postId],
      );
    } else {
      // No local files to upload (all remote URLs), mark as done
      await runSql(
        "UPDATE posts SET vault_migration_status = 'done' WHERE id = ?",
        [postId],
      );
    }
  }

  /**
   * Upload a single file from local storage to the Vault API.
   * Uses FileSystem.uploadAsync for efficient multipart uploads on mobile.
   */
  private async uploadFileToVault(
    localUri: string,
    mediaType: 'image' | 'video',
  ): Promise<VaultUploadResult | null> {
    const filename = localUri.split('/').pop() || `media.${mediaType === 'video' ? 'mp4' : 'jpg'}`;
    const uploadUrl = `${API_CONFIG.baseUrl}/media/upload`;

    try {
      const response = await FileSystem.uploadAsync(uploadUrl, localUri, {
        fieldName: 'file',
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        headers: {
          'x-nau-service-key': API_CONFIG.serviceKey,
        },
        parameters: {
          filename,
        },
      });

      if (response.status >= 200 && response.status < 300) {
        return JSON.parse(response.body) as VaultUploadResult;
      }

      console.error(`[VaultMigration] Upload failed with status ${response.status}: ${response.body}`);
      return null;
    } catch (error) {
      console.error(`[VaultMigration] Upload error for ${filename}:`, error);
      return null;
    }
  }

  /**
   * Upload a single media item to the Vault immediately (for new captures).
   * Returns the vault file_id if successful, null otherwise.
   * Does NOT delete the local file.
   */
  async uploadSingleMedia(
    localUri: string,
    mediaType: 'image' | 'video',
  ): Promise<string | null> {
    try {
      const result = await this.uploadFileToVault(localUri, mediaType);
      return result?.fileId ?? null;
    } catch (error) {
      console.error('[VaultMigration] Single upload failed:', error);
      return null;
    }
  }

  /**
   * Get the proxy URL for streaming a vaulted file through the 9naŭ API.
   */
  static getVaultProxyUrl(fileId: string): string {
    return `${API_CONFIG.baseUrl}/media/${fileId}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const vaultMigrationService = new VaultMigrationService();
