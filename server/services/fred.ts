import db from './db.js';

export const ALLOWED_SERIES = new Set([
  "FEDFUNDS", "DGS10", "DGS2", "T10Y2Y", "BAMLH0A0HYM2",
  "CPIAUCSL", "PCEPI", "UNRATE", "PAYEMS", "GDPC1", "ICSA",
  "M2SL", "RSAFS", "HOUST", "UMCSENT"
]);

// 24-hour cache TTL
const SQLITE_TTL = 24 * 60 * 60 * 1000;

export const fredService = {
  getSeries: async (seriesId: string): Promise<any> => {
    const upperId = seriesId.toUpperCase();
    if (!ALLOWED_SERIES.has(upperId)) {
      throw new Error('Invalid seriesId');
    }

    const now = Date.now();
    
    // Check SQLite cache
    const row = db.prepare('SELECT data, fetched_at FROM fred_cache WHERE series_id = ?').get(upperId) as { data: string, fetched_at: number } | undefined;
    
    if (row) {
      if (now - row.fetched_at < SQLITE_TTL) {
        return JSON.parse(row.data);
      }
    }

    // Cache miss or expired, fetch from API
    const apiKey = process.env.FRED_API_KEY;
    if (!apiKey) {
      throw new Error('FRED API key not configured on server');
    }

    // Limit to the last 5 years
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    const observationStart = fiveYearsAgo.toISOString().split('T')[0]; // YYYY-MM-DD

    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${upperId}&api_key=${apiKey}&file_type=json&sort_order=asc&observation_start=${observationStart}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`FRED API responded with status ${response.status}`);
    }
    const json = await response.json();
    
    // Persist to SQLite
    try {
      db.prepare(
        'INSERT INTO fred_cache (series_id, data, fetched_at) VALUES (?, ?, ?) ON CONFLICT(series_id) DO UPDATE SET data=excluded.data, fetched_at=excluded.fetched_at'
      ).run(upperId, JSON.stringify(json), now);
    } catch (e: any) {
      console.warn('[FRED CACHE] SQLite write failed:', e.message);
    }

    return json;
  }
};
