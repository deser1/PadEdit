import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase;

export const initDb = async () => {
  db = await SQLite.openDatabaseAsync('padedit.db');
  
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS workspaces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_name TEXT NOT NULL,
      filename TEXT NOT NULL,
      content TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(workspace_name, filename)
    );
  `);
  
  // Wstaw domyślny workspace, jeśli nie ma
  try {
    await db.runAsync('INSERT OR IGNORE INTO workspaces (name) VALUES (?)', 'projects');
  } catch (e) {
    console.error('Error inserting default workspace', e);
  }
};

export const getWorkspaces = async (): Promise<string[]> => {
  if (!db) return ['projects'];
  const allRows = await db.getAllAsync<{name: string}>('SELECT name FROM workspaces');
  return allRows.map(row => row.name);
};

export const addWorkspace = async (name: string) => {
  if (!db) return;
  await db.runAsync('INSERT INTO workspaces (name) VALUES (?)', name);
};

export const getFiles = async (workspace: string): Promise<string[]> => {
  if (!db) return [];
  const allRows = await db.getAllAsync<{filename: string}>('SELECT filename FROM files WHERE workspace_name = ?', workspace);
  return allRows.map(row => row.filename);
};

export const saveFile = async (workspace: string, filename: string, content: string) => {
  if (!db) return;
  await db.runAsync(
    'INSERT INTO files (workspace_name, filename, content, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(workspace_name, filename) DO UPDATE SET content = excluded.content, updated_at = CURRENT_TIMESTAMP',
    [workspace, filename, content]
  );
};

export const readFile = async (workspace: string, filename: string): Promise<string | null> => {
  if (!db) return null;
  const row = await db.getFirstAsync<{content: string}>('SELECT content FROM files WHERE workspace_name = ? AND filename = ?', [workspace, filename]);
  return row ? row.content : null;
};

export const deleteFile = async (workspace: string, filename: string) => {
  if (!db) return;
  await db.runAsync('DELETE FROM files WHERE workspace_name = ? AND filename = ?', [workspace, filename]);
};