import { Router } from 'express';
import { apiLimiter } from '../middleware/rateLimiter.js';
import { fredService } from '../services/fred.js';

const router = Router();

router.get('/:seriesId', apiLimiter, async (req, res, next) => {
  try {
    const { seriesId } = req.params;
    const data = await fredService.getSeries(seriesId);
    res.json(data);
  } catch (error: any) {
    if (error.message === 'Invalid seriesId') {
      res.status(400).json({ error: 'Invalid seriesId' });
    } else if (error.message === 'FRED API key not configured on server') {
      res.status(500).json({ error: error.message });
    } else {
      next(error);
    }
  }
});

export default router;
