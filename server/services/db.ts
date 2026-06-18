import Database from 'better-sqlite3';
import path from 'path';
import { SEED_STOCKS } from './seeds.js';

// Initialize Database
const dbPath = process.env.SQLITE_DB_PATH || path.resolve(process.cwd(), 'stocklens.db');
const db = new Database(dbPath);

// Enable WAL for performance and concurrent readers
db.pragma('journal_mode = WAL');

// Define database schemas
db.exec(`
  CREATE TABLE IF NOT EXISTS stocks (
    symbol TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    exchange TEXT NOT NULL,
    sector TEXT NOT NULL,
    industry TEXT NOT NULL,
    country TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS quotes (
    symbol TEXT PRIMARY KEY,
    price REAL NOT NULL,
    change REAL NOT NULL,
    change_pct REAL NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS fundamentals (
    symbol TEXT PRIMARY KEY,
    data TEXT NOT NULL, -- Stored as JSON string
    source TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT UNIQUE NOT NULL,
    added_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cache_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint TEXT NOT NULL,
    symbol TEXT NOT NULL,
    source TEXT NOT NULL,
    hit_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS edgar_cache (
    cache_key TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    fetched_at INTEGER NOT NULL
  );
`);

console.log('[DB] Database initialized successfully in WAL mode.');

// Seed database with preloaded stocks if empty
const countStmt = db.prepare('SELECT COUNT(*) as count FROM stocks');
const { count } = countStmt.get() as { count: number };

if (count === 0) {
  console.log('[DB] Seeding stock metadata table with 200 popular global equities...');
  const insertStmt = db.prepare(`
    INSERT INTO stocks (symbol, name, exchange, sector, industry, country)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction((stocks) => {
    for (const stock of stocks) {
      insertStmt.run(stock.symbol, stock.name, stock.exchange, stock.sector, stock.industry, stock.country);
    }
  });

  transaction(SEED_STOCKS);
  console.log(`[DB] Seeding complete. Seeding matched exactly ${SEED_STOCKS.length} entries.`);
} else {
  console.log(`[DB] Stocks table already has ${count} records. Skipping seeding.`);
}

export default db;
