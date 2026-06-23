import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import quotesRouter from '../quotes.js';
import { cacheService } from '../../services/cache.js';
import { yahooService } from '../../services/yahoo.js';

vi.mock('../../services/cache.js', () => ({
  cacheService: {
    get: vi.fn(),
    set: vi.fn(),
    logHit: vi.fn(),
    saveQuoteBackup: vi.fn(),
    getQuoteBackup: vi.fn()
  },
  CACHE_TTLS: { QUOTE: 300 }
}));

vi.mock('../../services/yahoo.js', () => ({
  yahooService: {
    getQuote: vi.fn()
  }
}));

const app = express();
app.use(express.json());
app.use('/api/quotes', quotesRouter);

describe('Quotes Route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/quotes/:symbol', () => {
    it('saves real change and change_pct to sqlite backup on live fetch', async () => {
      // Mock cache miss
      vi.mocked(cacheService.get).mockResolvedValue(null);

      // Mock live data with real change values
      vi.mocked(yahooService.getQuote).mockResolvedValue({
        price: 150,
        change: 5,
        change_pct: 3.4,
        high_52w: 160,
        low_52w: 100
      });

      const response = await request(app).get('/api/quotes/TEST');
      expect(response.status).toBe(200);

      expect(cacheService.saveQuoteBackup).toHaveBeenCalledWith('TEST', expect.objectContaining({
        price: 150,
        change: 5,
        change_pct: 3.4,
        high_52w: 160,
        low_52w: 100
      }));
    });

    it('returns formatClientQuote shape correctly on cache hit', async () => {
      // Mock cache hit with string price (flaky upstream) and nulls
      vi.mocked(cacheService.get).mockResolvedValue({
        price: "155.5",
        high: null,
        change: -1,
        change_pct: -0.5
      });

      const response = await request(app).get('/api/quotes/TEST');
      expect(response.status).toBe(200);

      expect(cacheService.logHit).toHaveBeenCalledWith('quote', 'TEST', 'MEMORY');
      expect(yahooService.getQuote).not.toHaveBeenCalled();

      // Check formatClientQuote coercion
      expect(response.body.price).toBe(155.5); // Number coercion
      expect(response.body.high).toBeNull();
      // Notice formatClientQuote in quotes.ts doesn't actually expose change/change_pct to the client response natively, 
      // it only includes price, high, low, open, prev_close, high_52w, low_52w, updated_at
    });
  });
});
