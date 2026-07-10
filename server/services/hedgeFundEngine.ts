export type Signal = "bullish" | "bearish" | "neutral";

export interface AgentResult {
  signal: Signal;
  confidence: number;
  reasoning: string[];
}

export interface StockEvaluationData {
  symbol: string;
  price: number;
  marketCap: number | null;
  peRatio: number | null;
  pbRatio: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
  roe: number | null;
  roic: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  netIncome: number | null;
  revenueGrowthYoY: number | null;
  epsGrowthYoY: number | null;
  fcfYield: number | null;
  oneYearReturn: number | null;
  sixMonthReturn: number | null;
  threeMonthReturn: number | null;
  volatility: number | null; // e.g. std dev or beta
  sector: string;
  intrinsicValue: number | null;
}

export interface StockEvaluationResult {
  symbol: string;
  price: number;
  agents: {
    benGraham: AgentResult;
    billAckman: AgentResult;
    cathieWood: AgentResult;
    charlieMunger: AgentResult;
    philFisher: AgentResult;
    stanDruckenmiller: AgentResult;
    warrenBuffett: AgentResult;
  };
}

export interface PortfolioDecision {
  action: "BUY" | "SELL" | "HOLD";
  quantity: number;
  reasoning: string[];
  allocationAmount: number;
}

export interface HedgeFundResult {
  decisions: Record<string, PortfolioDecision>;
  evaluations: Record<string, StockEvaluationResult>;
  summary: string[];
}

// ==========================================
// INDIVIDUAL AGENTS
// ==========================================

function benGrahamAgent(data: StockEvaluationData): AgentResult {
  const reasoning: string[] = [];
  let score = 0;
  let maxScore = 0;

  if (data.peRatio !== null && data.peRatio !== undefined) {
    maxScore += 2;
    if (data.peRatio > 0 && data.peRatio < 15) {
      score += 2;
      reasoning.push(`✅ P/E ratio is conservative at ${data.peRatio.toFixed(2)} (< 15)`);
    } else {
      reasoning.push(`❌ P/E ratio is high at ${data.peRatio.toFixed(2)} (> 15)`);
    }
  }

  if (data.pbRatio !== null && data.pbRatio !== undefined) {
    maxScore += 2;
    if (data.pbRatio > 0 && data.pbRatio < 1.5) {
      score += 2;
      reasoning.push(`✅ P/B ratio is excellent at ${data.pbRatio.toFixed(2)} (< 1.5)`);
    } else {
      reasoning.push(`❌ P/B ratio is high at ${data.pbRatio.toFixed(2)} (> 1.5)`);
    }
  }

  if (data.currentRatio !== null && data.currentRatio !== undefined) {
    maxScore += 1;
    if (data.currentRatio > 1.5) {
      score += 1;
      reasoning.push(`✅ Current ratio is safe at ${data.currentRatio.toFixed(2)} (> 1.5)`);
    } else {
      reasoning.push(`❌ Current ratio is risky at ${data.currentRatio.toFixed(2)} (< 1.5)`);
    }
  }

  if (data.debtToEquity !== null && data.debtToEquity !== undefined) {
    maxScore += 1;
    if (data.debtToEquity < 0.5) {
      score += 1;
      reasoning.push(`✅ Debt-to-Equity is low at ${data.debtToEquity.toFixed(2)} (< 0.5)`);
    } else {
      reasoning.push(`❌ Debt-to-Equity is high at ${data.debtToEquity.toFixed(2)} (> 0.5)`);
    }
  }

  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
  let signal: Signal = "neutral";
  if (percentage >= 80) signal = "bullish";
  else if (percentage <= 30) signal = "bearish";

  if (reasoning.length === 0) reasoning.push("Insufficient data for evaluation.");

  return { signal, confidence: percentage, reasoning };
}

