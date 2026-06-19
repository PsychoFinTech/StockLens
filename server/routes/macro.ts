import { Router } from 'express';
import { cacheService } from '../services/cache.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const ALLOWED_SERIES = new Set([
  "FEDFUNDS", "DGS10", "DGS2", "T10Y2Y", "BAMLH0A0HYM2",
  "CPIAUCSL", "PCEPI", "UNRATE", "PAYEMS", "GDPC1", "ICSA"
]);

router.get('/:seriesId', apiLimiter, async (req, res, next) => {
  const { seriesId } = req.params;
  const upperId = seriesId.toUpperCase();

  if (!ALLOWED_SERIES.has(upperId)) {
    return res.status(400).json({ error: 'Invalid seriesId' });
  }

  const cacheKey = `macro:${upperId}`;
  const cached = cacheService.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'FRED API key not configured on server' });
  }

  try {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${upperId}&api_key=${apiKey}&file_type=json&sort_order=asc&limit=600`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`FRED API responded with status ${response.status}`);
    }
    const json = await response.json();
    
    // Cache for 6 hours (21600 seconds)
    cacheService.set(cacheKey, json, 21600);
    res.json(json);
  } catch (error) {
    next(error);
  }
});

export default router;
