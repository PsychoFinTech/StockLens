import { describe, it, expect } from 'vitest';
import { computeWACC, computeDCF, computeSensitivityTable, DCFInputs } from '../dcfCalculator.js';

const mockInputs: DCFInputs = {
  revenueGrowthRate: 0.10, // 10%
  fcfMargin: 0.20,         // 20%
  projectionYears: 5,
  terminalGrowthRate: 0.02, // 2%
  riskFreeRate: 0.04,      // 4%
  equityRiskPremium: 0.05, // 5%
  beta: 1.2,
  costOfDebt: 0.05,        // 5%
  taxRate: 0.20,           // 20%
  marketCap: 1000000000,   // $1B
  totalDebt: 500000000,    // $500M
  latestRevenue: 500000000, // $500M
  cashAndEquivalents: 100000000, // $100M
  sharesOutstanding: 10000000,   // 10M shares
};

describe('DCF Calculator Utilities', () => {
  describe('computeWACC', () => {
    it('calculates WACC correctly with standard inputs', () => {
      // Cost of Equity = 0.04 + 1.2 * 0.05 = 0.10 (10%)
      // Cost of Debt (after tax) = 0.05 * (1 - 0.20) = 0.04 (4%)
      // Total Capital = 1.5B
      // Equity Weight = 1B / 1.5B = 2/3
      // Debt Weight = 500M / 1.5B = 1/3
      // WACC = (2/3 * 0.10) + (1/3 * 0.04) = 0.066667 + 0.013333 = 0.08 (8%)
      const wacc = computeWACC(mockInputs);
      expect(wacc).toBeCloseTo(0.08, 4);
    });

    it('falls back to cost of equity when total capital is zero', () => {
      const zeroCapitalInputs = {
        ...mockInputs,
        marketCap: 0,
        totalDebt: 0,
      };
      // Cost of Equity = 0.04 + 1.2 * 0.05 = 0.10 (10%)
      const wacc = computeWACC(zeroCapitalInputs);
      expect(wacc).toBeCloseTo(0.10, 4);
    });
  });

  describe('computeDCF', () => {
    it('computes intrinsic value per share correctly', () => {
      const result = computeDCF(mockInputs, 100);
      expect(result.wacc).toBeCloseTo(0.08, 4);
      expect(result.costOfEquity).toBeCloseTo(0.10, 4);

      // Projected years length should match projectionYears input
      expect(result.projectedYears.length).toBe(5);

      // Let's verify Revenue progression:
      // Year 1: 500M * 1.1 = 550M
      // Year 2: 550M * 1.1 = 605M
      // Year 5: 500M * (1.1)^5 = 805.255M
      expect(result.projectedYears[0].revenue).toBeCloseTo(550000000, 2);
      expect(result.projectedYears[4].revenue).toBeCloseTo(805255000, 2);

      // FCF margin is 20%
      // Year 1 FCF = 550M * 0.2 = 110M
      // Discounted FCF Year 1 = 110M / (1.08)^1 = 101.85M
      expect(result.projectedYears[0].fcf).toBeCloseTo(110000000, 2);
      expect(result.projectedYears[0].discountedFcf).toBeCloseTo(110000000 / 1.08, 2);

      // Sum of PV of FCFs check
      let expectedPvSum = 0;
      let rev = 500000000;
      for (let i = 1; i <= 5; i++) {
        rev *= 1.1;
        const fcf = rev * 0.2;
        expectedPvSum += fcf / Math.pow(1.08, i);
      }
      expect(result.pvFcfSum).toBeCloseTo(expectedPvSum, 2);

      // Terminal Value calculations:
      // Year 5 FCF = 161.051M
      // FCF Terminal = 161.051M * 1.02 = 164.272M
      // TV = 164.272M / (0.08 - 0.02) = 2,737.867M
      // PV of TV = TV / (1.08)^5 = 1,863.342M
      const lastFcf = result.projectedYears[4].fcf;
      const expectedTv = (lastFcf * 1.02) / (0.08 - 0.02);
      const expectedPvTv = expectedTv / Math.pow(1.08, 5);
      expect(result.terminalValue).toBeCloseTo(expectedTv, 2);
      expect(result.pvTerminalValue).toBeCloseTo(expectedPvTv, 2);

      // Enterprise Value = PV of FCFs + PV of TV
      expect(result.enterpriseValue).toBeCloseTo(result.pvFcfSum + result.pvTerminalValue, 2);

      // Net Debt = 500M (Total Debt) - 100M (Cash) = 400M
      // Equity Value = Enterprise Value - Net Debt
      // Fair Value per Share = Equity Value / 10M shares
      const expectedNetDebt = 400000000;
      const expectedEquityValue = result.enterpriseValue - expectedNetDebt;
      const expectedFairValuePerShare = expectedEquityValue / 10000000;
      expect(result.netDebt).toBe(expectedNetDebt);
      expect(result.equityValue).toBeCloseTo(expectedEquityValue, 2);
      expect(result.fairValuePerShare).toBeCloseTo(expectedFairValuePerShare, 2);
    });

    it('throws an error if shares outstanding is zero or negative', () => {
      const badInputs = {
        ...mockInputs,
        sharesOutstanding: 0,
      };
      expect(() => computeDCF(badInputs, 100)).toThrow('Shares outstanding must be greater than zero.');
    });

    it('throws an error if WACC is less than or equal to terminal growth rate', () => {
      const badInputs = {
        ...mockInputs,
        terminalGrowthRate: 0.15, // > WACC of 8%
      };
      expect(() => computeDCF(badInputs, 100)).toThrow('WACC (discount rate) must be greater than the terminal growth rate.');
    });
    it('applies 2-stage growth rate decay for projections longer than 5 years', () => {
      const inputs10Yr = {
        ...mockInputs,
        projectionYears: 10,
      };
      const result = computeDCF(inputs10Yr, 100);
      expect(result.projectedYears.length).toBe(10);
      
      // Years 1-5 should have constant growth of 10%
      for (let i = 0; i < 5; i++) {
        expect(result.projectedYears[i].growthRate).toBeCloseTo(0.10, 4);
      }
      
      // Year 10 (index 9) should fade to terminal growth (2%)
      expect(result.projectedYears[9].growthRate).toBeCloseTo(0.02, 4);
      
      // Year 7 should be intermediate (index 6)
      // Step factor at i = 7: (7 - 5) / (10 - 5) = 2/5 = 0.4
      // growth = 0.10 - 0.4 * (0.10 - 0.02) = 0.10 - 0.032 = 0.068
      expect(result.projectedYears[6].growthRate).toBeCloseTo(0.068, 4);
    });

    it('interpolates FCF margins linearly when targetFcfMargin is provided', () => {
      const variableMarginInputs = {
        ...mockInputs,
        projectionYears: 5,
        targetFcfMargin: 0.30, // grow from 20% to 30%
      };
      const result = computeDCF(variableMarginInputs, 100);
      
      // Margins:
      // Year 1: 20%
      // Year 2: 22.5%
      // Year 3: 25%
      // Year 4: 27.5%
      // Year 5: 30%
      expect(result.projectedYears[0].fcfMargin).toBeCloseTo(0.20, 4);
      expect(result.projectedYears[2].fcfMargin).toBeCloseTo(0.25, 4);
      expect(result.projectedYears[4].fcfMargin).toBeCloseTo(0.30, 4);
    });
  });

  describe('computeSensitivityTable', () => {
    it('creates a table with correct dimensions matching ranges', () => {
      const waccRange = [0.07, 0.08, 0.09];
      const growthRange = [0.01, 0.02, 0.03];
      const table = computeSensitivityTable(mockInputs, 100, waccRange, growthRange);

      expect(table.length).toBe(3); // 3 WACC values
      expect(table[0].length).toBe(3); // 3 growth values
    });

    it('handles WACC <= Terminal Growth rate gracefully by returning NaN', () => {
      const waccRange = [0.02];
      const growthRange = [0.02, 0.03]; // 0.02 <= 0.02 and 0.02 <= 0.03
      const table = computeSensitivityTable(mockInputs, 100, waccRange, growthRange);

      expect(table[0][0]).toBeNaN();
      expect(table[0][1]).toBeNaN();
    });
  });
});