function billAckmanAgent(data: StockEvaluationData): AgentResult {
  const reasoning: string[] = [];
  let score = 0;
  let maxScore = 0;

  if (data.operatingMargin !== null && data.operatingMargin !== undefined) {
    maxScore += 3;
    if (data.operatingMargin > 20) {
      score += 3;
      reasoning.push(`✅ Very strong operating margin at ${data.operatingMargin.toFixed(2)}% (business quality)`);
    } else if (data.operatingMargin > 10) {
      score += 1;
      reasoning.push(`⚠️ Decent operating margin at ${data.operatingMargin.toFixed(2)}%`);
    } else {
      reasoning.push(`❌ Poor operating margin at ${data.operatingMargin.toFixed(2)}%`);
    }
  }

  if (data.fcfYield !== null && data.fcfYield !== undefined) {
    maxScore += 2;
    if (data.fcfYield > 5) {
      score += 2;
      reasoning.push(`✅ High Free Cash Flow Yield of ${data.fcfYield.toFixed(2)}%`);
    } else {
      reasoning.push(`❌ Low Free Cash Flow Yield of ${data.fcfYield.toFixed(2)}%`);
    }
  }

  if (data.roic !== null && data.roic !== undefined) {
    maxScore += 2;
    if (data.roic > 15) {
      score += 2;
      reasoning.push(`✅ Excellent ROIC of ${data.roic.toFixed(2)}%`);
    } else {
      reasoning.push(`❌ Weak ROIC of ${data.roic.toFixed(2)}%`);
    }
  }

  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
  let signal: Signal = "neutral";
  if (percentage >= 70) signal = "bullish";
  else if (percentage <= 40) signal = "bearish";

  if (reasoning.length === 0) reasoning.push("Insufficient data for evaluation.");

  return { signal, confidence: percentage, reasoning };
}

function cathieWoodAgent(data: StockEvaluationData): AgentResult {
  const reasoning: string[] = [];
  let score = 0;
  let maxScore = 0;

  if (data.revenueGrowthYoY !== null && data.revenueGrowthYoY !== undefined) {
    maxScore += 4;
    if (data.revenueGrowthYoY > 25) {
      score += 4;
      reasoning.push(`✅ Hyper-growth: Revenue up ${data.revenueGrowthYoY.toFixed(2)}% YoY`);
    } else if (data.revenueGrowthYoY > 15) {
      score += 2;
      reasoning.push(`⚠️ Solid growth: Revenue up ${data.revenueGrowthYoY.toFixed(2)}% YoY`);
    } else {
      reasoning.push(`❌ Slow growth: Revenue up ${data.revenueGrowthYoY.toFixed(2)}% YoY (< 15%)`);
    }
  }

  if (data.oneYearReturn !== null && data.oneYearReturn !== undefined) {
    maxScore += 2;
    if (data.oneYearReturn > 30) {
      score += 2;
      reasoning.push(`✅ Strong 1Y price momentum (+${data.oneYearReturn.toFixed(2)}%)`);
    } else if (data.oneYearReturn < 0) {
      reasoning.push(`❌ Negative 1Y price momentum (${data.oneYearReturn.toFixed(2)}%)`);
    }
  }

  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
  let signal: Signal = "neutral";
  if (percentage >= 75) signal = "bullish";
  else if (percentage <= 30) signal = "bearish";

  if (reasoning.length === 0) reasoning.push("Insufficient data for evaluation.");

  return { signal, confidence: percentage, reasoning };
}

function charlieMungerAgent(data: StockEvaluationData): AgentResult {
  const reasoning: string[] = [];
  let score = 0;
  let maxScore = 0;

  if (data.roic !== null && data.roic !== undefined) {
    maxScore += 3;
    if (data.roic > 15) {
      score += 3;
      reasoning.push(`✅ High ROIC of ${data.roic.toFixed(2)}% shows capital efficiency`);
    } else {
      reasoning.push(`❌ Weak ROIC of ${data.roic.toFixed(2)}%`);
    }
  }

  if (data.grossMargin !== null && data.grossMargin !== undefined) {
    maxScore += 2;
    if (data.grossMargin > 40) {
      score += 2;
      reasoning.push(`✅ Strong Gross Margin of ${data.grossMargin.toFixed(2)}% indicating pricing power`);
    } else {
      reasoning.push(`❌ Weak Gross Margin of ${data.grossMargin.toFixed(2)}%`);
    }
  }

  if (data.debtToEquity !== null && data.debtToEquity !== undefined) {
    maxScore += 1;
    if (data.debtToEquity < 0.7) {
      score += 1;
      reasoning.push(`✅ Sensible debt level (D/E: ${data.debtToEquity.toFixed(2)})`);
    } else {
      reasoning.push(`❌ Dangerously high debt (D/E: ${data.debtToEquity.toFixed(2)})`);
    }
  }

  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
  let signal: Signal = "neutral";
  if (percentage >= 80) signal = "bullish";
  else if (percentage <= 40) signal = "bearish";

  if (reasoning.length === 0) reasoning.push("Insufficient data for evaluation.");

  return { signal, confidence: percentage, reasoning };
}

