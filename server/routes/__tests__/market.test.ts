import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import marketRouter from '../market.js';
import { cacheService } from '../../services/cache.js';

vi.mock('../../services/cache.js', () => ({
  cacheService: {
    get: vi.fn(),
    set: vi.fn(),
    logHit: vi.fn()
  },
  CACHE_TTLS: { QUOTE: 300 }
}));

// Mock the yahooService
vi.mock('../../services/yahoo.js', () => ({
  yahooService: {
    getIndexQuote: vi.fn((sym) => {
      if (sym === '^GSPC') return Promise.resolve({ price: 5000, change: 10, change_pct: 0.2 });
      if (sym === '^IXIC') return Promise.resolve({ price: 16000, change: -50, change_pct: -0.3 });
      return Promise.resolve({ price: 100, change: 1, change_pct: 1 });
    })
  }
}));

const app = express();
app.use(express.json());
app.use('/api', marketRouter);

describe('Market Route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/indices', () => {
    it('returns formatted market indices payload', async () => {
      // Mock cache miss
      vi.mocked(cacheService.get).mockResolvedValue(undefined);

      const response = await request(app).get('/api/indices');
      expect(response.status).toBe(200);
      
      const data = response.body;
      expect(data).toBeInstanceOf(Array);
      expect(data.length).toBeGreaterThan(0);
      
      const gspc = data.find((d: any) => d.symbol === '^GSPC');
      const ixic = data.find((d: any) => d.symbol === '^IXIC');
      
      expect(gspc).toBeDefined();
      expect(gspc.price).toBe(5000);
      expect(ixic).toBeDefined();
      expect(ixic.change_pct).toBe(-0.3);
    });
  });
});
