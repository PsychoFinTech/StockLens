import { Router } from 'express';
import { yahooService } from '../services/yahoo.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import db from '../services/db.js';

const router = Router();

// GET /api/quote/:symbol -> real-time price info
router.get('/:symbol', apiLimiter, async (req, res, next) => {
  const symbol = req.params.symbol.toUpperCase();

  try {
    let quoteData: any = null;

    // --- LAYER 1: YAHOO ---
    try {
      quoteData = await yahooService.getQuote(symbol);
    } catch (err: any) {
      console.warn(`[QUOTE ROUTE] Yahoo quote query failed for ${symbol}:`, err.message);
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
      high_52w: quoteData?.high_52w || quoteData?.high || null,
      low_52w: quoteData?.low_52w || quoteData?.low || null,
      volume: quoteData?.volume || null,
      avg_volume: quoteData?.avg_volume || null,
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
function dbPrepareQuote(symbol: string): any {
  try {
    const stmt = db.prepare('SELECT price, change, change_pct, updated_at FROM quotes WHERE symbol = ?');
    return stmt.get(symbol) as any;
  } catch (e) {
    return null;
  }
}

export default router;
