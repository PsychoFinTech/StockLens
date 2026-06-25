export interface ComputedMetrics {
  revenueGrowth: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  netMargin: number | null;
  currentRatio: number | null;
  debtToEquity: number | null;
  returnOnEquity: number | null;
  dupont: {
    netMargin: number | null;
    assetTurnover: number | null;
    equityMultiplier: number | null;
  } | null;
}

export function computeRatios(financials: any, balanceSheet: any, latestFund: any = {}): ComputedMetrics {
  const getVal = (obj: any, key: string) => {
    if (!obj || obj[key] === undefined || obj[key] === null) return null;
    if (typeof obj[key] === 'object' && 'raw' in obj[key]) return obj[key].raw;
    return obj[key];
  };

  const totalRevenue = getVal(financials, 'totalRevenue');
  const grossProfit = getVal(financials, 'grossProfit');
  const operatingIncome = getVal(financials, 'operatingIncome');
  const netIncome = getVal(financials, 'netIncomeToNonControllingInterests') || getVal(financials, 'netIncome');
  
  const totalAssets = getVal(balanceSheet, 'totalAssets');
  const totalLiabilities = getVal(balanceSheet, 'totalLiab') || getVal(balanceSheet, 'totalLiabilitiesNetMinorityInterest');
  const totalEquity = getVal(balanceSheet, 'totalStockholderEquity') || getVal(balanceSheet, 'stockholdersEquity');
  const currentAssets = getVal(balanceSheet, 'totalCurrentAssets') || getVal(balanceSheet, 'currentAssets');
  const currentLiabilities = getVal(balanceSheet, 'totalCurrentLiabilities') || getVal(balanceSheet, 'currentLiabilities');
  
  let totalDebt = getVal(balanceSheet, 'totalDebt');
  if (totalDebt === null || totalDebt === undefined) {
    const shortDebt = getVal(balanceSheet, 'shortLongTermDebt') || 0;
    const longDebt = getVal(balanceSheet, 'longTermDebt') || 0;
    totalDebt = shortDebt + longDebt;
  }

  // Compute margins
  const grossMargin = totalRevenue && grossProfit ? (grossProfit / totalRevenue) * 100 : null;
  const operatingMargin = totalRevenue && operatingIncome ? (operatingIncome / totalRevenue) * 100 : null;
  const netMargin = totalRevenue && netIncome ? (netIncome / totalRevenue) * 100 : null;

  // Compute liquidity/solvency
  const currentRatio = currentAssets && currentLiabilities ? currentAssets / currentLiabilities : null;
  const debtToEquity = totalDebt !== null && totalEquity ? totalDebt / totalEquity : null;

  // Compute return
  const returnOnEquity = netIncome && totalEquity ? (netIncome / totalEquity) * 100 : null;

  // DuPont Analysis
  let dupont = null;
  const dRev = getVal(latestFund, 'totalRevenue') || totalRevenue;
  const dAssets = getVal(latestFund, 'totalAssets') || totalAssets;
  const dEquity = getVal(latestFund, 'stockholdersEquity') || totalEquity;
  const dNetInc = getVal(latestFund, 'netIncome') || netIncome;

  if (dRev && dAssets && dEquity && dNetInc) {
    dupont = {
      netMargin: dNetInc / dRev, // as decimal
      assetTurnover: dRev / dAssets, // as multiple
      equityMultiplier: dAssets / dEquity // as multiple
    };
  }

  return {
    revenueGrowth: null, // Need previous year for growth, omitting for brevity or fetch from history
    grossMargin,
    operatingMargin,
    netMargin,
    currentRatio,
    debtToEquity,
    returnOnEquity,
    dupont
  };
}
