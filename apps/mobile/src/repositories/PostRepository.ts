import { executeSql, runSql } from '../db';
import { parseFrequencyToDays, getNextFrequencyInterval } from '../services/FrequencyService';

export interface MediaItem {
  type: 'image' | 'video';
  url: string;
  localUri?: string;
  thumbnail?: string;
  localThumbnailUri?: string;
}

export interface Post {
  id: number;
  instagramUrl: string;
  title?: string;
  content?: string;
  tags?: string;
  mediaData?: string;
  isProcessed: number;
  sm2_interval: number;
  sm2_ease_factor: number;
  frequency: string;
  sync_attempts: number;
  sync_status: 'pending' | 'processed' | 'standby' | 'restricted';
  username?: string;
  profile_image?: string;
  instagram_caption?: string;
  is_deleted: number;
  deleted_at?: string;
  instagram_user_id?: string;
  biography?: string;
  sm2_repetition: number;
  uuid: string;
  local_updated_at: string;
  api_updated_at?: string;
  vault_file_id?: string;
  vault_migration_status?: 'pending' | 'uploading' | 'done' | 'error' | null;
}

export const getDuePosts = async (tagFilter?: string | null, limit = 20, offset = 0): Promise<Post[]> => {
  let query = `SELECT * FROM posts WHERE is_deleted = 0 AND sm2_interval > 0 AND (next_review_at <= datetime('now') OR next_review_at IS NULL)`;
  const params: any[] = [];

  if (tagFilter) {
    query += ` AND tags LIKE ?`;
    params.push(`%${tagFilter}%`);
  }

  query += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  return executeSql<Post>(query, params);
};

export const getReviewedPosts = async (tagFilter?: string | null, limit = 20, offset = 0): Promise<Post[]> => {
  let query = `SELECT * FROM posts WHERE is_deleted = 0 AND next_review_at > datetime('now')`;
  const params: any[] = [];

  if (tagFilter) {
    query += ` AND tags LIKE ?`;
    params.push(`%${tagFilter}%`);
  }

  query += ` ORDER BY next_review_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  return executeSql<Post>(query, params);
};

export const getUnscheduledPosts = async (tagFilter?: string | null, limit = 20, offset = 0): Promise<Post[]> => {
  let query = `SELECT * FROM posts WHERE is_deleted = 0 AND (sm2_interval = 0 OR sm2_interval IS NULL)`;
  const params: any[] = [];

  if (tagFilter) {
    query += ` AND tags LIKE ?`;
    params.push(`%${tagFilter}%`);
  }

  query += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  return executeSql<Post>(query, params);
};

export const getPostsByTag = async (tag: string, limit = 20, offset = 0): Promise<Post[]> => {
  return executeSql<Post>(
    "SELECT * FROM posts WHERE is_deleted = 0 AND tags LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?",
    [`%${tag}%`, limit, offset]
  );
};

/**
 * Fetches all unique tags used across all posts to populate the Filter Bar.
 */
export const getAllTags = async (): Promise<string[]> => {
  try {
    const rows = await executeSql<{ tags: string }>(
      'SELECT tags FROM posts WHERE tags IS NOT NULL',
    );
    const allTags = new Set<string>();
    rows.forEach((row) => {
      try {
        const tags: string[] = JSON.parse(row.tags);
        tags.forEach((t) => allTags.add(t));
      } catch (e) {
        /* ignore parse errors */
      }
    });
    return Array.from(allTags).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  } catch (err) {
    return [];
  }
};

/**
 * Fetches the most recently used tags from the most recent posts.
 */
export const getRecentTags = async (limit = 6): Promise<string[]> => {
  try {
    const rows = await executeSql<{ tags: string }>(
      'SELECT tags FROM posts WHERE tags IS NOT NULL AND is_deleted = 0 AND tags != "[]" AND tags != "" ORDER BY id DESC LIMIT 50'
    );
    const recentTags = new Set<string>();
    for (const row of rows) {
      try {
        const tags: string[] = JSON.parse(row.tags);
        for (const t of tags) {
          recentTags.add(t);
          if (recentTags.size >= limit) {
            return Array.from(recentTags);
          }
        }
      } catch (e) {
        /* ignore parse errors */
      }
    }
    return Array.from(recentTags);
  } catch (err) {
    return [];
  }
};

export const getPendingPosts = async (maxAttempts = 10): Promise<Post[]> => {
  return executeSql<Post>(
    "SELECT * FROM posts WHERE isProcessed = 0 AND sync_status = 'pending' AND sync_attempts < ?",
    [maxAttempts],
  );
};

export const incrementSyncAttempts = async (id: number): Promise<void> => {
  await runSql('UPDATE posts SET sync_attempts = sync_attempts + 1, local_updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
};

export const updateSyncStatus = async (
  id: number,
  status: 'pending' | 'standby' | 'processed' | 'restricted',
): Promise<void> => {
  await runSql('UPDATE posts SET sync_status = ?, local_updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);
};

export const resetSyncForManualRetry = async (ids: number[]): Promise<void> => {
  if (ids.length === 0) return;
  const placeholders = ids.map(() => '?').join(',');
  await runSql(
    `UPDATE posts SET sync_attempts = 0, sync_status = 'pending', local_updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`,
    ids,
  );
};

export const resetPostForRedownload = async (id: number): Promise<void> => {
  await runSql(
    `UPDATE posts 
     SET isProcessed = 0, 
         sync_status = 'pending', 
         sync_attempts = 0,
         local_updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [id],
  );
};

