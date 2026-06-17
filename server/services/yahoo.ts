import YahooFinance from 'yahoo-finance2';
import { cacheService, CACHE_TTLS } from './cache.js';

const yahooFinance = new YahooFinance();

export const yahooService = {
  // Fetch historical financial data (5 years of Annual statements)
  getFinancials: async (symbol: string) => {
    const rawSymbol = symbol.toUpperCase();
    const cacheKey = `yahoo:financials:${rawSymbol}`;

    // Try cache first
    const cached = cacheService.get<any>(cacheKey);
    if (cached) {
      cacheService.logHit('financials', rawSymbol, 'MEMCACHE_YAHOO');
      return cached;
    }

    console.log(`[YAHOO] Fetching quoteSummary for: ${rawSymbol}`);
    try {
      // Disabling some auto-parsing issues that could throw, call quoteSummary directly
      const result: any = await yahooFinance.quoteSummary(rawSymbol, {
        modules: [
          'incomeStatementHistory',
          'balanceSheetHistory',
          'cashflowStatementHistory',
          'financialData',
          'defaultKeyStatistics'
        ]
      });

      if (!result) {
        throw new Error('No quoteSummary results found');
      }

      // Extract and map into standardized schema
      const financialsObj = {
        incomeStatement: result.incomeStatementHistory?.incomeStatementHistory || [],
        balanceSheet: result.balanceSheetHistory?.balanceSheetStatements || [],
        cashFlow: result.cashflowStatementHistory?.cashflowStatements || [],
        ratios: {
          recommendationKey: result.financialData?.recommendationKey || '—',
          targetMeanPrice: result.financialData?.targetMeanPrice || null,
          profitMargins: result.financialData?.profitMargins || null,
          operatingMargins: result.financialData?.operatingMargins || null,
          returnOnAssets: result.financialData?.returnOnAssets || null,
          returnOnEquity: result.financialData?.returnOnEquity || null,
          debtToEquity: result.financialData?.debtToEquity || null,
          currentRatio: result.financialData?.currentRatio || null,
          dividendYield: result.defaultKeyStatistics?.dividendYield || null,
          pegRatio: result.defaultKeyStatistics?.pegRatio || null,
          priceToBook: result.defaultKeyStatistics?.priceToBook || null,
          enterpriseToEquity: result.defaultKeyStatistics?.enterpriseToRevenue || null
        }
      };

      // Set node-cache & save backend SQLite persistent backup
      cacheService.set(cacheKey, financialsObj, CACHE_TTLS.FUNDAMENTALS);
      cacheService.saveFundamentalsBackup(rawSymbol, financialsObj, 'YAHOO');

      return financialsObj;
    } catch (error: any) {
      console.error(`[YAHOO ERROR] Failed to fetch financials for ${rawSymbol}`, error.message);
      
      // Fallback to SQLite check
      const backup = cacheService.getFundamentalsBackup(rawSymbol);
      if (backup) {
        console.log(`[YAHOO FALLBACK] Returned SQLite fundamental data backup for ${rawSymbol}`);
        return backup.data;
      }
      throw error;
    }
  },

  // Index quotes fallback (^GSPC, ^IXIC, ^DJI, ^FTSE, ^N225, ^BSESN)
  getIndexQuote: async (symbol: string) => {
    const rawSymbol = symbol.toUpperCase();
    const cacheKey = `yahoo:index:${rawSymbol}`;

    const cached = cacheService.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      console.log(`[YAHOO] Fetching web-scraped quote for Index: ${rawSymbol}`);
      const result: any = await yahooFinance.quote(rawSymbol);
      if (result) {
        const mapped = {
          price: result.regularMarketPrice,
          change: result.regularMarketChange,
          change_pct: result.regularMarketChangePercent,
          high: result.regularMarketDayHigh || result.regularMarketPrice,
          low: result.regularMarketDayLow || result.regularMarketPrice,
          prev_close: result.regularMarketPreviousClose || result.regularMarketPrice
        };
        cacheService.set(cacheKey, mapped, CACHE_TTLS.QUOTE); // 5 min TTL
        return mapped;
      }
    } catch (error: any) {
      console.error(`[YAHOO INDEX ERROR] Failed index fetch for ${rawSymbol}`, error.message);
    }
    return null;
  }
};
