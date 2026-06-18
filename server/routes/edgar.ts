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

export default router;
