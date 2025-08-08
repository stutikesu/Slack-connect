import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../../data/slack-connect.db');

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new sqlite3.Database(dbPath);

export const initializeDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Drop the tokens table if it exists to recreate with correct schema
      db.run(`DROP TABLE IF EXISTS tokens`, (err) => {
        if (err) {
          console.error('Error dropping tokens table:', err);
          reject(err);
          return;
        }
        
        // Create tokens table with refresh_token explicitly set as nullable
        db.run(`
          CREATE TABLE tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            workspace_id TEXT NOT NULL UNIQUE,
            workspace_name TEXT NOT NULL,
            access_token TEXT NOT NULL,
            refresh_token TEXT NULL,      -- Explicitly nullable
            expires_at INTEGER,            -- Nullable
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          )
        `, (err) => {
          if (err) {
            console.error('Error creating tokens table:', err);
            reject(err);
            return;
          }
        });
      });

      db.run(`
        CREATE TABLE IF NOT EXISTS scheduled_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          workspace_id TEXT NOT NULL,
          channel_id TEXT NOT NULL,
          channel_name TEXT NOT NULL,
          message TEXT NOT NULL,
          scheduled_time INTEGER NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at INTEGER NOT NULL
        )
      `, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  });
};

// Close DB on exit
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
    process.exit(err ? 1 : 0);
  });
});
