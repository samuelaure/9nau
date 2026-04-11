import { executeSql, runSql } from './db/core';
import { applyMigrations } from './db/MigrationManager';

export { executeSql, runSql };
export { db } from './db/core';

export const initDb = async (): Promise<void> => {
  // 1. Ensure tables exist
  await runSql(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      instagramUrl TEXT,
      title TEXT,
      content TEXT,
      tags TEXT,
      frequency TEXT,
      mediaData TEXT,
      username TEXT,
      profile_image TEXT,
      instagram_caption TEXT,
      is_deleted INTEGER DEFAULT 0,
      deleted_at DATETIME,
      isProcessed INTEGER DEFAULT 0,
      sync_attempts INTEGER DEFAULT 0,
      sync_status TEXT DEFAULT 'pending',
      sm2_interval INTEGER DEFAULT 1,
      sm2_repetition INTEGER DEFAULT 0,
      sm2_ease_factor REAL DEFAULT 2.5,
      next_review_at DATETIME,
      instagram_user_id TEXT,
      biography TEXT,
      uuid TEXT UNIQUE,
      local_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      api_updated_at DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await runSql(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // 2. Apply migrations
  try {
    await applyMigrations();
  } catch (e) {
    console.error('[DB] Migration failed:', e);
  }
};

import { db as defaultDb } from './db/core';
export default defaultDb;
