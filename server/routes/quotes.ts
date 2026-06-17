import { Router } from 'express';
import { finnhubService } from '../services/finnhub.js';
import { yahooService } from '../services/yahoo.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// GET /api/quote/:symbol -> real-time price info
router.get('/:symbol', apiLimiter, async (req, res, next) => {
  const symbol = req.params.symbol.toUpperCase();

  try {
    let quoteData: any = null;
    let fallbackToYahoo = false;

    // --- LAYER 1: FINNHUB ---
    try {
      quoteData = await finnhubService.getQuote(symbol);
    } catch (err: any) {
      console.warn(`[QUOTE ROUTE FINNHUB FALLS] ${symbol} quote query failed. Shifting to Yahoo.`, err.message);
      fallbackToYahoo = true;
    }

    // --- LEVEL 2: YAHOO FINANCE (FALLBACK OR COMPLEMENTARY EXTRACTION) ---
    let extraMetrics: any = { high_52w: null, low_52w: null, volume: null, avg_volume: null };

    // Get supplementary basic financials (52W range & average volume)
    if (!fallbackToYahoo && quoteData) {
      try {
        const metrics: any = await finnhubService.getBasicFinancials(symbol);
        if (metrics?.metric) {
          extraMetrics.high_52w = metrics.metric['52WeekHigh'] || null;
          extraMetrics.low_52w = metrics.metric['52WeekLow'] || null;
          extraMetrics.volume = metrics.metric['10DayAverageTradingVolume'] || null; // standard metric
          extraMetrics.avg_volume = metrics.metric['3MonthAverageTradingVolume'] || null;
        }
      } catch (e: any) {
        console.warn(`[QUOTE ROUTE] Finnhub metrics fetch skipped or failed for ${symbol}:`, e.message);
      }
    }

    if (fallbackToYahoo || !quoteData) {
      try {
        // Fetch from yahooService as full quote fallback
        const yahooFinancials = await yahooService.getFinancials(symbol);
        if (yahooFinancials) {
          // If we had no quote, try yahoo quote scrape or extract from financials
          const indexCheck = await yahooService.getIndexQuote(symbol);
          if (indexCheck) {
            quoteData = indexCheck;
          }
        }
      } catch (yErr: any) {
        console.error(`[QUOTE ROUTE YAHOO FALLS TOO] Error scraping ${symbol}:`, yErr.message);
      }
    }

    // Standardize return payload
    const payload = {
      symbol,
      price: quoteData?.price || null,
      change: quoteData?.change ?? 0,
      change_pct: quoteData?.change_pct ?? 0,
      high: quoteData?.high || null,
      low: quoteData?.low || null,
      open: quoteData?.open || null,
      prev_close: quoteData?.prev_close || null,
      high_52w: extraMetrics.high_52w || quoteData?.high || null,
      low_52w: extraMetrics.low_52w || quoteData?.low || null,
      volume: extraMetrics.volume || null,
      avg_volume: extraMetrics.avg_volume || null,
      updated_at: Date.now()
    };

    // If we have nothing, check SQLite database quotes table as absolute final fallback!
    if (payload.price === null) {
      console.log(`[QUOTE FINAL FALLBACK] No quote found for ${symbol}. Inspecting SQLite cache...`);
      const stmt = dbPrepareQuote(symbol);
      if (stmt) {
        payload.price = stmt.price;
        payload.change = stmt.change;
        payload.change_pct = stmt.change_pct;
        payload.updated_at = stmt.updated_at;
      }
    }

    res.json(payload);
  } catch (error) {
    next(error);
  }
});

// SQLite lookup helper
import db from '../services/db.js';
function dbPrepareQuote(symbol: string): any {
  try {
    const stmt = db.prepare('SELECT price, change, change_pct, updated_at FROM quotes WHERE symbol = ?');
    return stmt.get(symbol) as any;
  } catch (e) {
    return null;
  }
}

export default router;
