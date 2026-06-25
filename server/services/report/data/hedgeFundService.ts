import { runHedgeFundEngine, StockEvaluationData, HedgeFundResult } from '../../hedgeFundEngine.js';
import { YFData } from './yahooFinanceService.js';
import { computeMargins } from '../compute/ratios.js';

export function runHedgeFundForReport(ticker: string, yfData: YFData): HedgeFundResult | null {
  try {
    const quote = yfData.quoteSummary.financialData || {};
    const stats = yfData.quoteSummary.defaultKeyStatistics || {};
    const price = quote.currentPrice || 0;
    
    // We need ROE, ROIC, Margins, etc.
    let roe = quote.returnOnEquity !== undefined ? quote.returnOnEquity * 100 : null;
    let roic = stats.returnOnAssets !== undefined ? stats.returnOnAssets * 100 : null; // Close proxy if ROIC not direct
    let grossMargin = quote.grossMargins !== undefined ? quote.grossMargins * 100 : null;
    let operatingMargin = quote.operatingMargins !== undefined ? quote.operatingMargins * 100 : null;
    
    const debtToEquity = quote.debtToEquity !== undefined ? quote.debtToEquity / 100 : null;
    const currentRatio = quote.currentRatio || null;
    
    const returns = yfData.returns || {};
    
    const stockData: StockEvaluationData = {
      symbol: ticker,
      price: price,
      marketCap: quote.targetMeanPrice ? quote.targetMeanPrice * 1000000 : null, // Not directly used in many agents, but required
      peRatio: quote.trailingPE || stats.trailingPE || null,
      pbRatio: stats.priceToBook || null,
      debtToEquity: debtToEquity,
      currentRatio: currentRatio,
      roe: roe,
      roic: roic,
      grossMargin: grossMargin,
      operatingMargin: operatingMargin,
      netIncome: quote.netIncomeToCommon || null,
      revenueGrowthYoY: quote.revenueGrowth !== undefined ? quote.revenueGrowth * 100 : null,
      epsGrowthYoY: quote.earningsGrowth !== undefined ? quote.earningsGrowth * 100 : null,
      fcfYield: quote.freeCashflow && quote.targetMeanPrice ? (quote.freeCashflow / (quote.targetMeanPrice * 1000000)) * 100 : null,
      oneYearReturn: returns.oneYear !== null && returns.oneYear !== undefined ? returns.oneYear * 100 : null,
      sixMonthReturn: returns.threeMonth !== null && returns.threeMonth !== undefined ? returns.threeMonth * 100 : null, // proxy
      threeMonthReturn: returns.threeMonth !== null && returns.threeMonth !== undefined ? returns.threeMonth * 100 : null,
      volatility: stats.beta || null,
      sector: yfData.profile.assetProfile?.sector || "Unknown",
      intrinsicValue: quote.targetMeanPrice || null
    };

    const result = runHedgeFundEngine([stockData], 1000000);
    return result;
  } catch (error) {
    console.error(`[HedgeFundService] Error running engine for ${ticker}:`, error);
    return null;
  }
}
