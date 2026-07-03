const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;

class DbService {
    constructor() {
        this.dbPath = path.join(__dirname, '../../data/nova_database.db');
        this.db = null;
    }

    async init() {
        const dataDir = path.dirname(this.dbPath);
        await fs.mkdir(dataDir, { recursive: true });

        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('❌ Error al conectar a la base de datos SQLite:', err);
                    return reject(err);
                }
                console.log('✓ Conexión establecida con la base de datos SQLite');
                this.createTables()
                    .then(resolve)
                    .catch(reject);
            });
        });
    }

    createTables() {
        const queries = [
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                nombre TEXT NOT NULL,
                carrera TEXT,
                ciclo TEXT,
                sede TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id INTEGER NOT NULL,
                role TEXT NOT NULL, -- 'user' o 'assistant'
                text TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS user_memories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                key TEXT NOT NULL,
                value TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, key),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`
        ];

        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                let completed = 0;
                for (const query of queries) {
                    this.db.run(query, (err) => {
                        if (err) {
                            console.error('❌ Error al crear tablas:', err);
                            return reject(err);
                        }
                        completed++;
                        if (completed === queries.length) {
                            console.log('✓ Tablas inicializadas en SQLite correctamente');
                            resolve();
                        }
                    });
                }
            });
        });
    }

    run(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(query, params, function(err) {
                if (err) return reject(err);
                resolve({ id: this.lastID, changes: this.changes });
            });
        });
    }

    get(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(query, params, (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
    }

    all(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(query, params, (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }
}

module.exports = new DbService();
