import { Router } from 'express';
import db from '../services/db.js';
import { yahooService } from '../services/yahoo.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// 1. GET /api/watchlist -> retrieve watchlisted items with current quotes
router.get('/', apiLimiter, async (req, res, next) => {
  try {
    const listStmt = db.prepare('SELECT symbol, added_at FROM watchlist ORDER BY added_at DESC');
    const watchItems = listStmt.all() as Array<{ symbol: string; added_at: number }>;

    if (watchItems.length === 0) {
      return res.json([]);
    }

    const watchDetails = await Promise.all(
      watchItems.map(async (item) => {
        const symbol = item.symbol.toUpperCase();
        
        // Retrieve stock company name
        let name = symbol;
        let exchange = 'US';
        try {
          const profile = db.prepare('SELECT name, exchange FROM stocks WHERE symbol = ?').get(symbol) as any;
          if (profile) {
            name = profile.name;
            exchange = profile.exchange;
          }
        } catch (e) {}

        // Fetch quote data via waterfall
        let price = null;
        let change = 0;
        let change_pct = 0;

        try {
          const quote = await yahooService.getQuote(symbol);
          if (quote) {
            price = quote.price;
            change = quote.change;
            change_pct = quote.change_pct;
          }
        } catch (qErr) {
          // Check cached quotes backup in SQLite
          try {
            const row = db.prepare('SELECT price, change, change_pct FROM quotes WHERE symbol = ?').get(symbol) as any;
            if (row) {
              price = row.price;
              change = row.change;
              change_pct = row.change_pct;
            }
          } catch (sqliteErr) {}
        }

        // Return standardized object
        return {
          symbol,
          name,
          exchange,
          price,
          change,
          change_pct,
          added_at: item.added_at
        };
      })
    );

    res.json(watchDetails);
  } catch (error) {
    next(error);
  }
});

// 2. POST /api/watchlist/add -> add symbol to watchlist
router.post('/add', apiLimiter, (req, res, next) => {
  try {
    const symbol = req.body.symbol ? req.body.symbol.toString().toUpperCase().trim() : '';
    if (!symbol) {
      return res.status(400).json({ error: true, message: 'Stock symbol is required.' });
    }

    try {
      const stmt = db.prepare(`
        INSERT INTO watchlist (symbol, added_at)
        VALUES (?, ?)
      `);
      stmt.run(symbol, Date.now());
      res.json({ success: true, symbol, message: 'Added to watchlist successfully.' });
    } catch (insertErr: any) {
      if (insertErr.code === 'SQLITE_CONSTRAINT_PRIMARYKEY' || insertErr.message.includes('UNIQUE')) {
        return res.json({ success: true, symbol, message: 'Already exists in watchlist.' });
      }
      throw insertErr;
    }
  } catch (error) {
    next(error);
  }
});

// 3. DELETE /api/watchlist/:symbol -> remove symbol from watchlist
router.delete('/:symbol', apiLimiter, (req, res, next) => {
  const symbol = req.params.symbol.toUpperCase();

  try {
    const stmt = db.prepare('DELETE FROM watchlist WHERE symbol = ?');
    const info = stmt.run(symbol);

    res.json({
      success: true,
      symbol,
      deleted: info.changes > 0,
      message: 'Removed from watchlist successfully.'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
