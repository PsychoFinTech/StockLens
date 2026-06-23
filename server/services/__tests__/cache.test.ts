import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cacheService } from '../cache.js';
import db from '../db.js';

describe('cacheService', () => {
  beforeEach(() => {
    // Clean up quotes table before tests
    try {
      db.prepare('DELETE FROM quotes WHERE symbol = ?').run('TEST_CACHE');
    } catch (e) {}
  });

  afterEach(() => {
    try {
      db.prepare('DELETE FROM quotes WHERE symbol = ?').run('TEST_CACHE');
    } catch (e) {}
  });

  describe('getQuoteBackup', () => {
    it('returns null for an unknown symbol', () => {
      const result = cacheService.getQuoteBackup('UNKNOWN_XYZ_123');
      expect(result).toBeNull();
    });
  });

  describe('saveQuoteBackup', () => {
    it('round-trips correctly and updates via ON CONFLICT', () => {
      const symbol = 'TEST_CACHE';
      const quote1 = {
        price: 150.5,
        change: 2.5,
        change_pct: 1.6,
        high_52w: 160.0,
        low_52w: 100.0
      };

      // Save initial quote
      cacheService.saveQuoteBackup(symbol, quote1);
      
      const retrieved1 = cacheService.getQuoteBackup(symbol);
      expect(retrieved1).not.toBeNull();
      expect(retrieved1.price).toBe(150.5);
      expect(retrieved1.change_pct).toBe(1.6);

      // Update quote
      const quote2 = {
        price: 155.0,
        change: 4.5,
        change_pct: 3.0,
        high_52w: 160.0,
        low_52w: 100.0
      };

      cacheService.saveQuoteBackup(symbol, quote2);

      const retrieved2 = cacheService.getQuoteBackup(symbol);
      expect(retrieved2).not.toBeNull();
      expect(retrieved2.price).toBe(155.0);
      expect(retrieved2.change_pct).toBe(3.0);
    });
  });
});
