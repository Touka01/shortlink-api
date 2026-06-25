const { DatabaseSync } = require("node:sqlite");
const path = require("path");

/**
 * Open (or create) the SQLite database and make sure the schema exists.
 * Uses Node's built-in SQLite, so there is no native module to compile.
 * Pass ":memory:" for tests so nothing touches disk.
 */
function createDb(file) {
  const location = file || path.join(__dirname, "..", "data.sqlite");
  const db = new DatabaseSync(location);
  db.exec("PRAGMA journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS links (
      code        TEXT PRIMARY KEY,
      url         TEXT NOT NULL,
      created_at  INTEGER NOT NULL,
      expires_at  INTEGER,
      clicks      INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS clicks (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      code       TEXT NOT NULL,
      ts         INTEGER NOT NULL,
      referrer   TEXT,
      user_agent TEXT,
      FOREIGN KEY (code) REFERENCES links(code)
    );
  `);

  return db;
}

module.exports = { createDb };
