import { Router } from 'express';
import db from '../services/db.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import { cacheService } from '../services/cache.js';
import { warmAllRatios } from '../services/ratiosWarmer.js';

const router = Router();

// Translation mappings for user-friendly frontend labels to database values
const SECTOR_MAP: Record<string, string[]> = {
  'Technology': ['Technology', 'Information Technology'],
  'Healthcare': ['Healthcare', 'Health Care'],
  'Financial Services': ['Financial Services', 'Financials', 'Financial'],
  'Consumer Cyclical': ['Consumer Cyclical', 'Consumer Discretionary'],
  'Consumer Defensive': ['Consumer Defensive', 'Consumer Staples'],
  'Basic Materials': ['Basic Materials', 'Materials']
};

const EXCHANGE_MAP: Record<string, string[]> = {
  'TSE': ['TSE', 'Tokyo']
};

// GET /api/screener -> Filter our seeded S&P 500 and global equities
router.get('/', apiLimiter, (req, res, next) => {
  try {
    console.log('[SCREENER] Received query:', req.query);
    const rawExchange = req.query.exchange ? req.query.exchange.toString().trim() : '';
    const rawSector = req.query.sector ? req.query.sector.toString().trim() : '';
    const searchQuery = req.query.q ? req.query.q.toString().trim().toUpperCase() : '';

    let exchangeFilter: string[] = [];
    if (rawExchange && rawExchange !== 'ALL') {
      const parts = rawExchange.split(',').map(s => s.trim()).filter(Boolean);
      for (const ex of parts) {
        const mapped = EXCHANGE_MAP[ex] || [ex];
        exchangeFilter.push(...mapped);
      }
    }

    let sectorFilter: string[] = [];
    if (rawSector && rawSector !== 'ALL') {
      const parts = rawSector.split(',').map(s => s.trim()).filter(Boolean);
      for (const sec of parts) {
        const mapped = SECTOR_MAP[sec] || [sec];
        sectorFilter.push(...mapped);
      }
    }

    const minMcap = req.query.minMcap ? Number(req.query.minMcap) : null;
    const maxMcap = req.query.maxMcap ? Number(req.query.maxMcap) : null;
    const minPeTrailing = req.query.minPeTrailing ? Number(req.query.minPeTrailing) : null;
    const maxPeTrailing = req.query.maxPeTrailing ? Number(req.query.maxPeTrailing) : null;
    const minPeForward = req.query.minPeForward ? Number(req.query.minPeForward) : null;
    const maxPeForward = req.query.maxPeForward ? Number(req.query.maxPeForward) : null;
    const minPeg = req.query.minPeg ? Number(req.query.minPeg) : null;
    const maxPeg = req.query.maxPeg ? Number(req.query.maxPeg) : null;
    const minPb = req.query.minPb ? Number(req.query.minPb) : null;
    const maxPb = req.query.maxPb ? Number(req.query.maxPb) : null;
    const minPs = req.query.minPs ? Number(req.query.minPs) : null;
    const maxPs = req.query.maxPs ? Number(req.query.maxPs) : null;
    const minDiv = req.query.minDiv ? Number(req.query.minDiv) : null;
    const maxDiv = req.query.maxDiv ? Number(req.query.maxDiv) : null;

    const minRoe = req.query.minRoe ? Number(req.query.minRoe) : null;
    const maxRoe = req.query.maxRoe ? Number(req.query.maxRoe) : null;
    const minRoa = req.query.minRoa ? Number(req.query.minRoa) : null;
    const maxRoa = req.query.maxRoa ? Number(req.query.maxRoa) : null;
    const minDe = req.query.minDe ? Number(req.query.minDe) : null;
    const maxDe = req.query.maxDe ? Number(req.query.maxDe) : null;
    const minCurrentRatio = req.query.minCurrentRatio ? Number(req.query.minCurrentRatio) : null;
    const maxCurrentRatio = req.query.maxCurrentRatio ? Number(req.query.maxCurrentRatio) : null;

    const minRevGrowth = req.query.minRevGrowth ? Number(req.query.minRevGrowth) : null;
    const maxRevGrowth = req.query.maxRevGrowth ? Number(req.query.maxRevGrowth) : null;
    const minEpsGrowth = req.query.minEpsGrowth ? Number(req.query.minEpsGrowth) : null;
    const maxEpsGrowth = req.query.maxEpsGrowth ? Number(req.query.maxEpsGrowth) : null;
    const minGrossMargin = req.query.minGrossMargin ? Number(req.query.minGrossMargin) : null;
    const maxGrossMargin = req.query.maxGrossMargin ? Number(req.query.maxGrossMargin) : null;
    const minOpMargin = req.query.minOpMargin ? Number(req.query.minOpMargin) : null;
    const maxOpMargin = req.query.maxOpMargin ? Number(req.query.maxOpMargin) : null;
    const minNetMargin = req.query.minNetMargin ? Number(req.query.minNetMargin) : null;
    const maxNetMargin = req.query.maxNetMargin ? Number(req.query.maxNetMargin) : null;

    const minFcf = req.query.minFcf ? Number(req.query.minFcf) : null;
    const maxFcf = req.query.maxFcf ? Number(req.query.maxFcf) : null;
    const minTotalDebt = req.query.minTotalDebt ? Number(req.query.minTotalDebt) : null;
    const maxTotalDebt = req.query.maxTotalDebt ? Number(req.query.maxTotalDebt) : null;

    // 1. Fetch matching base stock records from SQLite stocks table
    let sql = 'SELECT symbol, name, exchange, sector, industry, country FROM stocks WHERE 1=1';
    const params: any[] = [];

    if (exchangeFilter.length > 0) {
      const placeholders = exchangeFilter.map(() => '?').join(',');
      sql += ` AND exchange IN (${placeholders})`;
      params.push(...exchangeFilter);
    }

    if (sectorFilter.length > 0) {
      const placeholders = sectorFilter.map(() => '?').join(',');
      sql += ` AND sector IN (${placeholders})`;
      params.push(...sectorFilter);
    }

    if (searchQuery) {
      sql += ' AND (UPPER(symbol) LIKE ? OR UPPER(name) LIKE ?)';
      params.push(`%${searchQuery}%`, `%${searchQuery}%`);
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
    console.log('[SCREENER] Matched base stocks count:', matchedStocks.length);

    // 2. Decorate each matched stock with real cached metrics or null
    const symbols = matchedStocks.map(s => s.symbol);
    const quoteMap = new Map<string, { price: number; change_pct: number }>();
    const fundMap = new Map<string, string>();

    if (symbols.length > 0) {
      const placeholders = symbols.map(() => '?').join(',');
      try {
        const quoteRows = db.prepare(
          `SELECT symbol, price, change_pct FROM quotes WHERE symbol IN (${placeholders})`
        ).all(...symbols) as Array<{ symbol: string; price: number; change_pct: number }>;
        for (const r of quoteRows) {
          quoteMap.set(r.symbol, r);
        }
      } catch (e) {
        console.error('[SCREENER DB ERROR] Failed fetching quote rows', e);
      }

      try {
        const fundRows = db.prepare(
          `SELECT symbol, data FROM fundamentals WHERE symbol IN (${placeholders})`
        ).all(...symbols) as Array<{ symbol: string; data: string }>;
        for (const r of fundRows) {
          fundMap.set(r.symbol, r.data);
        }
      } catch (e) {
        console.error('[SCREENER DB ERROR] Failed fetching fundamental rows', e);
      }
    }

    const decorated = matchedStocks.map(stock => {
      const sym = stock.symbol;
      
      const realQuote = quoteMap.get(sym);
      const realFundData = fundMap.get(sym);

      let fundData: any = null;
      if (realFundData) {
        try {
          fundData = JSON.parse(realFundData);
        } catch (e) {}
      }

      // Check basic financials node cache
      let cachedRatios = cacheService.get<any>(`yahoo:basic:${sym}`);
      if (!cachedRatios) {
        const ratiosBackup = cacheService.getRatiosBackup(sym);
        if (ratiosBackup) {
          cachedRatios = ratiosBackup.data;
        }
      }

      const price = realQuote ? realQuote.price : null;
      const changePct = realQuote ? realQuote.change_pct : null;

      const m = cachedRatios?.metric || {};

      // Retrieve all 20 metrics
      const peTrailing = m.peTrailing !== undefined ? m.peTrailing : (m.peAnnual || null);
      const peForward = m.peForward !== undefined ? m.peForward : null;
      const peg = m.pegRatio !== undefined ? m.pegRatio : (fundData?.ratios?.pegRatio || null);
      const pb = m.priceToBook !== undefined ? m.priceToBook : (fundData?.ratios?.priceToBook || null);
      const ps = m.priceToSales !== undefined ? m.priceToSales : null;
      const dividend = m.dividendYield !== undefined ? m.dividendYield : (fundData?.ratios?.dividendYield ? fundData.ratios.dividendYield * 100 : null);
      
      const roe = m.roeTTM !== undefined ? m.roeTTM : (fundData?.ratios?.returnOnEquity ? fundData.ratios.returnOnEquity * 100 : null);
      const roa = m.roaTTM !== undefined ? m.roaTTM : (fundData?.ratios?.returnOnAssets ? fundData.ratios.returnOnAssets * 100 : null);
      const de = m.debtEquityAnnual !== undefined ? m.debtEquityAnnual : (fundData?.ratios?.debtToEquity ? fundData.ratios.debtToEquity : null);
      const current_ratio = m.currentRatio !== undefined ? m.currentRatio : (fundData?.ratios?.currentRatio || null);
      
      const rev_growth = m.revenueGrowth !== undefined ? m.revenueGrowth : null;
      const eps_growth = m.earningsGrowth !== undefined ? m.earningsGrowth : null;
      const gross_margin = m.grossMargins !== undefined ? m.grossMargins : null;
      const operating_margin = m.operatingMargins !== undefined ? m.operatingMargins : null;
      const net_margin = m.profitMargins !== undefined ? m.profitMargins : (fundData?.ratios?.profitMargins ? fundData.ratios.profitMargins * 100 : null);
      
      const fcf = m.freeCashflow !== undefined ? m.freeCashflow : null;
      const total_debt = m.totalDebt !== undefined ? m.totalDebt : null;
      const market_cap = m.marketCapitalization ? m.marketCapitalization * 1000000 : null;
      
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

        // Valuation
        peTrailing,
        peForward,
        peg,
        pb,
        ps,
        dividend,

        // Ratios
        roe,
        roa,
        debt_equity: de,
        current_ratio,

        // Income Statement
        rev_growth,
        eps_growth,
        gross_margin,
        operating_margin,
        net_margin,

        // Balance Sheet
        fcf,
        total_debt
      };
    });

    // 3. Filter the complete arrays using query parameters
    const filtered = decorated.filter(item => {
      const mcapM = item.market_cap !== null ? item.market_cap / 1000000 : null;
      
      const passMcap = (minMcap === null || (mcapM !== null && mcapM >= minMcap)) && (maxMcap === null || (mcapM !== null && mcapM <= maxMcap));
      
      const passPeTrailing = (minPeTrailing === null || (item.peTrailing !== null && item.peTrailing >= minPeTrailing)) && (maxPeTrailing === null || (item.peTrailing !== null && item.peTrailing <= maxPeTrailing));
      const passPeForward = (minPeForward === null || (item.peForward !== null && item.peForward >= minPeForward)) && (maxPeForward === null || (item.peForward !== null && item.peForward <= maxPeForward));
      const passPeg = (minPeg === null || (item.peg !== null && item.peg >= minPeg)) && (maxPeg === null || (item.peg !== null && item.peg <= maxPeg));
      const passPb = (minPb === null || (item.pb !== null && item.pb >= minPb)) && (maxPb === null || (item.pb !== null && item.pb <= maxPb));
      const passPs = (minPs === null || (item.ps !== null && item.ps >= minPs)) && (maxPs === null || (item.ps !== null && item.ps <= maxPs));
      const passDiv = (minDiv === null || (item.dividend !== null && item.dividend >= minDiv)) && (maxDiv === null || (item.dividend !== null && item.dividend <= maxDiv));

      const passRoe = (minRoe === null || (item.roe !== null && item.roe >= minRoe)) && (maxRoe === null || (item.roe !== null && item.roe <= maxRoe));
      const passRoa = (minRoa === null || (item.roa !== null && item.roa >= minRoa)) && (maxRoa === null || (item.roa !== null && item.roa <= maxRoa));
      const passDe = (minDe === null || (item.debt_equity !== null && item.debt_equity >= minDe)) && (maxDe === null || (item.debt_equity !== null && item.debt_equity <= maxDe));
      const passCurrentRatio = (minCurrentRatio === null || (item.current_ratio !== null && item.current_ratio >= minCurrentRatio)) && (maxCurrentRatio === null || (item.current_ratio !== null && item.current_ratio <= maxCurrentRatio));

      const passRevGrowth = (minRevGrowth === null || (item.rev_growth !== null && item.rev_growth >= minRevGrowth)) && (maxRevGrowth === null || (item.rev_growth !== null && item.rev_growth <= maxRevGrowth));
      const passEpsGrowth = (minEpsGrowth === null || (item.eps_growth !== null && item.eps_growth >= minEpsGrowth)) && (maxEpsGrowth === null || (item.eps_growth !== null && item.eps_growth <= maxEpsGrowth));
      const passGrossMargin = (minGrossMargin === null || (item.gross_margin !== null && item.gross_margin >= minGrossMargin)) && (maxGrossMargin === null || (item.gross_margin !== null && item.gross_margin <= maxGrossMargin));
      const passOpMargin = (minOpMargin === null || (item.operating_margin !== null && item.operating_margin >= minOpMargin)) && (maxOpMargin === null || (item.operating_margin !== null && item.operating_margin <= maxOpMargin));
      const passNetMargin = (minNetMargin === null || (item.net_margin !== null && item.net_margin >= minNetMargin)) && (maxNetMargin === null || (item.net_margin !== null && item.net_margin <= maxNetMargin));

      const passFcf = (minFcf === null || (item.fcf !== null && item.fcf >= minFcf)) && (maxFcf === null || (item.fcf !== null && item.fcf <= maxFcf));
      const passTotalDebt = (minTotalDebt === null || (item.total_debt !== null && item.total_debt >= minTotalDebt)) && (maxTotalDebt === null || (item.total_debt !== null && item.total_debt <= maxTotalDebt));

      return passMcap && passPeTrailing && passPeForward && passPeg && passPb && passPs && passDiv && passRoe && passRoa && passDe && passCurrentRatio && passRevGrowth && passEpsGrowth && passGrossMargin && passOpMargin && passNetMargin && passFcf && passTotalDebt;
    });
    console.log('[SCREENER] Final filtered matches count:', filtered.length);

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

// GET /api/screener/cache-status -> Diagnostic: how many seeded symbols
// currently have ratios data in the SQLite ratios_cache table, and how
// stale that data is.
router.get('/cache-status', apiLimiter, (req, res, next) => {
  try {
    const totalStocks = (db.prepare('SELECT COUNT(*) as c FROM stocks').get() as { c: number }).c;
    const totalRatios = (db.prepare('SELECT COUNT(*) as c FROM ratios_cache').get() as { c: number }).c;

    const staleCutoff = Date.now() - 24 * 60 * 60 * 1000;
    const freshRatios = (
      db.prepare('SELECT COUNT(*) as c FROM ratios_cache WHERE updated_at >= ?').get(staleCutoff) as { c: number }
    ).c;

    const missing = (
      db.prepare(`
        SELECT s.symbol FROM stocks s
        LEFT JOIN ratios_cache r ON s.symbol = r.symbol
        WHERE r.symbol IS NULL
        LIMIT 50
      `).all() as Array<{ symbol: string }>
    ).map(r => r.symbol);

    res.json({
      totalSeededStocks: totalStocks,
      symbolsWithAnyRatiosData: totalRatios,
      symbolsWithFreshRatiosData: freshRatios,
      coveragePct: totalStocks > 0 ? Math.round((totalRatios / totalStocks) * 100) : 0,
      freshCoveragePct: totalStocks > 0 ? Math.round((freshRatios / totalStocks) * 100) : 0,
      sampleMissingSymbols: missing,
      note: 'If coveragePct is low, the ratiosWarmer has not successfully completed for most of the universe. Trigger POST /api/screener/warm-cache to force a run, then check this endpoint again in a few minutes.'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/screener/warm-cache -> Manually trigger the full-universe ratios
// warm-up immediately instead of waiting for the 9:30AM cron job.
router.post('/warm-cache', apiLimiter, async (req, res, next) => {
  try {
    warmAllRatios().catch((err) => console.error('[MANUAL WARM TRIGGER ERROR]', err));
    res.json({
      status: 'started',
      note: 'Warming has been triggered in the background. This can take several minutes for the full universe. Poll GET /api/screener/cache-status to track progress.'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
