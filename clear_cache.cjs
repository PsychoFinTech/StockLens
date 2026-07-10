const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(process.cwd(), 'stocklens.db');
const db = new Database(dbPath);

try {
  const stmt = db.prepare('DELETE FROM edgar_cache');
  const info = stmt.run();
  console.log(`Successfully cleared ${info.changes} rows from edgar_cache.`);
} catch (err) {
  console.error("Error clearing cache:", err);
}
db.close();
