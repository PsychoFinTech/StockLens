import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import fundamentalsRouter from '../fundamentals.js';
import { yahooService } from '../../services/yahoo.js';

// Mock the yahooService
vi.mock('../../services/yahoo.js', () => ({
  yahooService: {
    getProfile: vi.fn(),
    getBasicFinancials: vi.fn(),
    getCandles: vi.fn(),
    getFundamentalsTimeSeries: vi.fn()
  }
}));

// Setup Express app with the router
const app = express();
app.use(express.json());
app.use('/api', fundamentalsRouter);

describe('Fundamentals Route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/compare', () => {
    it('returns null for missing history in findClosestIndex (IPO Regression)', async () => {
      // Mock basic profile and financials
      vi.mocked(yahooService.getProfile).mockResolvedValue({
        name: 'Test IPO Corp',
        finnhubIndustry: 'Technology',
        exchange: 'NASDAQ',
        country: 'US',
        logo: '',
        ceo: 'Jane Doe'
      });
      vi.mocked(yahooService.getBasicFinancials).mockResolvedValue({
        metric: {
          peAnnual: 15,
          marketCapitalization: 1000
        }
      });
      vi.mocked(yahooService.getFundamentalsTimeSeries).mockResolvedValue([]);

      // Mock getCandles to simulate an IPO just 5 days ago.
      // Current time is roughly now. We create timestamps for the last 5 days.
      const to = Math.floor(Date.now() / 1000);
      const timestamps = [
        to - 5 * 86400,
        to - 4 * 86400,
        to - 3 * 86400,
        to - 2 * 86400,
        to - 1 * 86400,
        to
      ];
      const prices = [100, 105, 110, 108, 112, 115];

      vi.mocked(yahooService.getCandles).mockResolvedValue({
        s: 'ok',
        t: timestamps,
        c: prices,
        o: prices,
        h: prices,
        l: prices,
        v: prices
      });

      const response = await request(app).get('/api/compare?symbols=TESTIPO');
      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(1);

      const data = response.body[0];
      expect(data.symbol).toBe('TESTIPO');
      
      // The regression check: oneYear, threeMonths should be null because history < 10 days away is not found.
      // One week is also > 5 days ago, so it might be null depending on exact math, but definitely not artificially using index 0.
      expect(data.pricePerformance.oneYear).toBeNull();
      expect(data.pricePerformance.threeMonths).toBeNull();
    });

    it('returns a valid smoke test payload for a standard stock', async () => {
      vi.mocked(yahooService.getProfile).mockResolvedValue({
        name: 'Smoke Test',
        finnhubIndustry: 'Tech'
      });
      vi.mocked(yahooService.getBasicFinancials).mockResolvedValue({});
      vi.mocked(yahooService.getCandles).mockResolvedValue({ s: 'no_data' });
      vi.mocked(yahooService.getFundamentalsTimeSeries).mockResolvedValue([]);

      const response = await request(app).get('/api/compare?symbols=SMK');
      expect(response.status).toBe(200);
      expect(response.body[0].symbol).toBe('SMK');
      expect(response.body[0].profile.name).toBe('Smoke Test');
    });
  });
});
