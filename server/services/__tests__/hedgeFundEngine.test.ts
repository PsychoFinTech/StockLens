import { describe, it, expect } from 'vitest';
import { runHedgeFundEngine, StockEvaluationData } from '../hedgeFundEngine.js';

describe('hedgeFundEngine', () => {
  describe('benGrahamAgent', () => {
    it('returns "bullish" when P/B < 1.5 and current ratio > 2, with good P/E and low debt', () => {
      const data: StockEvaluationData = {
        symbol: 'TEST',
        price: 100,
        marketCap: 1000000,
        peRatio: 10, // < 15
        pbRatio: 1.2, // < 1.5
        debtToEquity: 0.3, // < 0.5
        currentRatio: 2.5, // > 1.5
        roe: 20,
        roic: 20,
        grossMargin: 50,
        operatingMargin: 20,
        netIncome: 100000,
        revenueGrowthYoY: 10,
        epsGrowthYoY: 10,
        fcfYield: 10,
        oneYearReturn: 10,
        sixMonthReturn: 10,
        threeMonthReturn: 10,
        volatility: 1,
        sector: 'Technology',
        intrinsicValue: 150
      };

      const result = runHedgeFundEngine([data], 100000);
      const graham = result.evaluations['TEST'].agents.benGraham;
      
      expect(graham.signal).toBe('bullish');
      expect(graham.confidence).toBeGreaterThanOrEqual(80);
      expect(graham.reasoning.some(r => r.includes('P/B ratio is excellent'))).toBe(true);
      expect(graham.reasoning.some(r => r.includes('Current ratio is safe'))).toBe(true);
    });

    it('returns "bearish" when ratios are very poor', () => {
      const data: StockEvaluationData = {
        symbol: 'TEST2',
        price: 100,
        marketCap: 1000000,
        peRatio: 50, // > 15
        pbRatio: 5.0, // > 1.5
        debtToEquity: 2.0, // > 0.5
        currentRatio: 0.5, // < 1.5
        roe: 5,
        roic: 5,
        grossMargin: 10,
        operatingMargin: 5,
        netIncome: 1000,
        revenueGrowthYoY: 2,
        epsGrowthYoY: 2,
        fcfYield: 1,
        oneYearReturn: -10,
        sixMonthReturn: -10,
        threeMonthReturn: -10,
        volatility: 2,
        sector: 'Technology',
        intrinsicValue: 50
      };

      const result = runHedgeFundEngine([data], 100000);
      const graham = result.evaluations['TEST2'].agents.benGraham;
      
      expect(graham.signal).toBe('bearish');
      expect(graham.confidence).toBeLessThanOrEqual(30);
    });
  });
});
