export interface DCFInputs {
  // Growth
  revenueGrowthRate: number;    // decimal (e.g. 0.125 = 12.5%)
  fcfMargin: number;            // decimal (e.g. 0.18 = 18%) — UNLEVERED (FCFF) margin
  targetFcfMargin?: number;     // decimal (e.g. 0.22 = 22%), defaults to fcfMargin if omitted
  projectionYears: number;      // 3-10
  terminalGrowthRate: number;   // decimal (e.g. 0.025 = 2.5%)
  midYearConvention?: boolean;  // discount cash flows at mid-year (i - 0.5) instead of year-end
  
  // WACC components
  riskFreeRate: number;         // decimal (e.g. 0.0425 = 4.25%)
  equityRiskPremium: number;    // decimal (e.g. 0.055 = 5.5%)
  beta: number;
  costOfDebt: number;           // decimal (e.g. 0.038 = 3.8%)
  taxRate: number;              // decimal (e.g. 0.21 = 21%)
  marketCap: number;            // raw value
  totalDebt: number;            // raw value
  
  // Valuation
  latestRevenue: number;        // raw value
  cashAndEquivalents: number;   // raw value
  sharesOutstanding: number;    // raw value
}

export interface DCFResult {
  wacc: number;
  costOfEquity: number;
  projectedYears: {
    year: number;
    revenue: number;
    fcfMargin: number;
    fcf: number;
    discountedFcf: number;
    growthRate: number;
  }[];
  terminalValue: number;
  pvTerminalValue: number;
  pvFcfSum: number;
  enterpriseValue: number;
  netDebt: number;
  equityValue: number;
  fairValuePerShare: number;
  currentPrice: number;
  upsidePercent: number;
}

export function computeWACC(inputs: DCFInputs): number {
  const costOfEquity = inputs.riskFreeRate + inputs.beta * inputs.equityRiskPremium;
  const equityWeight = inputs.marketCap;
  const debtWeight = inputs.totalDebt;
  const totalCapital = equityWeight + debtWeight;

  if (totalCapital <= 0) {
    return costOfEquity;
  }

  const afterTaxCostOfDebt = inputs.costOfDebt * (1 - inputs.taxRate);
  
  const wacc = (equityWeight / totalCapital) * costOfEquity + 
               (debtWeight / totalCapital) * afterTaxCostOfDebt;
               
  return wacc;
}

/**
 * 2-stage revenue growth rate for a given projection year.
 *
 * Stage 1 (high-growth) runs at the base rate; stage 2 fades linearly to the
 * terminal rate. The stage-1 length adapts to the projection horizon so that
 * shorter multi-year projections still fade smoothly rather than dropping off
 * a cliff in their final year:
 *   - projectionYears <= 5  -> single stage (constant high growth)
 *   - projectionYears  > 5  -> stage 1 = min(5, ceil(N/2)), fade over the rest
 */
export function projectedGrowthRate(
  year: number,
  projectionYears: number,
  revenueGrowthRate: number,
  terminalGrowthRate: number
): number {
  const stage1Years = projectionYears <= 5
    ? projectionYears
    : Math.min(5, Math.ceil(projectionYears / 2));

  if (year > stage1Years && projectionYears > stage1Years) {
    const steps = projectionYears - stage1Years;
    const factor = (year - stage1Years) / steps;
    return revenueGrowthRate - factor * (revenueGrowthRate - terminalGrowthRate);
  }
  return revenueGrowthRate;
}

/**
 * Shared projection + valuation core used by both computeDCF (which derives
 * WACC via CAPM) and computeDCFWithFixedWACC (which pins WACC for sensitivity
 * and Monte Carlo). Keeping a single implementation prevents the two entry
 * points from drifting apart.
 *
 * NOTE: the projected free cash flow here is UNLEVERED (FCFF) — revenue x the
 * unlevered FCF margin — so discounting at WACC and then bridging enterprise
 * value to equity via net debt is internally consistent.
 */
