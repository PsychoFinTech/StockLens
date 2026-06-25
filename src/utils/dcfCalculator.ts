export interface DCFInputs {
  // Growth
  revenueGrowthRate: number;    // decimal (e.g. 0.125 = 12.5%)
  fcfMargin: number;            // decimal (e.g. 0.18 = 18%)
  targetFcfMargin?: number;     // decimal (e.g. 0.22 = 22%), defaults to fcfMargin if omitted
  projectionYears: number;      // 5-10
  terminalGrowthRate: number;   // decimal (e.g. 0.025 = 2.5%)
  
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

export function computeDCF(inputs: DCFInputs, currentPrice: number): DCFResult {
  if (inputs.sharesOutstanding <= 0) {
    throw new Error('Shares outstanding must be greater than zero.');
  }

  const wacc = computeWACC(inputs);
  const costOfEquity = inputs.riskFreeRate + inputs.beta * inputs.equityRiskPremium;

  if (wacc <= inputs.terminalGrowthRate) {
    throw new Error('WACC (discount rate) must be greater than the terminal growth rate.');
  }

  const projectedYears: DCFResult['projectedYears'] = [];
  let currentRevenue = inputs.latestRevenue;
  let pvFcfSum = 0;

  const currentYear = new Date().getFullYear();
  const targetMargin = inputs.targetFcfMargin !== undefined ? inputs.targetFcfMargin : inputs.fcfMargin;

  for (let i = 1; i <= inputs.projectionYears; i++) {
    // 2-stage growth rate model: years 1-5 use high-growth rate, 
    // years 6-10 fade linearly to terminal growth rate
    let growthRate = inputs.revenueGrowthRate;
    if (i > 5 && inputs.projectionYears > 5) {
      const steps = inputs.projectionYears - 5;
      const factor = (i - 5) / steps;
      growthRate = inputs.revenueGrowthRate - factor * (inputs.revenueGrowthRate - inputs.terminalGrowthRate);
    }

    currentRevenue = currentRevenue * (1 + growthRate);

    // Variable FCF margin model: linear interpolation from initial to target margin
    let currentMargin = inputs.fcfMargin;
    if (inputs.projectionYears > 1) {
      const factor = (i - 1) / (inputs.projectionYears - 1);
      currentMargin = inputs.fcfMargin + factor * (targetMargin - inputs.fcfMargin);
    }

    const fcf = currentRevenue * currentMargin;
    const discountedFcf = fcf / Math.pow(1 + wacc, i);
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
  const pvTerminalValue = terminalValue / Math.pow(1 + wacc, inputs.projectionYears);

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

function computeDCFWithFixedWACC(inputs: DCFInputs, currentPrice: number, fixedWacc: number): DCFResult {
  if (inputs.sharesOutstanding <= 0) {
    throw new Error('Shares outstanding must be greater than zero.');
  }
  if (fixedWacc <= inputs.terminalGrowthRate) {
    throw new Error('WACC must be greater than the terminal growth rate.');
  }

  const projectedYears: DCFResult['projectedYears'] = [];
  let currentRevenue = inputs.latestRevenue;
  let pvFcfSum = 0;
  const currentYear = new Date().getFullYear();
  const targetMargin = inputs.targetFcfMargin !== undefined ? inputs.targetFcfMargin : inputs.fcfMargin;

  for (let i = 1; i <= inputs.projectionYears; i++) {
    let growthRate = inputs.revenueGrowthRate;
    if (i > 5 && inputs.projectionYears > 5) {
      const steps = inputs.projectionYears - 5;
      const factor = (i - 5) / steps;
      growthRate = inputs.revenueGrowthRate - factor * (inputs.revenueGrowthRate - inputs.terminalGrowthRate);
    }

    currentRevenue = currentRevenue * (1 + growthRate);

    let currentMargin = inputs.fcfMargin;
    if (inputs.projectionYears > 1) {
      const factor = (i - 1) / (inputs.projectionYears - 1);
      currentMargin = inputs.fcfMargin + factor * (targetMargin - inputs.fcfMargin);
    }

    const fcf = currentRevenue * currentMargin;
    const discountedFcf = fcf / Math.pow(1 + fixedWacc, i);
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
  const terminalValue = (lastProjectedFcf * (1 + inputs.terminalGrowthRate)) / (fixedWacc - inputs.terminalGrowthRate);
  const pvTerminalValue = terminalValue / Math.pow(1 + fixedWacc, inputs.projectionYears);

  const enterpriseValue = pvFcfSum + pvTerminalValue;
  const netDebt = inputs.totalDebt - inputs.cashAndEquivalents;
  const equityValue = enterpriseValue - netDebt;
  const fairValuePerShare = equityValue / inputs.sharesOutstanding;

  const costOfEquity = inputs.riskFreeRate + inputs.beta * inputs.equityRiskPremium;
  const upsidePercent = currentPrice > 0 ? ((fairValuePerShare - currentPrice) / currentPrice) * 100 : 0;

  return {
    wacc: fixedWacc,
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
