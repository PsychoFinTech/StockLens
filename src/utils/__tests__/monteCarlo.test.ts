import { describe, it, expect } from 'vitest';
import { runMonteCarloSimulation, MonteCarloInputs } from '../monteCarlo.js';

describe('Monte Carlo Simulation Engine', () => {
  it('runs successfully with basic inputs and returns correctly shaped distributions', () => {
    const inputs: MonteCarloInputs = {
      baseInputs: {
        revenueGrowthRate: 0.10,
        fcfMargin: 0.15,
        targetFcfMargin: 0.20,
        projectionYears: 5,
        terminalGrowthRate: 0.025,
        riskFreeRate: 0.04,
        equityRiskPremium: 0.05,
        beta: 1.1,
        costOfDebt: 0.05,
        taxRate: 0.21,
        marketCap: 100000000,
        totalDebt: 20000000,
        latestRevenue: 50000000,
        cashAndEquivalents: 10000000,
        sharesOutstanding: 1000000,
      },
      currentPrice: 100,
      baseWacc: 0.09,
      revenueGrowthStdDev: 0.02,
      targetFcfMarginStdDev: 0.01,
      waccStdDev: 0.005,
      terminalGrowthStdDev: 0.0025,
    };

    const result = runMonteCarloSimulation(inputs, 1000); // 1000 iter to save test time

    // Assert the core result structure
    expect(result).toBeDefined();
    expect(result.iterations).toBe(1000);
    expect(result.histogram.length).toBeGreaterThan(0);
    expect(result.percentiles).toBeDefined();

    // Assert statistical ordering of percentiles
    expect(result.percentiles.p10).toBeLessThan(result.percentiles.p25);
    expect(result.percentiles.p25).toBeLessThan(result.percentiles.p50);
    expect(result.percentiles.p50).toBeLessThan(result.percentiles.p75);
    expect(result.percentiles.p75).toBeLessThan(result.percentiles.p90);

    // All should be positive values
    expect(result.percentiles.p10).toBeGreaterThan(0);
    
    // Assert histogram bin totals matches filtered iteration count (~96% of 1000 = 960)
    const totalBins = result.histogram.reduce((sum, bin) => sum + bin.count, 0);
    expect(totalBins).toBeGreaterThan(900); 
    expect(totalBins).toBeLessThanOrEqual(1000);
  });
});
