import YahooFinance from 'yahoo-finance2';
import { cacheService, CACHE_TTLS } from './cache.js';
import { z } from 'zod';
import CircuitBreaker from 'opossum';

// ESM/CJS interop compatibility resolver for bundlers (e.g. esbuild/webpack)
let YahooFinanceClass: any = YahooFinance;
if (YahooFinanceClass && typeof YahooFinanceClass.default === 'function') {
  YahooFinanceClass = YahooFinanceClass.default;
}

// Caps concurrency globally at client level to avoid rate limits
const yahooFinance = new YahooFinanceClass({
  queue: { concurrency: 4 }
});

// Request Coalescing Map and Helper
const inFlight = new Map<string, Promise<any>>();

async function dedupedFetch<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (inFlight.has(key)) {
    return inFlight.get(key)!;
  }
  const promise = fn().finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}

// Zod Schema Validation for quotes
const QuoteSchema = z.object({
  price: z.number().positive(),
  change: z.number(),
  change_pct: z.number().min(-100).max(1000),
}).passthrough();

// Circuit Breaker configuration
const breakerOptions = {
  timeout: 8000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
};

const quoteBreaker = new CircuitBreaker((sym: string) => yahooFinance.quote(sym), breakerOptions);
const quoteSummaryBreaker = new CircuitBreaker((sym: string, options: any) => yahooFinance.quoteSummary(sym, options), breakerOptions);
const recommendationsBreaker = new CircuitBreaker((sym: string) => yahooFinance.recommendationsBySymbol(sym), breakerOptions);
const searchBreaker = new CircuitBreaker((query: string) => yahooFinance.search(query), breakerOptions);
const chartBreaker = new CircuitBreaker((sym: string, options: any) => yahooFinance.chart(sym, options), breakerOptions);

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
      const financialsObj = await dedupedFetch(cacheKey, async () => {
        const result: any = await quoteSummaryBreaker.fire(rawSymbol, {
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
        const mapped = {
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
        cacheService.set(cacheKey, mapped, CACHE_TTLS.FUNDAMENTALS);
        cacheService.saveFundamentalsBackup(rawSymbol, mapped, 'YAHOO');

        return mapped;
      });

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
      const mapped = await dedupedFetch(cacheKey, async () => {
        const result: any = await quoteBreaker.fire(rawSymbol);
        if (result) {
          const quoteObj = {
            price: result.regularMarketPrice,
            change: result.regularMarketChange,
            change_pct: result.regularMarketChangePercent,
            high: result.regularMarketDayHigh || result.regularMarketPrice,
            low: result.regularMarketDayLow || result.regularMarketPrice,
            prev_close: result.regularMarketPreviousClose || result.regularMarketPrice
          };
          cacheService.set(cacheKey, quoteObj, CACHE_TTLS.QUOTE); // 5 min TTL
          return quoteObj;
        }
        throw new Error('No index quote result found');
      });
      return mapped;
    } catch (error: any) {
      console.error(`[YAHOO INDEX ERROR] Failed index fetch for ${rawSymbol}`, error.message);
    }
    return null;
  },

  // Real-time quote
  getQuote: async (symbol: string) => {
    const rawSymbol = symbol.toUpperCase();
    const cacheKey = `yahoo:quote:${rawSymbol}`;

    // Try cache first
    const cached = cacheService.get<any>(cacheKey);
    if (cached) {
      cacheService.logHit('quote', rawSymbol, 'MEMCACHE_YAHOO_QUOTE');
      return cached;
    }

    try {
      console.log(`[YAHOO] Fetching real-time quote for: ${rawSymbol}`);
      const mapped = await dedupedFetch(cacheKey, async () => {
        const result: any = await quoteBreaker.fire(rawSymbol);
        if (result) {
          const quoteObj = {
            price: result.regularMarketPrice,
            change: result.regularMarketChange ?? 0,
            change_pct: result.regularMarketChangePercent ?? 0,
            high: result.regularMarketDayHigh || result.regularMarketPrice,
            low: result.regularMarketDayLow || result.regularMarketPrice,
            open: result.regularMarketOpen || result.regularMarketPrice,
            prev_close: result.regularMarketPreviousClose || result.regularMarketPrice,
            high_52w: result.fiftyTwoWeekHigh || null,
            low_52w: result.fiftyTwoWeekLow || null,
            volume: result.regularMarketVolume || null,
            avg_volume: result.averageDailyVolume3Month || null
          };

          // Zod validation before caching/SQLite write
          const parsed = QuoteSchema.safeParse(quoteObj);
          if (!parsed.success) {
            console.error(`[YAHOO VALIDATION] Rejected bad quote for ${rawSymbol}`, parsed.error.flatten());
            const backup = cacheService.getQuoteBackup(rawSymbol);
            if (backup) {
              console.log(`[YAHOO VALIDATION FALLBACK] Using backup quote for ${rawSymbol}`);
              return backup;
            }
            throw new Error('Quote failed validation and no backup available');
          }

          cacheService.set(cacheKey, quoteObj, CACHE_TTLS.QUOTE);
          cacheService.saveQuoteBackup(rawSymbol, quoteObj);
          return quoteObj;
        }
        throw new Error('No quote results found');
      });
      return mapped;
    } catch (error: any) {
      console.error(`[YAHOO QUOTE ERROR] Failed to fetch quote for ${rawSymbol}`, error.message);
      const backup = cacheService.getQuoteBackup(rawSymbol);
      if (backup) {
        console.log(`[YAHOO QUOTE FALLBACK] Returned SQLite quote backup for ${rawSymbol}`);
        return backup;
      }
      throw error;
    }
  },

  // Company profile
  getProfile: async (symbol: string) => {
    const rawSymbol = symbol.toUpperCase();
    const cacheKey = `yahoo:profile:${rawSymbol}`;

    const cached = cacheService.get<any>(cacheKey);
    if (cached) {
      cacheService.logHit('profile', rawSymbol, 'MEMCACHE_YAHOO_PROFILE');
      return cached;
    }

    try {
      console.log(`[YAHOO] Fetching profile for: ${rawSymbol}`);
      const profileObj = await dedupedFetch(cacheKey, async () => {
        const result: any = await quoteSummaryBreaker.fire(rawSymbol, {
          modules: ['assetProfile', 'price']
        });

        if (!result) {
          throw new Error('No quoteSummary results found for profile');
        }

        const website = result.assetProfile?.website || '';
        let logoUrl = '';
        if (website) {
          try {
            const urlObj = new URL(website);
            logoUrl = `https://logo.clearbit.com/${urlObj.hostname}`;
          } catch (_) {}
        }

        const mapped = {
          name: result.price?.longName || result.price?.shortName || rawSymbol,
          logo: logoUrl,
          finnhubIndustry: result.assetProfile?.industry || 'Miscellaneous Industries',
          exchange: result.price?.exchangeName || result.price?.exchange || 'OTC Market',
          country: result.assetProfile?.country || 'US',
          weburl: website,
          ipo: '—',
          description: result.assetProfile?.longBusinessSummary || `${rawSymbol} is a leading global enterprise.`
        };

        cacheService.set(cacheKey, mapped, CACHE_TTLS.FUNDAMENTALS);
        return mapped;
      });

      return profileObj;
    } catch (error: any) {
      console.error(`[YAHOO PROFILE ERROR] Failed to fetch profile for ${rawSymbol}`, error.message);
      // Fallback to SQLite DB backup if available
      const backup = cacheService.getFundamentalsBackup(rawSymbol);
      if (backup && backup.data) {
        return {
          name: backup.data.name || rawSymbol,
          logo: backup.data.logo || '',
          finnhubIndustry: backup.data.industry || 'Miscellaneous Industries',
          exchange: backup.data.exchange || 'OTC Market',
          country: backup.data.country || 'US',
          weburl: backup.data.weburl || '',
          ipo: backup.data.ipo || '—',
          description: backup.data.description || `${rawSymbol} is a leading global enterprise.`
        };
      }
      throw error;
    }
  },

  // Basic financials (metrics)
  getBasicFinancials: async (symbol: string) => {
    const rawSymbol = symbol.toUpperCase();
    const cacheKey = `yahoo:basic:${rawSymbol}`;

    const cached = cacheService.get<any>(cacheKey);
    if (cached) {
      cacheService.logHit('basic_financials', rawSymbol, 'MEMCACHE_YAHOO_BASIC');
      return cached;
    }

    // Try SQLite backup next (if within 24h) - survives server restarts
    const backup = cacheService.getRatiosBackup(rawSymbol);
    if (backup && (Date.now() - backup.updated_at < CACHE_TTLS.FUNDAMENTALS * 1000)) {
      console.log(`[YAHOO] Found fresh SQLite ratios backup for: ${rawSymbol}`);
      cacheService.set(cacheKey, backup.data, CACHE_TTLS.FUNDAMENTALS);
      return backup.data;
    }

    try {
      console.log(`[YAHOO] Fetching basic financials for: ${rawSymbol}`);
      const basicObj = await dedupedFetch(cacheKey, async () => {
        const summary: any = await quoteSummaryBreaker.fire(rawSymbol, {
          modules: ['financialData', 'defaultKeyStatistics', 'summaryDetail']
        });

        const fd = (summary?.financialData || {}) as any;
        const ks = (summary?.defaultKeyStatistics || {}) as any;
        const sd = (summary?.summaryDetail || {}) as any;

        const mapped = {
          metric: {
            // Valuation
            peTrailing: ks.trailingPE || sd.trailingPE || null,
            peForward: ks.forwardPE || sd.forwardPE || null,
            pegRatio: ks.pegRatio || null,
            priceToBook: ks.priceToBook || null,
            priceToSales: sd.priceToSalesTrailing12Months || null,
            dividendYield: sd.dividendYield ? sd.dividendYield * 100 : (ks.dividendYield ? ks.dividendYield * 100 : null),

            // Ratios
            roeTTM: fd.returnOnEquity ? fd.returnOnEquity * 100 : null,
            roaTTM: fd.returnOnAssets ? fd.returnOnAssets * 100 : null,
            debtEquityAnnual: fd.debtToEquity || null,
            currentRatio: fd.currentRatio || null,

            // Income Statement
            revenueGrowth: fd.revenueGrowth ? fd.revenueGrowth * 100 : null,
            earningsGrowth: fd.earningsGrowth ? fd.earningsGrowth * 100 : null,
            grossMargins: fd.grossMargins ? fd.grossMargins * 100 : null,
            operatingMargins: fd.operatingMargins ? fd.operatingMargins * 100 : null,
            profitMargins: fd.profitMargins ? fd.profitMargins * 100 : null,

            // Balance Sheet & Popular
            freeCashflow: fd.freeCashflow || null,
            totalDebt: fd.totalDebt || null,
            marketCapitalization: ks.marketCap ? ks.marketCap / 1000000 : (ks.enterpriseValue ? ks.enterpriseValue / 1000000 : null),

            // Keep backwards-compatible fields
            peAnnual: ks.trailingPE || ks.forwardPE || null,
            pbAnnual: ks.priceToBook || null,
            roicTTM: fd.returnOnAssets ? fd.returnOnAssets * 100 : null,
            epsBasicExclExtraItemsTTM: ks.trailingEps || ks.forwardEps || null,
            dividendYieldIndicated: sd.dividendYield ? sd.dividendYield * 100 : (ks.dividendYield ? ks.dividendYield * 100 : null),
            enterpriseValue: ks.enterpriseValue || null,
            sharesOutstanding: ks.sharesOutstanding || null,
            bookValue: ks.bookValue || null,
            totalCash: fd.totalCash || null
          }
        };

        cacheService.set(cacheKey, mapped, CACHE_TTLS.FUNDAMENTALS);
        cacheService.saveRatiosBackup(rawSymbol, mapped);
        return mapped;
      });

      return basicObj;
    } catch (error: any) {
      console.error(`[YAHOO BASIC ERROR] Failed to fetch basic financials for ${rawSymbol}`, error.message);
      
      // Fallback to SQLite check (even if expired) before giving up
      if (backup) {
        console.log(`[YAHOO BASIC FALLBACK] Returned stale SQLite ratios backup for ${rawSymbol}`);
        return backup.data;
      }

      return {
        metric: {
          peAnnual: null,
          pbAnnual: null,
          roeTTM: null,
          roicTTM: null,
          debtEquityAnnual: null,
          epsBasicExclExtraItemsTTM: null,
          marketCapitalization: null,
          dividendYieldIndicated: null
        }
      };
    }
  },

  // Recommended peers
  getPeers: async (symbol: string) => {
    const rawSymbol = symbol.toUpperCase();
    const cacheKey = `yahoo:peers:${rawSymbol}`;

    const cached = cacheService.get<any>(cacheKey);
    if (cached) {
      cacheService.logHit('peers', rawSymbol, 'MEMCACHE_YAHOO_PEERS');
      return cached;
    }

    try {
      console.log(`[YAHOO] Fetching peers for: ${rawSymbol}`);
      const peers = await dedupedFetch(cacheKey, async () => {
        const recs: any = await recommendationsBreaker.fire(rawSymbol);
        const mappedPeers = (recs?.recommendedSymbols || []).map((r: any) => r.symbol);
        cacheService.set(cacheKey, mappedPeers, CACHE_TTLS.PEERS);
        return mappedPeers;
      });
      return peers;
    } catch (error: any) {
      console.error(`[YAHOO PEERS ERROR] Failed to fetch peers for ${rawSymbol}`, error.message);
      return [];
    }
  },

  // News
  getNews: async (symbol: string) => {
    const rawSymbol = symbol.toUpperCase();
    const cacheKey = `yahoo:news:${rawSymbol}`;

    const cached = cacheService.get<any>(cacheKey);
    if (cached) {
      cacheService.logHit('news', rawSymbol, 'MEMCACHE_YAHOO_NEWS');
      return cached;
    }

    try {
      console.log(`[YAHOO] Fetching news for symbol: ${rawSymbol}`);
      const mappedNews = await dedupedFetch(cacheKey, async () => {
        const searchResult: any = await searchBreaker.fire(rawSymbol);
        const newsArr = (searchResult.news || []).map((item: any) => ({
          id: item.uuid,
          headline: item.title,
          summary: item.summary || item.title,
          source: item.publisher,
          datetime: item.providerPublishTime ? Math.floor(Date.parse(item.providerPublishTime) / 1000) : Math.floor(Date.now() / 1000),
          url: item.link
        }));
        cacheService.set(cacheKey, newsArr, CACHE_TTLS.NEWS);
        return newsArr;
      });
      return mappedNews;
    } catch (error: any) {
      console.error(`[YAHOO NEWS ERROR] Failed to fetch news for ${rawSymbol}`, error.message);
      return [];
    }
  },

  // General Market News
  getMarketNews: async () => {
    const cacheKey = `yahoo:news:market`;

    const cached = cacheService.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      console.log(`[YAHOO] Fetching general market news`);
      const mappedNews = await dedupedFetch(cacheKey, async () => {
        const searchResult: any = await searchBreaker.fire('market');
        const newsArr = (searchResult.news || []).map((item: any) => ({
          id: item.uuid,
          headline: item.title,
          summary: item.summary || item.title,
          source: item.publisher,
          datetime: item.providerPublishTime ? Math.floor(Date.parse(item.providerPublishTime) / 1000) : Math.floor(Date.now() / 1000),
          url: item.link
        }));
        cacheService.set(cacheKey, newsArr, CACHE_TTLS.NEWS);
        return newsArr;
      });
      return mappedNews;
    } catch (error: any) {
      console.error(`[YAHOO MARKET NEWS ERROR] Failed to fetch general market news`, error.message);
      return [];
    }
  },

  // Search Symbol autocomplete
  searchSymbol: async (query: string) => {
    try {
      console.log(`[YAHOO] Searching for query: ${query}`);
      const searchResult: any = await searchBreaker.fire(query);
      const mappedResult = {
        result: (searchResult.quotes || [])
          .filter((q: any) => q && q.symbol)
          .map((q: any) => ({
            symbol: q.symbol,
            description: q.longname || q.shortname || q.symbol,
            displaySymbol: q.symbol,
            type: q.quoteType || 'Stock',
            exchange: q.exchange || 'Dynamic'
          }))
      };
      return mappedResult;
    } catch (error: any) {
      console.error(`[YAHOO SEARCH ERROR] Failed search for query ${query}`, error.message);
      return { result: [] };
    }
  },

  // Candles (Chart data)
  getCandles: async (symbol: string, resolution: string, from: number, to: number) => {
    const rawSymbol = symbol.toUpperCase();
    let interval: any = '1d';
    if (resolution === '5') interval = '5m';
    else if (resolution === '15') interval = '15m';
    else if (resolution === 'W') interval = '1wk';
    else if (resolution === 'M') interval = '1mo';

    try {
      console.log(`[YAHOO] Fetching chart candles for ${rawSymbol} (Interval: ${interval})`);
      const chartResult: any = await chartBreaker.fire(rawSymbol, {
        period1: new Date(from * 1000),
        period2: new Date(to * 1000),
        interval
      });

      const quotes = chartResult.quotes || [];
      if (quotes.length === 0) {
        return { s: 'no_data' };
      }

      const t: number[] = [];
      const c: number[] = [];
      const o: number[] = [];
      const h: number[] = [];
      const l: number[] = [];
      const v: number[] = [];

      for (const q of quotes) {
        if (q.close === null || q.close === undefined) continue;
        const ts = Math.floor(new Date(q.date).getTime() / 1000);
        t.push(ts);
        c.push(q.close);
        o.push(q.open ?? q.close);
        h.push(q.high ?? q.close);
        l.push(q.low ?? q.close);
        v.push(q.volume ?? 0);
      }

      return {
        s: t.length > 0 ? 'ok' : 'no_data',
        t, c, o, h, l, v
      };
    } catch (error: any) {
      console.error(`[YAHOO CANDLES ERROR] Failed to fetch candles for ${rawSymbol}`, error.message);
      return { s: 'no_data' };
    }
  },

  // Shareholding data (major holders, institutional ownership, mutual fund ownership)
  getShareholding: async (symbol: string) => {
    const rawSymbol = symbol.toUpperCase();
    const cacheKey = `yahoo:shareholding:${rawSymbol}`;

    // Try in-memory cache first
    const cached = cacheService.get<any>(cacheKey);
    if (cached) {
      cacheService.logHit('shareholding', rawSymbol, 'MEMCACHE_YAHOO_SHAREHOLDING');
      return cached;
    }

    // Try SQLite backup next (if within 24h)
    const backup = cacheService.getShareholdingBackup(rawSymbol);
    if (backup && (Date.now() - backup.updated_at < CACHE_TTLS.FUNDAMENTALS * 1000)) {
      console.log(`[YAHOO] Found fresh SQLite shareholding backup for: ${rawSymbol}`);
      cacheService.set(cacheKey, backup.data, CACHE_TTLS.FUNDAMENTALS);
      return backup.data;
    }

    console.log(`[YAHOO] Fetching shareholding quoteSummary for: ${rawSymbol}`);
    try {
      const payload = await dedupedFetch(cacheKey, async () => {
        const result: any = await quoteSummaryBreaker.fire(rawSymbol, {
          modules: ['majorHoldersBreakdown', 'institutionOwnership', 'fundOwnership']
        });

        if (!result) {
          throw new Error('No quoteSummary results found for shareholding');
        }

        const majorHolders = {
          insidersPercentHeld: result.majorHoldersBreakdown?.insidersPercentHeld ?? null,
          institutionsPercentHeld: result.majorHoldersBreakdown?.institutionsPercentHeld ?? null,
          institutionsFloatPercentHeld: result.majorHoldersBreakdown?.institutionsFloatPercentHeld ?? null,
          institutionsCount: result.majorHoldersBreakdown?.institutionsCount ?? null
        };

        const institutionalHolders = (result.institutionOwnership?.ownershipList || []).map((item: any) => ({
          organization: item.organization || '—',
          position: item.position || null,
          reportDate: item.reportDate || null,
          pctHeld: item.pctHeld || null,
          value: item.value || null
        }));

        const mutualFundHolders = (result.fundOwnership?.ownershipList || []).map((item: any) => ({
          organization: item.organization || '—',
          position: item.position || null,
          reportDate: item.reportDate || null,
          pctHeld: item.pctHeld || null,
          value: item.value || null
        }));

        const mappedPayload = {
          majorHolders,
          institutionalHolders,
          mutualFundHolders
        };

        // Set node-cache & save backend SQLite persistent backup
        cacheService.set(cacheKey, mappedPayload, CACHE_TTLS.FUNDAMENTALS);
        cacheService.saveShareholdingBackup(rawSymbol, mappedPayload);

        return mappedPayload;
      });

      return payload;
    } catch (error: any) {
      console.error(`[YAHOO ERROR] Failed to fetch shareholding for ${rawSymbol}`, error.message);
      
      // Fallback to SQLite check (even if expired)
      if (backup) {
        console.log(`[YAHOO FALLBACK] Returned SQLite shareholding data backup for ${rawSymbol}`);
        return backup.data;
      }
      throw error;
    }
  }
};