export const getStandbyPosts = async (): Promise<Post[]> => {
  return executeSql<Post>(
    "SELECT * FROM posts WHERE sync_status = 'standby' OR sync_attempts >= 10",
  );
};

export const updatePostFrequency = async (
  id: number,
  direction: 'more' | 'less',
): Promise<number> => {
  const posts = await executeSql<Post>('SELECT sm2_interval FROM posts WHERE id = ?', [id]);
  if (posts.length === 0) return 1;

  const currentInterval = posts[0].sm2_interval;
  const nextInterval = await getNextFrequencyInterval(currentInterval, direction);

  await runSql(
    `UPDATE posts 
     SET sm2_interval = ?,
         next_review_at = datetime('now', '+' || ? || ' days'),
         local_updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [nextInterval, nextInterval, id],
  );
  return nextInterval;
};

export const updatePostNote = async (id: number, content: string): Promise<void> => {
  await runSql('UPDATE posts SET content = ?, local_updated_at = CURRENT_TIMESTAMP WHERE id = ?', [content, id]);
};

export const updatePostInterval = async (id: number, interval: number): Promise<void> => {
  await runSql(
    `UPDATE posts 
     SET sm2_interval = ?,
         next_review_at = datetime('now', '+' || ? || ' days'),
         local_updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [interval, interval, id],
  );
};

export const updatePostTitle = async (id: number, title: string): Promise<void> => {
  await runSql('UPDATE posts SET title = ?, local_updated_at = CURRENT_TIMESTAMP WHERE id = ?', [title, id]);
};

export const updatePostTags = async (id: number, tags: string[]): Promise<void> => {
  await runSql('UPDATE posts SET tags = ?, local_updated_at = CURRENT_TIMESTAMP WHERE id = ?', [JSON.stringify(tags), id]);
};

export const deletePost = async (id: number): Promise<void> => {
  await runSql('DELETE FROM posts WHERE id = ?', [id]);
};

export const markPostAsReviewed = async (id: number, interval: number): Promise<void> => {
  await runSql(
    `UPDATE posts 
     SET next_review_at = datetime('now', '+' || ? || ' days'),
         sm2_repetition = sm2_repetition + 1,
         local_updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [interval, id],
  );
};

export const unmarkPostAsReviewed = async (id: number): Promise<void> => {
  await runSql(
    `UPDATE posts 
     SET next_review_at = datetime('now'),
         sm2_repetition = MAX(0, sm2_repetition - 1),
         local_updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [id],
  );
};

export const updatePostMedia = async (
  id: number,
  params: {
    mediaData: MediaItem[];
    username?: string;
    profile_image?: string;
    instagram_caption?: string;
    instagram_user_id?: string;
    biography?: string;
  },
): Promise<void> => {
  // First, get the current content to see if we should append/initialize with the caption
  const posts = await executeSql<Post>('SELECT content FROM posts WHERE id = ?', [id]);
  const currentPost = posts[0];
  let newContent = currentPost?.content || '';

  if (params.instagram_caption) {
    if (!newContent) {
      newContent = params.instagram_caption;
    } else if (!newContent.includes(params.instagram_caption)) {
      // Avoid double-appending if sync runs again
      newContent = `${newContent}\n\n${params.instagram_caption}`;
    }
  }

  await runSql(
    "UPDATE posts SET mediaData = ?, isProcessed = 1, sync_status = 'processed', username = ?, profile_image = ?, instagram_caption = ?, content = ?, instagram_user_id = ?, biography = ?, local_updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [
      JSON.stringify(params.mediaData),
      params.username || null,
      params.profile_image || null,
      params.instagram_caption || null,
      newContent,
      params.instagram_user_id || null,
      params.biography || null,
      id,
    ],
  );
};

export const moveToTrash = async (id: number): Promise<void> => {
  await runSql("UPDATE posts SET is_deleted = 1, deleted_at = datetime('now'), local_updated_at = CURRENT_TIMESTAMP WHERE id = ?", [id]);
};

export const untrashPost = async (id: number): Promise<void> => {
  await runSql('UPDATE posts SET is_deleted = 0, deleted_at = NULL, local_updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
};

export const getDeletedPosts = async (limit = 20, offset = 0): Promise<Post[]> => {
  return executeSql<Post>('SELECT * FROM posts WHERE is_deleted = 1 ORDER BY deleted_at DESC LIMIT ? OFFSET ?', [limit, offset]);
};

export const getProfileByUsername = async (
  username: string,
): Promise<{ profile_image: string; instagram_user_id: string } | null> => {
  const rows = await executeSql<Post>(
    'SELECT profile_image, instagram_user_id FROM posts WHERE username = ? AND instagram_user_id IS NOT NULL LIMIT 1',
    [username],
  );
  if (rows.length > 0) {
    return {
      profile_image: rows[0].profile_image!,
      instagram_user_id: rows[0].instagram_user_id!,
    };
  }
  return null;
};

export const savePost = async (post: any): Promise<number> => {
  const uuid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  return runSql(
    `INSERT INTO posts (uuid, instagramUrl, title, content, tags, frequency, sm2_interval, isProcessed, next_review_at, sync_status, local_updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [
      uuid,
      post.instagramUrl || '',
      post.title,
      post.content,
      JSON.stringify(post.tags),
      post.frequency,
      initialInterval,
      isProcessed,
      post.startDate || new Date().toISOString().split('T')[0],
      isProcessed ? 'processed' : 'pending',
    ],
  );
};
