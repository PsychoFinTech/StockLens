import axios from 'axios';
import { cacheService, CACHE_TTLS } from './cache.js';

const BASE_URL = 'https://finnhub.io/api/v1';

let activeKeyIndex = 0;

// Token resolver checking env variable for multiple keys (comma-separated), falling back to env single key, and then user keys
const getApiKeys = (): string[] => {
  const envKeys = process.env.FINNHUB_API_KEYS;
  if (envKeys) {
    return envKeys.split(',').map(k => k.trim()).filter(Boolean);
  }
  const envSingleKey = process.env.FINNHUB_API_KEY;
  if (envSingleKey) {
    return [envSingleKey];
  }
  return [
    'd8pfr5pr01qgoi5jev50d8pfr5pr01qgoi5jev5g',
    'd8pfrl1r01qgoi5jf4d0d8pfrl1r01qgoi5jf4dg',
    'd8p5luhr01qp954vcjpgd8p5luhr01qp954vcjq0'
  ];
};

// Generic safe fetch handler with caching and rate limit detection + key rotation failover
async function fetchFinnhub<T>(endpoint: string, params: Record<string, any> = {}, cacheTtl?: number): Promise<T | null> {
  const keys = getApiKeys();
  const maxRetries = keys.length;
  
  // Construct a unique cache key based on query params
  const paramString = Object.entries(params).map(([k, v]) => `${k}=${v}`).sort().join('&');
  const cacheKey = `finnhub:${endpoint}:${paramString}`;

  // Check cache
  if (cacheTtl) {
    const cached = cacheService.get<T>(cacheKey);
    if (cached) {
      cacheService.logHit(endpoint, (params.symbol || params.q || 'general'), 'MEMCACHE_FINNHUB');
      return cached;
    }
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const token = keys[activeKeyIndex];
    const url = `${BASE_URL}${endpoint}`;

    console.log(`[FINNHUB] API Requesting (Attempt ${attempt + 1}/${maxRetries} using key index ${activeKeyIndex}): ${url}?${paramString}`);
    try {
      const response = await axios.get<T>(url, {
        params: { ...params, token },
        timeout: 8000
      });

      if (response.status === 429) {
        console.warn(`[FINNHUB WARNING] Rate limit hit (429) on API key index ${activeKeyIndex}`);
        activeKeyIndex = (activeKeyIndex + 1) % keys.length;
        console.log(`[FINNHUB ROTATION] Rotated to API key index ${activeKeyIndex}`);
        continue;
      }

      const data = response.data;
      if (cacheTtl && data) {
        cacheService.set(cacheKey, data, cacheTtl);
      }
      return data;
    } catch (error: any) {
      const status = error.response?.status;
      const isRateLimit = status === 429 || error.message?.includes('429');
      const isUnauthorized = status === 401;

      if (isRateLimit || isUnauthorized) {
        console.warn(`[FINNHUB WARNING] API Key issue (status ${status || 'unknown'}) trapped for index ${activeKeyIndex}`);
        activeKeyIndex = (activeKeyIndex + 1) % keys.length;
        console.log(`[FINNHUB ROTATION] Rotated to API key index ${activeKeyIndex} due to status ${status}`);
        continue;
      }

      if (status === 403) {
        console.warn(`[FINNHUB WARN] Endpoint forbidden (403): ${endpoint}. This usually means your API token does not have access to this premium/specific endpoint.`);
        return null;
      }

      console.error(`[FINNHUB ERROR] Endpoint fallback fail: ${endpoint}`, error.message);
      throw error;
    }
  }

  console.error('[FINNHUB FATAL] Exhausted all configured API keys due to rate limit/authorization errors.');
  throw new Error('FINNHUB_RATE_LIMIT');
}

export const finnhubService = {
  // Real-time quote: GET /quote?symbol=AAPL
  getQuote: async (symbol: string) => {
    try {
      const data = await fetchFinnhub<{ c: number; d: number; dp: number; h: number; l: number; o: number; pc: number; v?: number }>(
        '/quote',
        { symbol: symbol.toUpperCase() },
        CACHE_TTLS.QUOTE
      );
      if (!data || data.c === 0) return null;
      
      const mapped = {
        price: data.c,
        change: data.d,
        change_pct: data.dp,
        high: data.h,
        low: data.l,
        open: data.o,
        prev_close: data.pc
      };

      // Store in SQLite DB as backup on success
      cacheService.saveQuoteBackup(symbol, mapped);
      return mapped;
    } catch (e: any) {
      if (e.message === 'FINNHUB_RATE_LIMIT') throw e;
      // Fetch backup from SQLite
      const backup = cacheService.getQuoteBackup(symbol);
      if (backup) {
        console.log(`[FINNHUB] Returning SQLite DB backup for quote of ${symbol}`);
        return backup;
      }
      throw e;
    }
  },

  // Company profile: GET /stock/profile2?symbol=AAPL
  getProfile: async (symbol: string) => {
    return fetchFinnhub<any>(
      '/stock/profile2', 
      { symbol: symbol.toUpperCase() }, 
      CACHE_TTLS.FUNDAMENTALS
    );
  },

  // Basic financials: GET /stock/metric?symbol=AAPL&metric=all
  getBasicFinancials: async (symbol: string) => {
    return fetchFinnhub<any>(
      '/stock/metric',
      { symbol: symbol.toUpperCase(), metric: 'all' },
      CACHE_TTLS.FUNDAMENTALS
    );
  },

  // Peers: GET /stock/peers?symbol=AAPL
  getPeers: async (symbol: string) => {
    return fetchFinnhub<string[]>(
      '/stock/peers',
      { symbol: symbol.toUpperCase() },
      CACHE_TTLS.PEERS
    );
  },

  // Company News: GET /company-news?symbol=AAPL&from=Y-M-D&to=Y-M-D
  getNews: async (symbol: string) => {
    const toDate = new Date().toISOString().split('T')[0];
    const fromDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // last 60 days
    return fetchFinnhub<any[]>(
      '/company-news',
      { symbol: symbol.toUpperCase(), from: fromDate, to: toDate },
      CACHE_TTLS.NEWS
    );
  },

  // General news: GET /news?category=general
  getMarketNews: async () => {
    return fetchFinnhub<any[]>(
      '/news',
      { category: 'general' },
      CACHE_TTLS.NEWS
    );
  },

  // Symbol Autocomplete: GET /search?q=apple
  searchSymbol: async (query: string) => {
    return fetchFinnhub<any>(
      '/search',
      { q: query },
      CACHE_TTLS.NEWS // 30 min lookup cache
    );
  },

  // Reported financials (Income Statement): GET /financials-reported?symbol=AAPL&freq=annual
  getIncomeStatement: async (symbol: string) => {
    return fetchFinnhub<any>(
      '/financials-reported',
      { symbol: symbol.toUpperCase(), freq: 'annual' },
      CACHE_TTLS.FUNDAMENTALS
    );
  },

  // Prices / Candles: GET /stock/candle?symbol=AAPL&resolution=D&from=X&to=Y
  getCandles: async (symbol: string, resolution: string, from: number, to: number) => {
    // Candles require customized cache per bounds
    return fetchFinnhub<any>(
      '/stock/candle',
      {
        symbol: symbol.toUpperCase(),
        resolution,
        from,
        to
      },
      300 // default 5-min quotes cache on daily metrics
    );
  }
};
