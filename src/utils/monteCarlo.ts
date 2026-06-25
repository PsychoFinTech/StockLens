import { computeDCF } from './dcfCalculator.js';

// Box-Muller transform to generate normally distributed random numbers
// Returns a random number with a standard normal distribution (mean 0, stdDev 1)
function randomNormal(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export interface MonteCarloInputs {
  latestRevenue: number;
  revenueGrowth: number; // Base mean
  revenueGrowthStdDev: number; // Std dev
  targetFcfMargin: number; // Base mean
  targetFcfMarginStdDev: number; // Std dev
  wacc: number; // Base mean
  waccStdDev: number; // Std dev
  terminalGrowth: number; // Base mean
  terminalGrowthStdDev: number; // Std dev
  sharesOutstanding: number;
  totalDebt: number;
  cashAndEquivalents: number;
  projectionYears: number;
  fcfMarginYear1?: number; // Optional, defaults to targetFcfMargin if not provided
}

export interface HistogramBin {
  min: number;
  max: number;
  count: number;
}

export interface MonteCarloResult {
  iterations: number;
  percentiles: {
    p10: number;
    p25: number;
    p50: number; // Median
    p75: number;
    p90: number;
  };
  histogram: HistogramBin[];
}

function computeHistogram(sortedData: number[], bins: number = 40): HistogramBin[] {
  if (sortedData.length === 0) return [];
  
  // Filter out extreme outliers (bottom 2% and top 2%) to make the histogram visually readable
  const minIdx = Math.floor(sortedData.length * 0.02);
  const maxIdx = Math.floor(sortedData.length * 0.98);
  const filtered = sortedData.slice(minIdx, maxIdx);
  
  if (filtered.length === 0) return [];

  const min = filtered[0];
  const max = filtered[filtered.length - 1];
  const step = (max - min) / bins;
  
  const histogram = Array.from({ length: bins }, (_, i) => ({
    min: min + i * step,
    max: min + (i + 1) * step,
    count: 0
  }));

  for (const val of filtered) {
    if (val < min || val > max) continue;
    let binIdx = Math.floor((val - min) / step);
    if (binIdx >= bins) binIdx = bins - 1; // handle edge case where val === max
    histogram[binIdx].count++;
  }

  return histogram;
}

export function runMonteCarloSimulation(inputs: MonteCarloInputs, iterations: number = 10000): MonteCarloResult {
  const results: number[] = [];

  for (let i = 0; i < iterations; i++) {
    // Generate randomized inputs based on normal distribution
    const randRevGrowth = inputs.revenueGrowth + randomNormal() * inputs.revenueGrowthStdDev;
    const randFcfMargin = inputs.targetFcfMargin + randomNormal() * inputs.targetFcfMarginStdDev;
    const randWacc = inputs.wacc + randomNormal() * inputs.waccStdDev;
    const randTerminalGrowth = inputs.terminalGrowth + randomNormal() * inputs.terminalGrowthStdDev;
    const randFcfMarginYear1 = inputs.fcfMarginYear1 !== undefined 
      ? inputs.fcfMarginYear1 + randomNormal() * inputs.targetFcfMarginStdDev 
      : randFcfMargin;

    // Boundary constraints to prevent mathematically impossible scenarios
    const safeRevGrowth = Math.max(-0.5, randRevGrowth);
    const safeFcfMargin = Math.max(-0.5, randFcfMargin);
    const safeFcfMarginYear1 = Math.max(-0.5, randFcfMarginYear1);
    const safeWacc = Math.max(0.01, randWacc); // WACC must be > 0
    // Terminal growth must be strictly less than WACC
    const safeTerminalGrowth = Math.min(safeWacc - 0.001, Math.max(-0.05, randTerminalGrowth));

    // Run the DCF
    const dcfResult = computeDCF({
      latestRevenue: inputs.latestRevenue,
      revenueGrowth: safeRevGrowth,
      targetFcfMargin: safeFcfMargin,
      wacc: safeWacc,
      terminalGrowth: safeTerminalGrowth,
      sharesOutstanding: inputs.sharesOutstanding,
      totalDebt: inputs.totalDebt,
      cashAndEquivalents: inputs.cashAndEquivalents,
      projectionYears: inputs.projectionYears,
      fcfMarginYear1: safeFcfMarginYear1
    });

    results.push(dcfResult.fairValue);
  }

  // Sort results to extract percentiles
  results.sort((a, b) => a - b);

  return {
    iterations,
    percentiles: {
      p10: results[Math.floor(iterations * 0.10)],
      p25: results[Math.floor(iterations * 0.25)],
      p50: results[Math.floor(iterations * 0.50)],
      p75: results[Math.floor(iterations * 0.75)],
      p90: results[Math.floor(iterations * 0.90)],
    },
    histogram: computeHistogram(results, 40)
  };
}
