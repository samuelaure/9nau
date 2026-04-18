import * as FileSystem from 'expo-file-system';
import { executeSql, runSql } from '../db';
import { API_CONFIG, R2_CONFIG } from '@/constants';

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  localUri?: string;
  thumbnail?: string;
  localThumbnailUri?: string;
}

interface UploadRequestResponse {
  uploadUrl: string;
  storageKey: string;
  cdnUrl: string;
}

/**
 * R2UploadService handles background upload of local media files to Cloudflare R2
 * via pre-signed URLs issued by 9nau-api.
 *
 * Upload flow:
 *   1. POST /api/media/upload-request → { uploadUrl, storageKey, cdnUrl }
 *   2. HTTP PUT localUri directly to uploadUrl (bypasses server, no RAM impact)
 *   3. Store storageKey in posts.storage_key for CDN playback
 */
class R2UploadService {
  private isRunning = false;
  private readonly BATCH_SIZE = 3;
  private readonly THROTTLE_MS = 2000;

  async startMigration(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[R2Upload] Starting background R2 migration...');

    try {
      const posts = await executeSql<{
        id: number;
        mediaData: string;
        storage_key: string | null;
        r2_migration_status: string | null;
      }>(
        `SELECT id, mediaData, storage_key, r2_migration_status
         FROM posts
         WHERE isProcessed = 1
           AND mediaData IS NOT NULL
           AND mediaData != '[]'
           AND (r2_migration_status IS NULL OR r2_migration_status = 'pending' OR r2_migration_status = 'error')
           AND is_deleted = 0
         ORDER BY id ASC
         LIMIT ?`,
        [this.BATCH_SIZE],
      );

      if (posts.length === 0) {
        console.log('[R2Upload] No pending media to migrate.');
        this.isRunning = false;
        return;
      }

      for (const post of posts) {
        try {
          await this.migratePostMedia(post.id, post.mediaData);
          await this.sleep(this.THROTTLE_MS);
        } catch (error) {
          console.error(`[R2Upload] Failed to migrate post ${post.id}:`, error);
          await runSql("UPDATE posts SET r2_migration_status = 'error' WHERE id = ?", [post.id]);
        }
      }

      const remaining = await executeSql<{ count: number }>(
        `SELECT COUNT(*) as count FROM posts
         WHERE isProcessed = 1
           AND mediaData IS NOT NULL AND mediaData != '[]'
           AND (r2_migration_status IS NULL OR r2_migration_status = 'pending' OR r2_migration_status = 'error')
           AND is_deleted = 0`,
      );

      if (remaining[0]?.count > 0) {
        this.isRunning = false;
        setTimeout(() => this.startMigration(), 5000);
      } else {
        console.log('[R2Upload] All media migrated to R2!');
      }
    } catch (error) {
      console.error('[R2Upload] Critical error:', error);
    } finally {
      this.isRunning = false;
    }
  }

  private async migratePostMedia(postId: number, mediaDataJson: string): Promise<void> {
    let mediaItems: MediaItem[];
    try {
      mediaItems = JSON.parse(mediaDataJson);
    } catch {
      await runSql("UPDATE posts SET r2_migration_status = 'error' WHERE id = ?", [postId]);
      return;
    }

    if (!Array.isArray(mediaItems) || mediaItems.length === 0) return;

    await runSql("UPDATE posts SET r2_migration_status = 'uploading' WHERE id = ?", [postId]);

    // storageKeyMap: { localUri -> storageKey }
    const storageKeyMap: Record<string, string> = {};
    let allSuccess = true;

    for (const item of mediaItems) {
      const localPath = item.localUri;
      if (!localPath) continue;

      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (!fileInfo.exists) continue;

      try {
        const mimeType = item.type === 'video' ? 'video/mp4' : 'image/jpeg';
        const prefix = `users/captures`;
        const result = await this.uploadFile(localPath, mimeType, prefix);
        if (result) {
          storageKeyMap[localPath] = result.storageKey;
          console.log(`[R2Upload] Uploaded ${item.type} for post ${postId}: ${result.storageKey}`);
        }
      } catch (error) {
        console.error(`[R2Upload] Upload failed for post ${postId}:`, error);
        allSuccess = false;
      }
    }

    if (Object.keys(storageKeyMap).length > 0) {
      await runSql(
        'UPDATE posts SET storage_key = ?, r2_migration_status = ? WHERE id = ?',
        [JSON.stringify(storageKeyMap), allSuccess ? 'done' : 'error', postId],
      );
    } else {
      await runSql(
        "UPDATE posts SET r2_migration_status = ? WHERE id = ?",
        [allSuccess ? 'done' : 'error', postId],
      );
    }
  }

  /**
   * Request a pre-signed URL from the API then PUT the file directly to R2.
   */
  private async uploadFile(
    localUri: string,
    mimeType: string,
    prefix: string,
  ): Promise<UploadRequestResponse | null> {
    // Step 1: Get pre-signed URL from API
    const requestRes = await fetch(`${API_CONFIG.baseUrl}/media/upload-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-nau-service-key': API_CONFIG.serviceKey,
      },
      body: JSON.stringify({ mimeType, prefix }),
    });

    if (!requestRes.ok) {
      console.error(`[R2Upload] upload-request failed: ${requestRes.status}`);
      return null;
    }

    const { uploadUrl, storageKey, cdnUrl } = (await requestRes.json()) as UploadRequestResponse;

    // Step 2: PUT file directly to R2 (no server relay)
    const uploadRes = await FileSystem.uploadAsync(uploadUrl, localUri, {
      httpMethod: 'PUT',
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: {
        'Content-Type': mimeType,
      },
    });

    if (uploadRes.status < 200 || uploadRes.status >= 300) {
      console.error(`[R2Upload] R2 PUT failed: ${uploadRes.status}`);
      return null;
    }

    return { uploadUrl, storageKey, cdnUrl };
  }

  /**
   * Upload a single media item immediately (e.g. new capture).
   * Returns the storageKey if successful, null otherwise.
   */
  async uploadSingleMedia(
    localUri: string,
    mimeType: string,
    prefix = 'users/captures',
  ): Promise<string | null> {
    try {
      const result = await this.uploadFile(localUri, mimeType, prefix);
      return result?.storageKey ?? null;
    } catch (error) {
      console.error('[R2Upload] Single upload failed:', error);
      return null;
    }
  }

  /**
   * Returns the public CDN URL for a given storageKey.
   */
  static getCdnUrl(storageKey: string): string {
    const base = R2_CONFIG.publicUrl.endsWith('/') ? R2_CONFIG.publicUrl.slice(0, -1) : R2_CONFIG.publicUrl;
    return `${base}/${storageKey}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const r2UploadService = new R2UploadService();
export { R2UploadService };
