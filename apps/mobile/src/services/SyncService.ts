import axios from 'axios';
import { API_CONFIG } from '@/constants';
import { executeSql, runSql } from '../db';
import { Post } from '@/repositories/PostRepository';

export interface SyncBlock {
  uuid: string;
  type: string;
  properties: any;
  updatedAt: string;
  deletedAt?: string | null;
  source?: string;
  sourceRef?: string;
}

class SyncService {
  private readonly client = axios.create({
    baseURL: API_CONFIG.baseUrl,
    timeout: 3000,
    headers: {
      'x-nau-service-key': API_CONFIG.serviceKey,
    },
  });

  /**
   * Pushes local changes to the API
   */
  async pushLocalChanges(): Promise<number> {
    // 1. Fetch posts that were updated locally after they were last synced from API
    // Or just all posts where local_updated_at > api_updated_at (or api_updated_at is NULL)
    const localChanges = await executeSql<any>(
      "SELECT * FROM posts WHERE api_updated_at IS NULL OR local_updated_at > api_updated_at"
    );

    if (localChanges.length === 0) return 0;

    console.log(`[SyncService] Pushing ${localChanges.length} local changes to API...`);

    const blocks: SyncBlock[] = localChanges.map(post => ({
      uuid: post.uuid,
      type: 'CAPTURE_POST',
      properties: {
        instagramUrl: post.instagramUrl,
        title: post.title,
        content: post.content,
        tags: post.tags ? JSON.parse(post.tags) : [],
        frequency: post.frequency,
        sm2_interval: post.sm2_interval,
        sm2_repetition: post.sm2_repetition,
        sync_status: post.sync_status,
        username: post.username,
        profile_image: post.profile_image,
        instagram_caption: post.instagram_caption,
        instagram_user_id: post.instagram_user_id,
        biography: post.biography,
        storageKey: post.storage_key || null,
      },
      updatedAt: post.local_updated_at,
      deletedAt: post.is_deleted ? post.deleted_at : null,
      source: 'mobile',
      sourceRef: post.id.toString(),
    }));

    try {
      const response = await this.client.post('/sync/push', { blocks });
      const results = response.data;
      
      // Update api_updated_at for successfully synced blocks
      const now = new Date().toISOString();
      for (const res of results) {
        if (res.status === 'synced') {
          await runSql('UPDATE posts SET api_updated_at = ? WHERE uuid = ?', [now, res.uuid]);
        }
      }
      
      return results.filter((r: any) => r.status === 'synced').length;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn('[SyncService] Push failed (Offline Mode Active):', message);
      return 0; // Return gracefully instead of throwing
    }
  }

  /**
   * Pulls changes from the API
   */
  async pullRemoteChanges(): Promise<number> {
    // 1. Get the latest api_updated_at from our local DB
    const latestSync = await executeSql<{ max_api: string }>(
      'SELECT MAX(api_updated_at) as max_api FROM posts'
    );
    const lastSyncedAt = latestSync[0]?.max_api || new Date(0).toISOString();

    console.log(`[SyncService] Pulling changes since ${lastSyncedAt}...`);

    try {
      const response = await this.client.get('/sync/pull', {
        params: { lastSyncedAt },
      });
      
      const { blocks, serverTime } = response.data;
      if (!blocks || blocks.length === 0) return 0;

      console.log(`[SyncService] Pulling ${blocks.length} blocks from API...`);

      for (const block of blocks) {
        if (block.type !== 'CAPTURE_POST') continue;

        const props = block.properties;
        
        // Find if we have this UUID locally
        const local = await executeSql<any>('SELECT * FROM posts WHERE uuid = ?', [block.uuid]);
        
        if (local.length > 0) {
          const localPost = local[0];
          // If local has non-synced changes, we might have a conflict.
          // For now, simplicity: Remote wins if it's newer than the last time we pulled.
          // But our lastSyncedAt check already filters for that.
          
          await runSql(
            `UPDATE posts SET 
              instagramUrl = ?,
              title = ?,
              content = ?,
              tags = ?,
              frequency = ?,
              sm2_interval = ?,
              sm2_repetition = ?,
              sync_status = ?,
              username = ?,
              profile_image = ?,
              instagram_caption = ?,
              instagram_user_id = ?,
              biography = ?,
              api_updated_at = ?,
              local_updated_at = ?, -- Sync local to remote to avoid immediate re-push
              is_deleted = ?,
              deleted_at = ?
            WHERE uuid = ?`,
            [
              props.instagramUrl,
              props.title,
              props.content,
              JSON.stringify(props.tags),
              props.frequency,
              props.sm2_interval,
              props.sm2_repetition,
              props.sync_status || 'processed',
              props.username,
              props.profile_image,
              props.instagram_caption,
              props.instagram_user_id,
              props.biography,
              serverTime,
              serverTime,
              block.deletedAt ? 1 : 0,
              block.deletedAt,
              block.uuid
            ]
          );
        } else {
          // New block from remote
          await runSql(
            `INSERT INTO posts (
              uuid, instagramUrl, title, content, tags, frequency, 
              sm2_interval, sm2_repetition, sync_status, username, 
              profile_image, instagram_caption, instagram_user_id, biography,
              api_updated_at, local_updated_at, is_deleted, deleted_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              block.uuid,
              props.instagramUrl,
              props.title,
              props.content,
              JSON.stringify(props.tags),
              props.frequency,
              props.sm2_interval,
              props.sm2_repetition,
              props.sync_status || 'processed',
              props.username,
              props.profile_image,
              props.instagram_caption,
              props.instagram_user_id,
              props.biography,
              serverTime,
              serverTime,
              block.deletedAt ? 1 : 0,
              block.deletedAt
            ]
          );
        }
      }

      return blocks.length;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn('[SyncService] Pull failed (Offline Mode Active):', message);
      return 0; // Return gracefully instead of throwing
    }
  }
}

export const syncService = new SyncService();
