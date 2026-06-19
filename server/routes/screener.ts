import { Router } from 'express';
import db from '../services/db.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import { cacheService } from '../services/cache.js';

const router = Router();

// GET /api/screener -> Filter our seeded S&P 500 and global equities
router.get('/', apiLimiter, (req, res, next) => {
  try {
    const exchangeFilter = req.query.exchange ? req.query.exchange.toString().trim() : '';
    const sectorFilter = req.query.sector ? req.query.sector.toString().trim() : '';
    const minMcap = req.query.minMcap ? Number(req.query.minMcap) : 0;
    const maxMcap = req.query.maxMcap ? Number(req.query.maxMcap) : 3000000; // in millions ($3T)
    const minPe = req.query.minPe ? Number(req.query.minPe) : 0;
    const maxPe = req.query.maxPe ? Number(req.query.maxPe) : 150;
    const minRoe = req.query.minRoe ? Number(req.query.minRoe) : 0; // % gauge
    const maxDe = req.query.maxDe ? Number(req.query.maxDe) : 5.0; // debt to equity limit

    // 1. Fetch matching base stock records from SQLite stocks table
    let sql = 'SELECT symbol, name, exchange, sector, industry, country FROM stocks WHERE 1=1';
    const params: any[] = [];

    if (exchangeFilter && exchangeFilter !== 'ALL') {
      sql += ' AND exchange = ?';
      params.push(exchangeFilter);
    }

    if (sectorFilter && sectorFilter !== 'ALL') {
      sql += ' AND sector = ?';
      params.push(sectorFilter);
    }

    const stmt = db.prepare(sql);
    const matchedStocks = stmt.all(...params) as Array<{
      symbol: string;
      name: string;
      exchange: string;
      sector: string;
      industry: string;
      country: string;
    }>;

    // 2. Decorate each matched stock with real cached metrics or null
    const decorated = matchedStocks.map(stock => {
      const sym = stock.symbol;
      
      // Check if real cached quote exists
      const qStmt = db.prepare('SELECT price, change_pct FROM quotes WHERE symbol = ?');
      const realQuote = qStmt.get(sym) as { price: number, change_pct: number } | undefined;

      // Check if real cached fundamentals exist
      const fStmt = db.prepare('SELECT data FROM fundamentals WHERE symbol = ?');
      const realFund = fStmt.get(sym) as { data: string } | undefined;

      let fundData: any = null;
      if (realFund) {
        try {
          fundData = JSON.parse(realFund.data);
        } catch (e) {}
      }

      // Check basic financials node cache
      const cachedRatios = cacheService.get<any>(`yahoo:basic:${sym}`);

      const price = realQuote ? realQuote.price : null;
      const changePct = realQuote ? realQuote.change_pct : null;

      const pe = cachedRatios?.metric?.peAnnual !== undefined ? cachedRatios.metric.peAnnual : null;
      const roe = cachedRatios?.metric?.roeTTM !== undefined ? cachedRatios.metric.roeTTM : (fundData?.ratios?.returnOnEquity ? fundData.ratios.returnOnEquity * 100 : null);
      const de = cachedRatios?.metric?.debtEquityAnnual !== undefined ? cachedRatios.metric.debtEquityAnnual : (fundData?.ratios?.debtToEquity ? fundData.ratios.debtToEquity : null);
      const market_cap = cachedRatios?.metric?.marketCapitalization ? cachedRatios.metric.marketCapitalization * 1000000 : null;
      
      // Return payload elements
      return {
        symbol: sym,
        name: stock.name,
        exchange: stock.exchange,
        sector: stock.sector,
        industry: stock.industry,
        country: stock.country,
        price,
        change_pct: changePct,
        market_cap,
        pe,
        roe,
        debt_equity: de
      };
    });

    // 3. Filter the complete arrays using query parameters
    const filtered = decorated.filter(item => {
      const mcapM = item.market_cap !== null ? item.market_cap / 1000000 : null;
      
      const passMcap = mcapM === null || (mcapM >= minMcap && mcapM <= maxMcap);
      const passPe = item.pe === null || (item.pe >= minPe && item.pe <= maxPe);
      const passRoe = item.roe === null || (item.roe >= minRoe);
      const passDe = item.debt_equity === null || (item.debt_equity <= maxDe);

      return passMcap && passPe && passRoe && passDe;
    });

    // 4. Order and pagination
    const sortBy = req.query.sortBy ? req.query.sortBy.toString() : 'market_cap';
    const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';

    filtered.sort((a: any, b: any) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
    });

    // Slice for page
    const page = req.query.page ? Math.max(1, Number(req.query.page)) : 1;
    const limit = 20;
    const offset = (page - 1) * limit;
    const paginated = filtered.slice(offset, offset + limit);

    res.json({
      results: paginated,
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit)
    });

  } catch (error) {
    next(error);
  }
});

export default router;
