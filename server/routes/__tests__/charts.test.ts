import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import chartsRouter from '../charts.js';
import db from '../../services/db.js';

const app = express();
app.use(express.json());
app.use('/api/chart', chartsRouter);

describe('Charts Route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('GET /api/chart/:symbol', () => {
    it('returns {s: "no_data"} if historical_prices returns empty rows', async () => {
      // Don't mock the DB, just query a symbol we know is empty
      const response = await request(app).get('/api/chart/EMPTY_SYMBOL_TEST');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ s: 'no_data' });
    });

    it('calculates the correct from timestamp for different periods relative to Date.now()', async () => {
      // Freeze time at exactly 2026-06-23T00:00:00.000Z
      const mockDate = new Date('2026-06-23T00:00:00.000Z');
      vi.useFakeTimers();
      vi.setSystemTime(mockDate);

      // Create an interceptor/mock on db.prepare to spy on the "from" argument
      const originalPrepare = db.prepare;
      const allSpy = vi.fn().mockReturnValue([]);
      const dbSpy = vi.fn().mockImplementation(() => ({
        all: allSpy
      }));
      db.prepare = dbSpy as any;

      const toTimestamp = Math.floor(mockDate.getTime() / 1000);

      const periodTests = [
        { period: '1D', expectedFrom: toTimestamp - 24 * 3600 },
        { period: '5D', expectedFrom: toTimestamp - 5 * 24 * 3600 },
        { period: '1M', expectedFrom: toTimestamp - 30 * 24 * 3600 },
        { period: '6M', expectedFrom: toTimestamp - 180 * 24 * 3600 },
        { 
          period: 'YTD', 
          expectedFrom: Math.floor(new Date(mockDate.getFullYear(), 0, 1).getTime() / 1000) 
        },
        { period: '1Y', expectedFrom: toTimestamp - 365 * 24 * 3600 },
        { period: '5Y', expectedFrom: toTimestamp - 5 * 365 * 24 * 3600 },
        { period: 'MAX', expectedFrom: toTimestamp - 15 * 365 * 24 * 3600 },
      ];

      for (const testCase of periodTests) {
        allSpy.mockClear();
        await request(app).get(`/api/chart/TEST?period=${testCase.period}`);
        expect(allSpy).toHaveBeenCalled();
        const args = allSpy.mock.calls[0]; // [symbol, from, to]
        expect(args[1]).toBe(testCase.expectedFrom);
        expect(args[2]).toBe(toTimestamp);
      }

      db.prepare = originalPrepare;
    });
  });
});