function philFisherAgent(data: StockEvaluationData): AgentResult {
  const reasoning: string[] = [];
  let score = 0;
  let maxScore = 0;

  if (data.operatingMargin !== null && data.operatingMargin !== undefined) {
    maxScore += 3;
    if (data.operatingMargin > 15) {
      score += 3;
      reasoning.push(`✅ Excellent operational efficiency (Operating Margin: ${data.operatingMargin.toFixed(2)}%)`);
    } else {
      reasoning.push(`❌ Weak operational efficiency (Operating Margin: ${data.operatingMargin.toFixed(2)}%)`);
    }
  }

  if (data.epsGrowthYoY !== null && data.epsGrowthYoY !== undefined) {
    maxScore += 2;
    if (data.epsGrowthYoY > 15) {
      score += 2;
      reasoning.push(`✅ Strong EPS Growth YoY (+${data.epsGrowthYoY.toFixed(2)}%)`);
    } else {
      reasoning.push(`❌ Poor EPS Growth YoY (${data.epsGrowthYoY.toFixed(2)}%)`);
    }
  }

  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
  let signal: Signal = "neutral";
  if (percentage >= 70) signal = "bullish";
  else if (percentage <= 40) signal = "bearish";

  if (reasoning.length === 0) reasoning.push("Insufficient data for evaluation.");

  return { signal, confidence: percentage, reasoning };
}

function stanDruckenmillerAgent(data: StockEvaluationData): AgentResult {
  const reasoning: string[] = [];
  let score = 0;
  let maxScore = 0;

  if (data.epsGrowthYoY !== null && data.epsGrowthYoY !== undefined) {
    maxScore += 3;
    if (data.epsGrowthYoY > 20) {
      score += 3;
      reasoning.push(`✅ Earnings momentum is accelerating (+${data.epsGrowthYoY.toFixed(2)}% YoY)`);
    } else if (data.epsGrowthYoY > 0) {
      score += 1;
      reasoning.push(`⚠️ Weak earnings momentum (+${data.epsGrowthYoY.toFixed(2)}% YoY)`);
    } else {
      reasoning.push(`❌ Negative earnings momentum (${data.epsGrowthYoY.toFixed(2)}% YoY)`);
    }
  }

  if (data.threeMonthReturn !== null && data.threeMonthReturn !== undefined) {
    maxScore += 2;
    if (data.threeMonthReturn > 10) {
      score += 2;
      reasoning.push(`✅ Strong near-term price momentum (+${data.threeMonthReturn.toFixed(2)}% in 3M)`);
    } else if (data.threeMonthReturn < 0) {
      reasoning.push(`❌ Negative near-term price momentum (${data.threeMonthReturn.toFixed(2)}% in 3M)`);
    }
  }

  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
  let signal: Signal = "neutral";
  if (percentage >= 75) signal = "bullish";
  else if (percentage <= 30) signal = "bearish";

  if (reasoning.length === 0) reasoning.push("Insufficient data for evaluation.");

  return { signal, confidence: percentage, reasoning };
}

function warrenBuffettAgent(data: StockEvaluationData): AgentResult {
  const reasoning: string[] = [];
  let score = 0;
  let maxScore = 0;

  if (data.roe !== null && data.roe !== undefined) {
    maxScore += 3;
    if (data.roe > 15) {
      score += 3;
      reasoning.push(`✅ High ROE of ${data.roe.toFixed(2)}% indicating strong capital allocation`);
    } else {
      reasoning.push(`❌ Low ROE of ${data.roe.toFixed(2)}%`);
    }
  }

  if (data.netIncome !== null && data.netIncome !== undefined) {
    maxScore += 2;
    if (data.netIncome > 0) {
      score += 2;
      reasoning.push(`✅ Company is profitable`);
    } else {
      reasoning.push(`❌ Company is losing money`);
    }
  }

  if (data.debtToEquity !== null && data.debtToEquity !== undefined) {
    maxScore += 2;
    if (data.debtToEquity < 0.5) {
      score += 2;
      reasoning.push(`✅ Conservative debt structure (D/E: ${data.debtToEquity.toFixed(2)})`);
    } else {
      reasoning.push(`❌ High debt structure (D/E: ${data.debtToEquity.toFixed(2)})`);
    }
  }

  if (data.intrinsicValue !== null && data.intrinsicValue !== undefined) {
    maxScore += 3;
    if (data.price < data.intrinsicValue * 0.8) {
      score += 3;
      reasoning.push(`✅ Trading at a discount to intrinsic value (Margin of Safety > 20%)`);
    } else if (data.price > data.intrinsicValue) {
      reasoning.push(`❌ Trading at a premium to intrinsic value`);
    } else {
      score += 1;
      reasoning.push(`⚠️ Trading near fair value`);
    }
  }

  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
  let signal: Signal = "neutral";
  if (percentage >= 80) signal = "bullish";
  else if (percentage <= 40) signal = "bearish";

  if (reasoning.length === 0) reasoning.push("Insufficient data for evaluation.");

  return { signal, confidence: percentage, reasoning };
}

