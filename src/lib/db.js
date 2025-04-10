// src/lib/db.js
import sqlite3 from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

class DatabaseManager {
    constructor() {
        if (DatabaseManager.instance) {
            return DatabaseManager.instance;
        }

        // Ensure the data directory exists
        const dbDir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        // Initialize the database
        this.dbPath = path.join(dbDir, 'database.sqlite');
        this.db = sqlite3(this.dbPath);
        this.queue = Promise.resolve();

        // Initialize the tables
        this.init();

        DatabaseManager.instance = this;
    }

    init() {
        // Create your tables here
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    }

    // Method to execute a single operation in the queue
    async execute(operation) {
        // Add the operation to the queue and return its result
        return new Promise((resolve, reject) => {
            this.queue = this.queue.then(async () => {
                try {
                    const result = await operation(this.db);
                    resolve(result);
                    return result;
                } catch (error) {
                    reject(error);
                    throw error;
                }
            }).catch(err => {
                console.error('Database operation failed:', err);
            });
        });
    }

    // Helper method to run a query
    async query(sql, params = []) {
        return this.execute(db => {
            const stmt = db.prepare(sql);
            return stmt.all(params);
        });
    }

    // Helper method to run an insert/update
    async run(sql, params = []) {
        return this.execute(db => {
            const stmt = db.prepare(sql);
            return stmt.run(params);
        });
    }

    // Example of a specific method for your webhook
    async saveTeamsMessage(sender, timestamp, content) {
        return this.execute(db => {
            const stmt = db.prepare('INSERT INTO messages (sender, timestamp, content) VALUES (?, ?, ?)');
            return stmt.run(sender, timestamp, content);
        });
    }
}

// Export a singleton instance
const dbManager = new DatabaseManager();
export default dbManager;