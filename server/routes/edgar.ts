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

// GET /api/edgar/pay-vs-performance/:symbol
// Structured XBRL data (SEC "ecd" taxonomy, Item 402(v)) - see edgar.ts for
// why this is intentionally separate from the HTML-scraped proxy endpoint.
router.get('/pay-vs-performance/:symbol', apiLimiter, async (req, res, next) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const data = await edgarService.getPayVersusPerformance(symbol);
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

// 8. GET /api/edgar/filer-search?name=
router.get('/filer-search', apiLimiter, async (req, res, next) => {
  try {
    const nameQuery = req.query.name as string;
    if (!nameQuery) {
      return res.status(400).json({ error: 'Missing name parameter' });
    }
    
    // Check local SEC ticker-to-CIK file first as a naive match
    try {
      const { cacheService } = await import('../services/cache.js');
      const cacheKey = `filer_search_${nameQuery.toLowerCase()}`;
      let data = cacheService.get<any>(cacheKey);
      
      if (!data) {
        const url = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=${encodeURIComponent(nameQuery)}&output=atom`;
        const response = await fetch(url, {
          headers: { 'User-Agent': 'Stocklens Research Agent stocklens-admin@gmail.com' }
        });
        
        if (!response.ok) throw new Error(`SEC API returned status ${response.status}`);
        const xml = await response.text();
        
        // Extract CIK from the ATOM feed
        const cikMatch = xml.match(/<title>([^<]+)\s+\(CIK\s+(\d{10})\)<\/title>/);
        if (cikMatch) {
          data = { name: cikMatch[1].trim(), cik: cikMatch[2] };
        } else {
          // If no direct match in ATOM, try to parse the general HTML page or return 404
          const htmlUrl = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=${encodeURIComponent(nameQuery)}`;
          const htmlResponse = await fetch(htmlUrl, {
            headers: { 'User-Agent': 'Stocklens Research Agent stocklens-admin@gmail.com' }
          });
          const html = await htmlResponse.text();
          const htmlCikMatch = html.match(/CIK=(\d{10})/);
          if (htmlCikMatch) {
            data = { name: nameQuery, cik: htmlCikMatch[1] };
          } else {
             data = { error: 'No filer found' };
          }
        }
        
        if (!data.error) {
           cacheService.set(cacheKey, data, 3600 * 24); // Cache for 24 hours
        }
      }
      
      if (data.error) {
        return res.status(404).json(data);
      }
      res.json(data);
    } catch (fetchErr: any) {
      res.status(500).json({ error: fetchErr.message });
    }
  } catch (error) {
    next(error);
  }
});

export default router;

