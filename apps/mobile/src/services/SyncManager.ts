import {
  getPendingPosts,
  incrementSyncAttempts,
  updateSyncStatus,
} from '@/repositories/PostRepository';
import { runSql, executeSql } from '../db';
import { syncService } from './SyncService';
import { MediaCacheService } from './MediaCacheService';
import { vaultMigrationService } from './VaultMigrationService';

/**
 * SyncManager handles the background synchronization of captures.
 * Transitioned to Standalone Mode: Now uses Apify directly and downloads media locally.
 * Also triggers Vault backup for newly cached media.
 */
class SyncManager {
  private isSyncing = false;
  private intervalId: NodeJS.Timeout | null = null;
  private subscribers: (() => void)[] = [];
  private pollingInterval = 15000;
  private vaultMigrationStarted = false;

  async triggerSync(pollingIntervalMs = 15000) {
    this.pollingInterval = pollingIntervalMs;
    if (this.isSyncing) return;

    const hasMoreWork = await this.performSync();

    if (hasMoreWork && !this.intervalId) {
      this.intervalId = setInterval(() => this.backgroundTick(), this.pollingInterval);
    }
  }

  private async backgroundTick() {
    if (this.isSyncing) return;
    const hasMoreWork = await this.performSync();
    if (!hasMoreWork && this.intervalId) {
      this.stop();
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  subscribe(callback: () => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== callback);
    };
  }

  private notify() {
    this.subscribers.forEach((s) => s());
  }

  /**
   * Performs the actual sync logic using Cloud Sync (Push/Pull).
   */
  async performSync(): Promise<boolean> {
    if (this.isSyncing) return false;

    try {
      this.isSyncing = true;
      console.log('[SyncManager] Starting Cloud Sync...');

      // 1. PUSH local changes to API
      const pushedCount = await syncService.pushLocalChanges();
      if (pushedCount > 0) {
        console.log(`[SyncManager] Pushed ${pushedCount} changes to API.`);
      }

      // 2. PULL remote updates from API
      const pulledCount = await syncService.pullRemoteChanges();
      if (pulledCount > 0) {
        console.log(`[SyncManager] Pulled ${pulledCount} updates from API.`);
        this.notify();
      }

      // 3. Post-Sync processing: Ensure all processed posts have media cached locally
      const processed = await executeSql<Record<string, unknown>>(
        "SELECT * FROM posts WHERE sync_status = 'processed' AND isProcessed = 1"
      );
      
      for (const post of processed) {
        if (post.mediaData) {
          try {
            const media = JSON.parse(post.mediaData as string);
            let changed = false;
            
            for (const item of media) {
              if (item.url && !item.localUri) {
                console.log(`[SyncManager] Caching media for post ${post.id}: ${item.url}`);
                item.localUri = await MediaCacheService.ensureMediaCached(item.url);
                changed = true;
              }
            }
            
            if (changed) {
              await runSql('UPDATE posts SET mediaData = ? WHERE id = ?', [JSON.stringify(media), post.id]);
            }
          } catch (e) {
            console.error(`[SyncManager] Failed to cache media for post ${post.id}:`, e);
          }
        }
      }

      // 4. Trigger Vault migration for newly cached media (runs in background)
      if (!this.vaultMigrationStarted) {
        this.vaultMigrationStarted = true;
        // Fire-and-forget: vault migration runs independently
        vaultMigrationService.startMigration().catch((error) => {
          console.error('[SyncManager] Vault migration error:', error);
          this.vaultMigrationStarted = false;
        });
      }

      // Return true if we still have pending work (though PUSH/PULL is mostly atomic)
      const pending = await getPendingPosts(10);
      return pending.length > 0;
    } catch (error) {
      console.error('[SyncManager] Critical sync error:', error);
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  private async handleFailure(post: Record<string, unknown>, maxAttempts: number) {
    await incrementSyncAttempts(post.id as number);
    if ((post.sync_attempts as number) + 1 >= maxAttempts) {
      console.log(`[SyncManager] Item ${post.id} hit retry limit -> STANDBY.`);
      await updateSyncStatus(post.id as number, 'standby');
      this.notify();
    }
  }
}

export const syncManager = new SyncManager();

