import YahooFinance from 'yahoo-finance2';
import { yahooService } from '../../yahoo.js';

const yahooFinance = new YahooFinance();

export interface YFData {
  profile: any;
  quoteSummary: any;
  history: any[];
  fundamentals?: any[]; // TimeSeries fundamentals
  returns?: {
    oneMonth: number | null;
    threeMonth: number | null;
    oneYear: number | null;
    threeYear: number | null;
    fiveYear: number | null;
  };
}

export async function fetchYahooData(ticker: string): Promise<YFData> {
  const profile = await yahooFinance.quoteSummary(ticker, { 
    modules: [
      'assetProfile', 
      'defaultKeyStatistics', 
      'financialData', 
      'recommendationTrend',
      'earningsTrend',
      'price',
      'quoteType',
      'summaryDetail'
    ] 
  });
  
  let fundamentals = [];
  try {
    const to = new Date().toISOString().split('T')[0];
    // Fetch 6 years of data to ensure we get 5 full annual periods
    const from = new Date(Date.now() - 6 * 365 * 24 * 3600 * 1000).toISOString().split('T')[0];
    fundamentals = await yahooService.getFundamentalsTimeSeries(ticker, from, to);
  } catch (err) {
    console.error(`Failed to fetch time series fundamentals for ${ticker}:`, err);
  }

  // Fetch 5 years of price history for returns calculation
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
  const period1 = fiveYearsAgo.toISOString().split('T')[0];
  
  let history: any[] = [];
  let returns = { oneMonth: null, threeMonth: null, oneYear: null, threeYear: null, fiveYear: null };
  try {
    const historyResult = await yahooFinance.chart(ticker, { period1, interval: '1d' });
    history = historyResult.quotes;

    // Calculate returns
    if (history.length > 0) {
      const currentPrice = history[history.length - 1].close;
      
      const getPriceAtOffset = (days: number) => {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - days);
        // Find closest date before or equal
        for (let i = history.length - 1; i >= 0; i--) {
          if (new Date(history[i].date) <= targetDate) {
            return history[i].close;
          }
        }
        return history[0].close; // fallback to oldest
      };

      const p1m = getPriceAtOffset(30);
      const p3m = getPriceAtOffset(90);
      const p1y = getPriceAtOffset(365);
      const p3y = getPriceAtOffset(365 * 3);
      const p5y = history[0].close;

      returns = {
        oneMonth: p1m ? (currentPrice - p1m) / p1m : null,
        threeMonth: p3m ? (currentPrice - p3m) / p3m : null,
        oneYear: p1y ? (currentPrice - p1y) / p1y : null,
        threeYear: p3y ? (currentPrice - p3y) / p3y : null,
        fiveYear: p5y ? (currentPrice - p5y) / p5y : null,
      };
    }
  } catch (err) {
    console.error(`Failed to fetch chart history for ${ticker}:`, err);
  }
  
  return {
    profile,
    quoteSummary: profile, // for convenience
    history,
    fundamentals,
    returns
  };
}
