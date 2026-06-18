import { Router } from 'express';
import { yahooService } from '../services/yahoo.js';
import db from '../services/db.js';
import { searchLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// GET /api/search?q=apple -> autocomplete search route
router.get('/', searchLimiter, async (req, res, next) => {
  const query = (req.query.q || '').toString().trim();
  if (!query) {
    return res.json([]);
  }

  try {
    // 1. Search locally in our seeded list of S&P 500 and global equities in SQLite (extremely fast, zero API cost)
    const dbStmt = db.prepare(`
      SELECT symbol, name, exchange, sector, country 
      FROM stocks 
      WHERE symbol LIKE ? OR name LIKE ? 
      LIMIT 12
    `);
    
    const term = `%${query}%`;
    const localMatches = dbStmt.all(term, term) as Array<{
      symbol: string;
      name: string;
      exchange: string;
      sector: string;
      country: string;
    }>;

    // Standardize local results
    const results = localMatches.map(m => ({
      symbol: m.symbol,
      description: m.name,
      displaySymbol: m.symbol,
      type: 'Stock',
      exchange: m.exchange,
      country: m.country,
      isLocal: true
    }));

    // 2. Fetch from Finnhub as dynamic supplementary buffer (if search length > 1)
    if (query.length > 1) {
      try {
        const liveData: any = await yahooService.searchSymbol(query);
        if (liveData?.result && Array.isArray(liveData.result)) {
          // Normalize and merge without duplicates
          const seenSymbols = new Set(results.map(r => r.symbol.toUpperCase()));
          
          for (const item of liveData.result) {
            if (!item || !item.symbol) continue;
            const sym = item.symbol.toUpperCase();
            if (!seenSymbols.has(sym)) {
              results.push({
                symbol: item.symbol,
                description: item.description,
                displaySymbol: item.displaySymbol || item.symbol,
                type: item.type || 'Stock',
                exchange: item.exchange || 'Dynamic',
                country: 'Global',
                isLocal: false
              });
              seenSymbols.add(sym);
            }
          }
        }
      } catch (err) {
        console.warn('[SEARCH ROUTE WARNING] Live search fail (falling back exclusively to SQLite matches):', err);
      }
    }

    // Limit overall size & respond
    res.json(results.slice(0, 15));
  } catch (error) {
    next(error);
  }
});

export default router;
