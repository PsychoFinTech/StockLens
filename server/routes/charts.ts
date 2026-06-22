import { Router } from 'express';
import db from '../services/db.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = Router();


// GET /api/chart/:symbol?period=1Y -> historical candle points
router.get('/:symbol', apiLimiter, async (req, res, next) => {
  const symbol = req.params.symbol.toUpperCase();
  const period = (req.query.period || '1Y').toString().toUpperCase();

  try {
    const to = Math.floor(Date.now() / 1000);
    let from = to - (365 * 24 * 3600); // default 1Y
    let resolution = 'D';

    // Parse period and resolution according to specifications
    switch (period) {
      case '1D':
        from = Math.floor((Date.now() - 24 * 3600 * 1000) / 1000);
        resolution = '5'; // 5min
        break;
      case '5D':
        from = Math.floor((Date.now() - 5 * 24 * 3600 * 1000) / 1000);
        resolution = '15'; // 15min
        break;
      case '1M':
        from = Math.floor((Date.now() - 30 * 24 * 3600 * 1000) / 1000);
        resolution = 'D'; // 1day
        break;
      case '6M':
        from = Math.floor((Date.now() - 180 * 24 * 3600 * 1000) / 1000);
        resolution = 'D'; // 1day
        break;
      case 'YTD':
        const startOfYear = new Date(new Date().getFullYear(), 0, 1);
        from = Math.floor(startOfYear.getTime() / 1000);
        resolution = 'D'; // 1day
        break;
      case '1Y':
        from = Math.floor((Date.now() - 365 * 24 * 3600 * 1000) / 1000);
        resolution = 'W'; // 1week
        break;
      case '5Y':
        from = Math.floor((Date.now() - 5 * 365 * 24 * 3600 * 1000) / 1000);
        resolution = 'M'; // 1month
        break;
      case 'MAX':
        from = Math.floor((Date.now() - 15 * 365 * 24 * 3600 * 1000) / 1000);
        resolution = 'M'; // 1month
        break;
      default:
        from = Math.floor((Date.now() - 365 * 24 * 3600 * 1000) / 1000);
        resolution = 'D';
        break;
    }

    let chartData: any[] = [];

    try {
      const rows = db.prepare(`
        SELECT * FROM historical_prices 
        WHERE symbol = ? AND date >= ? AND date <= ?
        ORDER BY date ASC
      `).all(symbol, from, to) as any[];

      if (rows.length > 0) {
        chartData = rows.map((r: any) => ({
          date: new Date(r.date * 1000).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: period === '5Y' || period === 'MAX' ? '2-digit' : undefined
          }),
          timestamp: r.date,
          close: Number(r.close?.toFixed(2) || 0),
          open: Number(r.open?.toFixed(2) || 0),
          high: Number(r.high?.toFixed(2) || 0),
          low: Number(r.low?.toFixed(2) || 0),
          volume: Number(r.volume || 0)
        }));
      }
    } catch (err: any) {
      console.warn(`[CHART ROUTE WARNING] DB query fail for ${symbol}:`, err.message);
    }

    // IF local DB is empty, return no_data
    if (chartData.length === 0) {
      return res.json({ s: 'no_data' });
    }

    res.json(chartData);
  } catch (error) {
    next(error);
  }
});

export default router;
