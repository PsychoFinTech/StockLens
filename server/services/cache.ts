import NodeCache from 'node-cache';
import db from './db.js';

// Initialize NodeCache
// TTL values in seconds
const cache = new NodeCache({
  stdTTL: 300,        // Default 5 min
  checkperiod: 60     // Clean up expired items every 60s
});

export const CACHE_TTLS = {
  QUOTE: 300,         // 5 mins
  FUNDAMENTALS: 86400, // 24 hours
  NEWS: 1800,         // 30 mins
  PEERS: 604800       // 7 days
};

export const cacheService = {
  get: <T>(key: string): T | undefined => {
    return cache.get<T>(key);
  },

  set: <T>(key: string, value: T, ttlSeconds: number): boolean => {
    return cache.set(key, value, ttlSeconds);
  },

  // Log cached hits in the SQLite db
  logHit: (endpoint: string, symbol: string, source: string): void => {
    try {
      const stmt = db.prepare(`
        INSERT INTO cache_log (endpoint, symbol, source, hit_at)
        VALUES (?, ?, ?, ?)
      `);
      stmt.run(endpoint, symbol.toUpperCase(), source, Date.now());
    } catch (error) {
      console.error('[CACHE LOG ERROR]', error);
    }
  },

  // Retrieve cached fundamentals from SQLite as durable fallback backup
  getFundamentalsBackup: (symbol: string): any | null => {
    try {
      const stmt = db.prepare('SELECT data, source, updated_at FROM fundamentals WHERE symbol = ?');
      const row = stmt.get(symbol.toUpperCase()) as { data: string, source: string, updated_at: number } | undefined;
      if (row) {
        return {
          data: JSON.parse(row.data),
          source: row.source,
          updated_at: row.updated_at
        };
      }
    } catch (error) {
      console.error('[DB FUNDAMENTALS BACKUP GET ERROR]', error);
    }
    return null;
  },

  // Save successful fundamentals to SQLite
  saveFundamentalsBackup: (symbol: string, data: any, source: string): void => {
    try {
      const stmt = db.prepare(`
        INSERT INTO fundamentals (symbol, data, source, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(symbol) DO UPDATE SET
          data = excluded.data,
          source = excluded.source,
          updated_at = excluded.updated_at
      `);
      stmt.run(symbol.toUpperCase(), JSON.stringify(data), source, Date.now());
    } catch (error) {
      console.error('[DB FUNDAMENTALS BACKUP SAVE ERROR]', error);
    }
  },

  // Retrieve cached quote from SQLite as fallback backup
  getQuoteBackup: (symbol: string): any | null => {
    try {
      const stmt = db.prepare('SELECT price, change, change_pct, updated_at FROM quotes WHERE symbol = ?');
      const row = stmt.get(symbol.toUpperCase()) as any;
      if (row) {
        return row;
      }
    } catch (error) {
      console.error('[DB QUOTE BACKUP GET ERROR]', error);
    }
    return null;
  },

  // Save successful quote to SQLite
  saveQuoteBackup: (symbol: string, quote: { price: number, change: number, change_pct: number }): void => {
    try {
      const stmt = db.prepare(`
        INSERT INTO quotes (symbol, price, change, change_pct, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(symbol) DO UPDATE SET
          price = excluded.price,
          change = excluded.change,
          change_pct = excluded.change_pct,
          updated_at = excluded.updated_at
      `);
      stmt.run(symbol.toUpperCase(), quote.price, quote.change, quote.change_pct, Date.now());
    } catch (error) {
      console.error('[DB QUOTE BACKUP SAVE ERROR]', error);
    }
  }
};
