import NodeCache from 'node-cache';
import Redis from 'ioredis';
import db from './db.js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize NodeCache (fallback)
const localCache = new NodeCache({
  stdTTL: 300,        // Default 5 min
  checkperiod: 60     // Clean up expired items every 60s
});

let redisClient: Redis | undefined;
if (process.env.REDIS_URL) {
  redisClient = new Redis(process.env.REDIS_URL);
  redisClient.on('error', (err) => console.error('[REDIS CACHE ERROR]', err));
}

export const CACHE_TTLS = {
  QUOTE: 300,         // 5 mins
  FUNDAMENTALS: 86400, // 24 hours
  NEWS: 1800,         // 30 mins
  PEERS: 604800       // 7 days
};

export const cacheService = {
  get: async <T>(key: string): Promise<T | undefined> => {
    // L1: always check in-process cache first
    const l1Val = localCache.get<T>(key);
    if (l1Val !== undefined) return l1Val;

    if (redisClient) {
      try {
        const val = await redisClient.get(key);
        if (val) {
          const parsed = JSON.parse(val) as T;
          // Backfill L1 with a short TTL (max 60s)
          const remainingTtl = await redisClient.ttl(key);
          const l1Ttl = Math.min(remainingTtl > 0 ? remainingTtl : 60, 60);
          localCache.set(key, parsed, l1Ttl);
          return parsed;
        }
      } catch (err) {
        console.error('[REDIS GET ERROR]', err);
      }
      return undefined;
    }
    return undefined;
  },

  set: async <T>(key: string, value: T, ttlSeconds: number): Promise<boolean> => {
    // L1: always write to in-process cache with capped TTL
    const l1Ttl = Math.min(ttlSeconds, 60);
    localCache.set(key, value, l1Ttl);

    if (redisClient) {
      try {
        await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
        return true;
      } catch (err) {
        console.error('[REDIS SET ERROR]', err);
        return false;
      }
    }
    return true;
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
      const stmt = db.prepare('SELECT price, change, change_pct, high_52w, low_52w, updated_at FROM quotes WHERE symbol = ?');
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
  saveQuoteBackup: (symbol: string, quote: { price: number, change: number, change_pct: number, high_52w?: number | null, low_52w?: number | null }): void => {
    try {
      const stmt = db.prepare(`
        INSERT INTO quotes (symbol, price, change, change_pct, high_52w, low_52w, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(symbol) DO UPDATE SET
          price = excluded.price,
          change = excluded.change,
          change_pct = excluded.change_pct,
          high_52w = excluded.high_52w,
          low_52w = excluded.low_52w,
          updated_at = excluded.updated_at
      `);
      stmt.run(symbol.toUpperCase(), quote.price, quote.change, quote.change_pct, quote.high_52w ?? null, quote.low_52w ?? null, Date.now());
    } catch (error) {
      console.error('[DB QUOTE BACKUP SAVE ERROR]', error);
    }
  },

  // Retrieve cached shareholding from SQLite as durable fallback backup
  getShareholdingBackup: (symbol: string): any | null => {
    try {
      const stmt = db.prepare('SELECT data, updated_at FROM shareholding_cache WHERE symbol = ?');
      const row = stmt.get(symbol.toUpperCase()) as { data: string, updated_at: number } | undefined;
      if (row) {
        return {
          data: JSON.parse(row.data),
          updated_at: row.updated_at
        };
      }
    } catch (error) {
      console.error('[DB SHAREHOLDING BACKUP GET ERROR]', error);
    }
    return null;
  },

  // Save successful shareholding to SQLite
  saveShareholdingBackup: (symbol: string, data: any): void => {
    try {
      const stmt = db.prepare(`
        INSERT INTO shareholding_cache (symbol, data, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(symbol) DO UPDATE SET
          data = excluded.data,
          updated_at = excluded.updated_at
      `);
      stmt.run(symbol.toUpperCase(), JSON.stringify(data), Date.now());
    } catch (error) {
      console.error('[DB SHAREHOLDING BACKUP SAVE ERROR]', error);
    }
  },

  // Retrieve cached basic financials/ratios (PE, ROE, D/E etc.) from SQLite
  getRatiosBackup: (symbol: string): any | null => {
    try {
      const stmt = db.prepare('SELECT data, updated_at FROM ratios_cache WHERE symbol = ?');
      const row = stmt.get(symbol.toUpperCase()) as { data: string, updated_at: number } | undefined;
      if (row) {
        return { data: JSON.parse(row.data), updated_at: row.updated_at };
      }
    } catch (error) {
      console.error('[DB RATIOS BACKUP GET ERROR]', error);
    }
    return null;
  },

  // Save successful basic financials/ratios to SQLite (survives server restarts)
  saveRatiosBackup: (symbol: string, data: any): void => {
    try {
      const stmt = db.prepare(`
        INSERT INTO ratios_cache (symbol, data, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(symbol) DO UPDATE SET
          data = excluded.data,
          updated_at = excluded.updated_at
      `);
      stmt.run(symbol.toUpperCase(), JSON.stringify(data), Date.now());
    } catch (error) {
      console.error('[DB RATIOS BACKUP SAVE ERROR]', error);
    }
  }
};
