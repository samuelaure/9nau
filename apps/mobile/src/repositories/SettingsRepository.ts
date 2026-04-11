import { executeSql, runSql } from '@/db';

export async function setSetting(key: string, value: string): Promise<void> {
  await runSql(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`, [key, value]);
}

export async function getSetting(key: string): Promise<string | null> {
  const rows = await executeSql<{ value: string }>(`SELECT value FROM settings WHERE key = ?`, [
    key,
  ]);
  return rows.length ? rows[0].value : null;
}