function runProjection(inputs: DCFInputs, wacc: number, currentPrice: number): DCFResult {
  if (inputs.sharesOutstanding <= 0) {
    throw new Error('Shares outstanding must be greater than zero.');
  }
  if (wacc <= inputs.terminalGrowthRate) {
    throw new Error('WACC (discount rate) must be greater than the terminal growth rate.');
  }

  const costOfEquity = inputs.riskFreeRate + inputs.beta * inputs.equityRiskPremium;
  const targetMargin = inputs.targetFcfMargin !== undefined ? inputs.targetFcfMargin : inputs.fcfMargin;
  const currentYear = new Date().getFullYear();

  const projectedYears: DCFResult['projectedYears'] = [];
  let currentRevenue = inputs.latestRevenue;
  let pvFcfSum = 0;

  for (let i = 1; i <= inputs.projectionYears; i++) {
    const growthRate = projectedGrowthRate(i, inputs.projectionYears, inputs.revenueGrowthRate, inputs.terminalGrowthRate);
    currentRevenue = currentRevenue * (1 + growthRate);

    // Variable FCF margin model: linear interpolation from initial to target margin
    let currentMargin = inputs.fcfMargin;
    if (inputs.projectionYears > 1) {
      const factor = (i - 1) / (inputs.projectionYears - 1);
      currentMargin = inputs.fcfMargin + factor * (targetMargin - inputs.fcfMargin);
    }

    const fcf = currentRevenue * currentMargin;
    // Mid-year convention discounts each flow half a period earlier, reflecting
    // cash arriving throughout the year rather than all at year-end.
    const period = inputs.midYearConvention ? i - 0.5 : i;
    const discountedFcf = fcf / Math.pow(1 + wacc, period);
    pvFcfSum += discountedFcf;

    projectedYears.push({
      year: currentYear + i,
      revenue: currentRevenue,
      fcfMargin: currentMargin,
      fcf,
      discountedFcf,
      growthRate,
    });
  }

  const lastProjectedFcf = projectedYears[projectedYears.length - 1].fcf;
  const terminalValue = (lastProjectedFcf * (1 + inputs.terminalGrowthRate)) / (wacc - inputs.terminalGrowthRate);
  const terminalPeriod = inputs.midYearConvention ? inputs.projectionYears - 0.5 : inputs.projectionYears;
  const pvTerminalValue = terminalValue / Math.pow(1 + wacc, terminalPeriod);

  const enterpriseValue = pvFcfSum + pvTerminalValue;
  const netDebt = inputs.totalDebt - inputs.cashAndEquivalents;
  const equityValue = enterpriseValue - netDebt;
  const fairValuePerShare = equityValue / inputs.sharesOutstanding;

  const upsidePercent = currentPrice > 0 ? ((fairValuePerShare - currentPrice) / currentPrice) * 100 : 0;

  return {
    wacc,
    costOfEquity,
    projectedYears,
    terminalValue,
    pvTerminalValue,
    pvFcfSum,
    enterpriseValue,
    netDebt,
    equityValue,
    fairValuePerShare,
    currentPrice,
    upsidePercent,
  };
}

export function computeDCF(inputs: DCFInputs, currentPrice: number): DCFResult {
  return runProjection(inputs, computeWACC(inputs), currentPrice);
}

export function computeSensitivityTable(
  baseInputs: DCFInputs,
  currentPrice: number,
  waccRange: number[],
  terminalGrowthRange: number[]
): number[][] {
  const table: number[][] = [];

  for (const waccVal of waccRange) {
    const row: number[] = [];
    for (const gVal of terminalGrowthRange) {
      if (waccVal <= gVal) {
        row.push(NaN); // Invalid combination
        continue;
      }

      try {
        const modifiedInputs: DCFInputs = {
          ...baseInputs,
          terminalGrowthRate: gVal,
        };

        const result = computeDCFWithFixedWACC(modifiedInputs, currentPrice, waccVal);
        row.push(result.fairValuePerShare);
      } catch {
        row.push(NaN);
      }
    }
    table.push(row);
  }

  return table;
}

export function computeDCFWithFixedWACC(inputs: DCFInputs, currentPrice: number, fixedWacc: number): DCFResult {
  return runProjection(inputs, fixedWacc, currentPrice);
}
