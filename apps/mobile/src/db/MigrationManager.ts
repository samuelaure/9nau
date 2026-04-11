import { executeSql, runSql } from './core';

interface Migration {
  version: number;
  up: () => Promise<void>;
}

/**
 * Version 1 (Baseline):
 * This includes all columns added ad-hoc previously:
 * sync_attempts, sync_status, username, profile_image,
 * instagram_caption, is_deleted, deleted_at, instagram_user_id, biography.
 */
const migrations: Migration[] = [
  {
    version: 1,
    up: async () => {
      const tableInfo = await executeSql<{ name: string }>('PRAGMA table_info(posts)');
      const existingColumns = tableInfo.map((col) => col.name);

      const migrations = [
        {
          col: 'sync_attempts',
          sql: 'ALTER TABLE posts ADD COLUMN sync_attempts INTEGER DEFAULT 0',
        },
        {
          col: 'sync_status',
          sql: "ALTER TABLE posts ADD COLUMN sync_status TEXT DEFAULT 'pending'",
        },
        { col: 'username', sql: 'ALTER TABLE posts ADD COLUMN username TEXT' },
        { col: 'profile_image', sql: 'ALTER TABLE posts ADD COLUMN profile_image TEXT' },
        { col: 'instagram_caption', sql: 'ALTER TABLE posts ADD COLUMN instagram_caption TEXT' },
        { col: 'is_deleted', sql: 'ALTER TABLE posts ADD COLUMN is_deleted INTEGER DEFAULT 0' },
        { col: 'deleted_at', sql: 'ALTER TABLE posts ADD COLUMN deleted_at DATETIME' },
        { col: 'instagram_user_id', sql: 'ALTER TABLE posts ADD COLUMN instagram_user_id TEXT' },
        { col: 'biography', sql: 'ALTER TABLE posts ADD COLUMN biography TEXT' },
      ];

      for (const m of migrations) {
        if (!existingColumns.includes(m.col)) {
          await runSql(m.sql);
        }
      }
    },
  },
  // Add future migrations here:
  {
    version: 2,
    up: async () => {
      // Create labels table
      await runSql(`
        CREATE TABLE IF NOT EXISTS labels (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Populate labels table with existing tags from posts
      const rows = await executeSql<{ tags: string }>(
        'SELECT tags FROM posts WHERE tags IS NOT NULL',
      );
      const allTags = new Set<string>();
      rows.forEach((row) => {
        try {
          const tags: string[] = JSON.parse(row.tags);
          tags.forEach((t) => {
            if (t && t.trim()) {
              allTags.add(t.trim());
            }
          });
        } catch (e) {
          /* ignore parse errors */
        }
      });

      for (const tag of allTags) {
        try {
          await runSql('INSERT OR IGNORE INTO labels (name) VALUES (?)', [tag]);
        } catch (e) {
          console.error(`[Migration] Failed to insert tag: ${tag}`, e);
        }
      }
    },
  },
  {
    version: 3,
    up: async () => {
      const tableInfo = await executeSql<{ name: string }>('PRAGMA table_info(posts)');
      const existingColumns = tableInfo.map((col) => col.name);

      if (!existingColumns.includes('uuid')) {
        await runSql('ALTER TABLE posts ADD COLUMN uuid TEXT');
        // No UNIQUE constraint in ALTER TABLE in SQLite easily, but we'll enforce it in logic
      }

      if (!existingColumns.includes('local_updated_at')) {
        await runSql("ALTER TABLE posts ADD COLUMN local_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP");
      }

      if (!existingColumns.includes('api_updated_at')) {
        await runSql("ALTER TABLE posts ADD COLUMN api_updated_at DATETIME");
      }

      // Populate empty UUIDs
      const rows = await executeSql<{ id: number; uuid: string }>('SELECT id, uuid FROM posts');
      for (const row of rows) {
        if (!row.uuid) {
          const newUuid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          await runSql('UPDATE posts SET uuid = ? WHERE id = ?', [newUuid, row.id]);
        }
      }
    },
  },
];

export const applyMigrations = async () => {
  // 1. Get current version
  const result = await executeSql<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result[0]?.user_version || 0;

  console.log(`[DB] Current version: ${currentVersion}`);

  // 2. Filter and apply migrations
  const pending = migrations
    .filter((m) => m.version > currentVersion)
    .sort((a, b) => a.version - b.version);

  if (pending.length === 0) {
    console.log('[DB] No pending migrations.');
    return;
  }

  for (const migration of pending) {
    console.log(`[DB] Applying migration to version ${migration.version}...`);
    await migration.up();
    await runSql(`PRAGMA user_version = ${migration.version}`);
    console.log(`[DB] Migration to version ${migration.version} successful.`);
  }
};
