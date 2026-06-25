import { Router } from 'express';
import { apiLimiter } from '../middleware/rateLimiter.js';
import { cacheService, CACHE_TTLS } from '../services/cache.js';
import { dcfService } from '../services/dcfService.js';

const router = Router();

router.get('/dcf/:symbol', apiLimiter, async (req, res, next) => {
  const symbol = req.params.symbol.toUpperCase();
  const cacheKey = `route:dcf:${symbol}`;

  try {
    if (req.query.refresh !== 'true') {
      const cached = await cacheService.get<any>(cacheKey);
      if (cached) return res.json(cached);
    }

    const payload = await dcfService.getDCFData(symbol);
    await cacheService.set(cacheKey, payload, CACHE_TTLS.FUNDAMENTALS);
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

export default router;
