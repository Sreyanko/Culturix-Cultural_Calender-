const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function openDb() {
    return open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });
}

async function initDb() {
    const db = await openDb();
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        );
        CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            content TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
    `);
    console.log("Database initialized.");
    return db;
}

module.exports = { openDb, initDb };