// ==========================================
// RISK & PORTFOLIO MANAGERS
// ==========================================

function portfolioManager(
  evaluations: Record<string, StockEvaluationResult>,
  cash: number
): HedgeFundResult {
  const decisions: Record<string, PortfolioDecision> = {};
  const summary: string[] = [];
  let remainingCash = cash;

  for (const [symbol, evalResult] of Object.entries(evaluations)) {
    const agents = evalResult.agents;
    const signalsList = Object.values(agents);
    const bullishCount = signalsList.filter((s) => s.signal === "bullish").length;
    const bearishCount = signalsList.filter((s) => s.signal === "bearish").length;
    
    let avgConfidence = 0;
    signalsList.forEach((s) => (avgConfidence += s.confidence));
    avgConfidence = avgConfidence / signalsList.length;

    let action: "BUY" | "SELL" | "HOLD" = "HOLD";
    const reasoning: string[] = [];

    if (bullishCount >= 4 && avgConfidence > 65) {
      action = "BUY";
      reasoning.push(`Consensus BUY: ${bullishCount}/7 agents are bullish with ${avgConfidence.toFixed(0)}% average conviction.`);
    } else if (bearishCount >= 3) {
      action = "SELL";
      reasoning.push(`Consensus SELL: ${bearishCount}/7 agents are bearish.`);
    } else {
      action = "HOLD";
      reasoning.push(`Mixed signals: ${bullishCount} bullish, ${bearishCount} bearish. Not enough conviction.`);
    }

    let allocationAmount = 0;
    let quantity = 0;

    if (action === "BUY") {
      // Basic Risk Sizing: Allocate up to 15% per stock if strongly bullish
      const allocationPercent = avgConfidence > 80 ? 0.15 : 0.10; 
      let targetAllocation = cash * allocationPercent;
      if (targetAllocation > remainingCash) {
        targetAllocation = remainingCash;
      }
      if (targetAllocation > 0 && evalResult.price > 0) {
        quantity = Math.floor(targetAllocation / evalResult.price);
        allocationAmount = quantity * evalResult.price;
        remainingCash -= allocationAmount;
        reasoning.push(`Risk Manager approved ${allocationPercent * 100}% portfolio allocation limit.`);
      }
    }

    decisions[symbol] = {
      action,
      quantity,
      allocationAmount,
      reasoning,
    };
  }

  summary.push(`Processed ${Object.keys(evaluations).length} stocks.`);
  const boughtCount = Object.values(decisions).filter(d => d.action === "BUY").length;
  summary.push(`Initiated BUY orders for ${boughtCount} assets.`);
  summary.push(`Remaining Cash: $${remainingCash.toLocaleString()}`);

  return {
    decisions,
    evaluations,
    summary,
  };
}

export function runHedgeFundEngine(
  stocksData: StockEvaluationData[],
  initialCash: number
): HedgeFundResult {
  const evaluations: Record<string, StockEvaluationResult> = {};

  for (const data of stocksData) {
    evaluations[data.symbol] = {
      symbol: data.symbol,
      price: data.price,
      agents: {
        benGraham: benGrahamAgent(data),
        billAckman: billAckmanAgent(data),
        cathieWood: cathieWoodAgent(data),
        charlieMunger: charlieMungerAgent(data),
        philFisher: philFisherAgent(data),
        stanDruckenmiller: stanDruckenmillerAgent(data),
        warrenBuffett: warrenBuffettAgent(data),
      },
    };
  }

  return portfolioManager(evaluations, initialCash);
}
