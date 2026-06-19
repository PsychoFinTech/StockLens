import { Router } from 'express';
import { apiLimiter } from '../middleware/rateLimiter.js';
import { edgarService } from '../services/edgar.js';

const router = Router();

function handleEdgarError(error: any, res: any, next: any) {
  const msg = error.message || '';
  if (
    msg.includes('Could not resolve CIK') ||
    msg.includes('no SEC CIK') ||
    msg.includes('SEC API returned status 404') ||
    msg.includes('unresolved')
  ) {
    return res.status(404).json({ error: msg });
  }
  next(error);
}

// 1. GET /api/edgar/financials/:symbol
router.get('/financials/:symbol', apiLimiter, async (req, res, next) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const data = await edgarService.getFinancials(symbol);
    res.json(data);
  } catch (error) {
    handleEdgarError(error, res, next);
  }
});

// 2. GET /api/edgar/insiders/:symbol
router.get('/insiders/:symbol', apiLimiter, async (req, res, next) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const data = await edgarService.getInsiders(symbol);
    res.json(data);
  } catch (error) {
    handleEdgarError(error, res, next);
  }
});

// 3. GET /api/edgar/holdings/:cikOrSymbol
router.get('/holdings/:cikOrSymbol', apiLimiter, async (req, res, next) => {
  try {
    const cikOrSymbol = req.params.cikOrSymbol;
    const data = await edgarService.getHoldings(cikOrSymbol);
    res.json(data);
  } catch (error) {
    handleEdgarError(error, res, next);
  }
});

// 4. GET /api/edgar/section/:symbol/:item
router.get('/section/:symbol/:item', apiLimiter, async (req, res, next) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const item = req.params.item; // e.g. 1A or 7
    const data = await edgarService.getSection(symbol, item);
    res.json(data);
  } catch (error) {
    handleEdgarError(error, res, next);
  }
});

// 5. GET /api/edgar/risk-diff/:symbol
router.get('/risk-diff/:symbol', apiLimiter, async (req, res, next) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const data = await edgarService.getRiskDiff(symbol);
    res.json(data);
  } catch (error) {
    handleEdgarError(error, res, next);
  }
});

// GET /api/edgar/proxy/:symbol
router.get('/proxy/:symbol', apiLimiter, async (req, res, next) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const data = await edgarService.getProxyStatement(symbol);
    res.json(data);
  } catch (error) {
    handleEdgarError(error, res, next);
  }
});

// 6. GET /api/edgar/congress/trades
router.get('/congress/trades', apiLimiter, async (req, res, next) => {
  try {
    const { cacheService } = await import('../services/cache.js');
    const cacheKey = 'congress_trades_fmp';
    let data = cacheService.get<any>(cacheKey);
    
    if (!data) {
      const apiKey = process.env.FMP_API_KEY;
      if (!apiKey) throw new Error('FMP_API_KEY not configured');
      
      console.log('[CONGRESS] Cache miss. Fetching trades from FMP...');
      const response = await fetch(`https://financialmodelingprep.com/stable/senate-latest?apikey=${apiKey}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (!response.ok) throw new Error(`FMP API returned status ${response.status}`);
      data = await response.json();
      cacheService.set(cacheKey, data, 3600 * 6); // Cache for 6 hours
    }
    
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// 7. GET /api/edgar/congress/committees (kept for backward compat, FMP data doesn't need it)
router.get('/congress/committees', apiLimiter, async (_req, res) => {
  res.json({});
});

export default router;

