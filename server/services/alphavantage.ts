import axios from 'axios';
import { cacheService, CACHE_TTLS } from './cache.js';

const BASE_URL = 'https://www.alphavantage.co/query';

let activeKeyIndex = 0;

const getApiKeys = (): string[] => {
  const envKeys = process.env.ALPHAVANTAGE_API_KEYS;
  if (envKeys) {
    return envKeys.split(',').map(k => k.trim()).filter(Boolean);
  }
  const envSingleKey = process.env.ALPHAVANTAGE_API_KEY;
  if (envSingleKey) {
    return [envSingleKey];
  }
  return [
    '50K88O6BJNSRA1MY'
  ];
};

export const alphavantageService = {
  // Query specific function on Alpha Vantage
  fetchDetails: async (symbol: string, func: 'INCOME_STATEMENT' | 'BALANCE_SHEET' | 'CASH_FLOW') => {
    const cleanSymbol = symbol.toUpperCase();
    const cacheKey = `alphavantage:${func.toLowerCase()}:${cleanSymbol}`;

    // Read cache
    const cached = cacheService.get<any>(cacheKey);
    if (cached) {
      cacheService.logHit(func.toLowerCase(), cleanSymbol, 'MEMCACHE_ALPHAVANTAGE');
      return cached;
    }

    const keys = getApiKeys();
    const maxRetries = keys.length;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const apiKey = keys[activeKeyIndex];
      console.log(`[ALPHAVANTAGE] Requesting ${func} for ${cleanSymbol} (Attempt ${attempt + 1}/${maxRetries} using key index ${activeKeyIndex})`);
      
      try {
        const response = await axios.get(BASE_URL, {
          params: {
            function: func,
            symbol: cleanSymbol,
            apikey: apiKey
          },
          timeout: 10000
        });

        const data = response.data;
        if (!data || data.Note || data.Information) {
          console.warn(`[ALPHAVANTAGE WARNING] API Note or limit reached for ${func} using key index ${activeKeyIndex}:`, data.Note || data.Information);
          // Rotate key and retry
          activeKeyIndex = (activeKeyIndex + 1) % keys.length;
          continue;
        }

        // Cache fundamentals for 24 hours
        cacheService.set(cacheKey, data, CACHE_TTLS.FUNDAMENTALS);
        return data;
      } catch (error: any) {
        const status = error.response?.status;
        const isRateLimit = status === 429 || status === 401;
        if (isRateLimit) {
          console.warn(`[ALPHAVANTAGE WARNING] Axios error (status ${status}) on key index ${activeKeyIndex}`);
          activeKeyIndex = (activeKeyIndex + 1) % keys.length;
          continue;
        }

        console.error(`[ALPHAVANTAGE ERROR] Failed fetching ${func} for ${cleanSymbol}:`, error.message);
        throw error;
      }
    }

    console.error('[ALPHAVANTAGE FATAL] Exhausted all configured API keys.');
    throw new Error('ALPHAVANTAGE_LIMIT_EXCEEDED');
  },

  // Gather total financials as robust Layer 3 waterfall fallback
  getFinancials: async (symbol: string) => {
    const cleanSymbol = symbol.toUpperCase();
    const cacheKey = `alphavantage:all_financials:${cleanSymbol}`;

    // Check memory cache
    const cached = cacheService.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Gather statements asynchronously
      const [incomeData, balanceData, cashData] = await Promise.all([
        alphavantageService.fetchDetails(cleanSymbol, 'INCOME_STATEMENT'),
        alphavantageService.fetchDetails(cleanSymbol, 'BALANCE_SHEET'),
        alphavantageService.fetchDetails(cleanSymbol, 'CASH_FLOW')
      ]);

      // Standardize schema format to align perfectly with our Recharts pages
      const mapped = {
        incomeStatement: (incomeData.annualReports || []).map((r: any) => ({
          fiscalDateEnding: r.fiscalDateEnding,
          totalRevenue: Number(r.totalRevenue) || 0,
          grossProfit: Number(r.grossProfit) || 0,
          netIncome: Number(r.netIncome) || 0
        })),
        balanceSheet: (balanceData.annualReports || []).map((r: any) => ({
          fiscalDateEnding: r.fiscalDateEnding,
          totalAssets: Number(r.totalAssets) || 0,
          totalLiabilities: Number(r.totalLiabilities) || 0,
          totalShareholderEquity: Number(r.totalShareholderEquity) || 0
        })),
        cashFlow: (cashData.annualReports || []).map((r: any) => ({
          fiscalDateEnding: r.fiscalDateEnding,
          operatingCashflow: Number(r.operatingCashflow) || 0,
          investingCashflow: Number(r.capitalExpenditures) || 0, // proxy or relative items
          financingCashflow: Number(r.cashflowFromFinancingActivities) || 0
        })),
        ratios: {
          recommendationKey: '—',
          targetMeanPrice: null,
          profitMargins: null,
          returnOnEquity: null,
          debtToEquity: null,
          currentRatio: null,
          dividendYield: null,
          priceToBook: null
        }
      };

      // Set combined cache and save to SQLite
      cacheService.set(cacheKey, mapped, CACHE_TTLS.FUNDAMENTALS);
      cacheService.saveFundamentalsBackup(cleanSymbol, mapped, 'ALPHAVANTAGE');

      return mapped;
    } catch (error: any) {
      console.error(`[ALPHAVANTAGE WATERFALL FAIL] Could not compile absolute fundamentals fallback for ${cleanSymbol}:`, error.message);
      
      // Attempt SQLite fallback retrieve
      const backup = cacheService.getFundamentalsBackup(cleanSymbol);
      if (backup) {
        console.log(`[ALPHAVANTAGE DB FALLBACK] Standard backup restored for: ${cleanSymbol}`);
        return backup.data;
      }
      return null;
    }
  }
};
