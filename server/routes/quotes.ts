import { Router } from 'express';
import { yahooService } from '../services/yahoo.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import { cacheService, CACHE_TTLS } from '../services/cache.js';

const router = Router();

// Helper to format/scrub the response object for the client
function formatClientQuote(symbol: string, data: any) {
  return {
    symbol: symbol.toUpperCase(),
    price: data?.price !== undefined && data?.price !== null ? Number(data.price) : null,
    high: data?.high !== undefined && data?.high !== null ? Number(data.high) : null,
    low: data?.low !== undefined && data?.low !== null ? Number(data.low) : null,
    open: data?.open !== undefined && data?.open !== null ? Number(data.open) : null,
    prev_close: data?.prev_close !== undefined && data?.prev_close !== null ? Number(data.prev_close) : null,
    high_52w: data?.high_52w !== undefined && data?.high_52w !== null ? Number(data.high_52w) : null,
    low_52w: data?.low_52w !== undefined && data?.low_52w !== null ? Number(data.low_52w) : null,
    updated_at: data?.updated_at ? Number(data.updated_at) : Date.now()
  };
}

// GET /api/quote/:symbol -> real-time price info
router.get('/:symbol', apiLimiter, async (req, res, next) => {
  const symbol = req.params.symbol.toUpperCase();
  const cacheKey = `yahoo:quote:${symbol}`;

  try {
    // 1. Layer 1 (Memory Lookup)
    const cached = await cacheService.get<any>(cacheKey);
    if (cached) {
      cacheService.logHit('quote', symbol, 'MEMORY');
      return res.json(formatClientQuote(symbol, cached));
    }

    // 2. Layer 2 (Live Fetch)
    let liveData: any = null;
    try {
      liveData = await yahooService.getQuote(symbol);
      if (liveData && liveData.price !== null) {
        // 5. Cache Hydration Safeguard
        await cacheService.set(cacheKey, liveData, CACHE_TTLS.QUOTE);
        cacheService.saveQuoteBackup(symbol, {
          price: liveData.price,
          change: 0,
          change_pct: 0,
          high_52w: liveData.high_52w,
          low_52w: liveData.low_52w
        });
      }
    } catch (err: any) {
      console.warn(`[QUOTE ROUTE] Yahoo live fetch failed for ${symbol}:`, err.message);
    }

    // 3. Layer 3 (Database Fallback)
    if (!liveData || liveData.price === null) {
      const backup = cacheService.getQuoteBackup(symbol);
      if (backup) {
        cacheService.logHit('quote', symbol, 'SQLITE_FALLBACK');
        liveData = backup;
      }
    }

    // Response formatting and output
    if (liveData && liveData.price !== null) {
      return res.json(formatClientQuote(symbol, liveData));
    }

    // If absolutely nothing was found, return empty fields/null values
    return res.json(formatClientQuote(symbol, null));
  } catch (error) {
    next(error);
  }
});

export default router;
