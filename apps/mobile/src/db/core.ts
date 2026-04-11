import * as SQLite from 'expo-sqlite';
import { DATABASE_NAME } from '../constants';

// For Expo 50, we use the legacy openDatabase API but wrap it for better DX
export const db = SQLite.openDatabase(DATABASE_NAME);

/**
 * Execute a SQL query and return the results as a Promise.
 */
export const executeSql = <T = any>(sql: string, params: any[] = []): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      console.log('[DB] Executing SQL:', sql, 'params:', params);
      tx.executeSql(
        sql,
        params,
        (_, { rows }) => {
          const result = (rows as any)._array || [];
          console.log('[DB] SQL Success. Rows returned:', result.length);
          resolve(result);
        },
        (_, err) => {
          console.error('[DB] SQL Error:', err, 'SQL:', sql);
          reject(err);
          return false;
        },
      );
    });
  });
};

/**
 * Execute a SQL query that doesn't return rows (INSERT, UPDATE, DELETE).
 */
export const runSql = (sql: string, params: any[] = []): Promise<number> => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      console.log('[DB] Running SQL (no rows):', sql, 'params:', params);
      tx.executeSql(
        sql,
        params,
        (_, result) => {
          const res = result.insertId || result.rowsAffected || 0;
          console.log('[DB] Run SQL success. Result (ID/Affected):', res);
          resolve(res);
        },
        (_, err) => {
          console.error('[DB] Run SQL error:', err, 'SQL:', sql);
          reject(err);
          return false;
        },
      );
    });
  });
};
