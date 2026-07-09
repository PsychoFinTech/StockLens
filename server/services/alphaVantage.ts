import axios from 'axios';
import CircuitBreaker from 'opossum';
import pLimit from 'p-limit';
import { cacheService, CACHE_TTLS } from './cache.js';

/**
 * Alpha Vantage fallback data provider.
 *
 * This is the SECONDARY market-data source for StockLens. Yahoo Finance
 * (see ./yahoo.ts) remains the primary; every method here is only reached
 * from a Yahoo catch-block, and returns data mapped into the exact same
 * shape the Yahoo service produces so the two are drop-in interchangeable.
 *
 * Alpha Vantage's free tier is heavily rate limited (historically 5 req/min,
 * 25 req/day), so this module is deliberately conservative:
 *   - every response is cached (shared with the Yahoo cache keys where the
 *     shape matches, plus its own av: namespace)
 *   - concurrency is capped at 1 with a minimum spacing between calls
 *   - a circuit breaker trips fast when the upstream is unhealthy
 *   - rate-limit / info envelopes ("Note", "Information") are treated as errors
 */

const BASE_URL = 'https://www.alphavantage.co/query';

function getApiKey(): string | null {
  const key = process.env.ALPHAVANTAGE_API_KEY || process.env.ALPHA_VANTAGE_API_KEY;
  return key && key.trim() && key !== 'YOUR_ALPHAVANTAGE_API_KEY_HERE' ? key.trim() : null;
}

export function isAlphaVantageConfigured(): boolean {
  return getApiKey() !== null;
}

// Serialize outbound calls and space them out to respect the free-tier budget.
const limit = pLimit(1);
let lastCallAt = 0;
const MIN_SPACING_MS = 1500;

async function rawRequest(params: Record<string, string>): Promise<any> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Alpha Vantage API key not configured');
  }

  return limit(async () => {
    const wait = MIN_SPACING_MS - (Date.now() - lastCallAt);
    if (wait > 0) {
      await new Promise((r) => setTimeout(r, wait));
    }
    lastCallAt = Date.now();

    const { data } = await axios.get(BASE_URL, {
      params: { ...params, apikey: apiKey },
      timeout: 12000,
      headers: { 'User-Agent': 'StockLens/1.0' }
    });

    if (!data || typeof data !== 'object') {
      throw new Error('Empty Alpha Vantage response');
    }
    // Rate-limit / advisory envelopes come back with HTTP 200 but no data.
    if (data['Note'] || data['Information']) {
      throw new Error(`Alpha Vantage throttled: ${data['Note'] || data['Information']}`);
    }
    if (data['Error Message']) {
      throw new Error(`Alpha Vantage error: ${data['Error Message']}`);
    }
    return data;
  });
}

const breakerOptions = {
  timeout: 14000,
  errorThresholdPercentage: 50,
  resetTimeout: 60000,
  volumeThreshold: 3
};
const avBreaker = new CircuitBreaker(rawRequest, breakerOptions);

function toNum(v: any): number | null {
  if (v === undefined || v === null || v === '' || v === 'None' || v === '-') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export const alphaVantageService = {
  isConfigured: isAlphaVantageConfigured,

  // GLOBAL_QUOTE -> matches yahooService.getQuote() output shape
  getQuote: async (symbol: string) => {
    const rawSymbol = symbol.toUpperCase();
    const cacheKey = `av:quote:${rawSymbol}`;
    const cached = await cacheService.get<any>(cacheKey);
    if (cached) return cached;

    console.log(`[ALPHAVANTAGE] Fetching GLOBAL_QUOTE for: ${rawSymbol}`);
    const data = await avBreaker.fire({ function: 'GLOBAL_QUOTE', symbol: rawSymbol });
    const q = data['Global Quote'] || {};
    const price = toNum(q['05. price']);
    if (price === null) {
      throw new Error('Alpha Vantage returned no price');
    }

    const quoteObj = {
      price,
      change: toNum(q['09. change']) ?? 0,
      change_pct: toNum((q['10. change percent'] || '').replace('%', '')) ?? 0,
      high: toNum(q['03. high']) ?? price,
      low: toNum(q['04. low']) ?? price,
      open: toNum(q['02. open']) ?? price,
      prev_close: toNum(q['08. previous close']) ?? price,
      high_52w: null,
      low_52w: null,
      volume: toNum(q['06. volume']),
      avg_volume: null,
      source: 'ALPHAVANTAGE'
    };

    await cacheService.set(cacheKey, quoteObj, CACHE_TTLS.QUOTE);
    return quoteObj;
  },

  // TIME_SERIES_* -> matches yahooService.getCandles() output shape
  getCandles: async (symbol: string, resolution: string) => {
    const rawSymbol = symbol.toUpperCase();

    let fn = 'TIME_SERIES_DAILY';
    let seriesKey = 'Time Series (Daily)';
    const params: Record<string, string> = { symbol: rawSymbol, outputsize: 'full' };

    if (resolution === '5' || resolution === '15') {
      fn = 'TIME_SERIES_INTRADAY';
      seriesKey = `Time Series (${resolution}min)`;
      params.interval = `${resolution}min`;
    } else if (resolution === 'W') {
      fn = 'TIME_SERIES_WEEKLY';
      seriesKey = 'Weekly Time Series';
      delete params.outputsize;
    } else if (resolution === 'M') {
      fn = 'TIME_SERIES_MONTHLY';
      seriesKey = 'Monthly Time Series';
      delete params.outputsize;
    }
    params.function = fn;

    const cacheKey = `av:candles:${rawSymbol}:${resolution}`;
    const cached = await cacheService.get<any>(cacheKey);
    if (cached) return cached;

    console.log(`[ALPHAVANTAGE] Fetching ${fn} for: ${rawSymbol}`);
    const data = await avBreaker.fire(params);
    const series = data[seriesKey];
    if (!series || typeof series !== 'object') {
      return { s: 'no_data' };
    }

    const t: number[] = [];
    const c: number[] = [];
    const o: number[] = [];
    const h: number[] = [];
    const l: number[] = [];
    const v: number[] = [];

    // Alpha Vantage returns most-recent-first; sort ascending by date.
    const dates = Object.keys(series).sort();
    for (const date of dates) {
      const bar = series[date];
      const close = toNum(bar['4. close']);
      if (close === null) continue;
      t.push(Math.floor(new Date(date).getTime() / 1000));
      c.push(close);
      o.push(toNum(bar['1. open']) ?? close);
      h.push(toNum(bar['2. high']) ?? close);
      l.push(toNum(bar['3. low']) ?? close);
      v.push(toNum(bar['5. volume']) ?? 0);
    }

    const result = { s: t.length > 0 ? 'ok' : 'no_data', t, c, o, h, l, v, source: 'ALPHAVANTAGE' };
    if (t.length > 0) {
      await cacheService.set(cacheKey, result, CACHE_TTLS.QUOTE);
    }
    return result;
  },

  // OVERVIEW -> matches yahooService.getBasicFinancials() output shape
  getBasicFinancials: async (symbol: string) => {
    const overview = await alphaVantageService._getOverview(symbol);
    const marketCap = toNum(overview.MarketCapitalization);

    const mapped = {
      metric: {
        peTrailing: toNum(overview.TrailingPE) ?? toNum(overview.PERatio),
        peForward: toNum(overview.ForwardPE),
        pegRatio: toNum(overview.PEGRatio),
        priceToBook: toNum(overview.PriceToBookRatio),
        priceToSales: toNum(overview.PriceToSalesRatioTTM),
        dividendYield: overview.DividendYield ? (toNum(overview.DividendYield) ?? 0) * 100 : null,

        roeTTM: overview.ReturnOnEquityTTM ? (toNum(overview.ReturnOnEquityTTM) ?? 0) * 100 : null,
        roaTTM: overview.ReturnOnAssetsTTM ? (toNum(overview.ReturnOnAssetsTTM) ?? 0) * 100 : null,
        debtEquityAnnual: null,
        currentRatio: null,

        revenueGrowth: overview.QuarterlyRevenueGrowthYOY ? (toNum(overview.QuarterlyRevenueGrowthYOY) ?? 0) * 100 : null,
        earningsGrowth: overview.QuarterlyEarningsGrowthYOY ? (toNum(overview.QuarterlyEarningsGrowthYOY) ?? 0) * 100 : null,
        grossMargins: overview.GrossProfitTTM && overview.RevenueTTM
          ? ((toNum(overview.GrossProfitTTM) ?? 0) / (toNum(overview.RevenueTTM) || 1)) * 100
          : null,
        operatingMargins: overview.OperatingMarginTTM ? (toNum(overview.OperatingMarginTTM) ?? 0) * 100 : null,
        profitMargins: overview.ProfitMargin ? (toNum(overview.ProfitMargin) ?? 0) * 100 : null,

        freeCashflow: null,
        totalDebt: null,
        marketCapitalization: marketCap ? marketCap / 1000000 : null,

        // Backwards-compatible fields consumed by the ratios/peers routes
        peAnnual: toNum(overview.PERatio) ?? toNum(overview.TrailingPE),
        pbAnnual: toNum(overview.PriceToBookRatio),
        roicTTM: null,
        epsBasicExclExtraItemsTTM: toNum(overview.EPS) ?? toNum(overview.DilutedEPSTTM),
        dividendYieldIndicated: overview.DividendYield ? (toNum(overview.DividendYield) ?? 0) * 100 : null,
        enterpriseValue: null,
        evEbitda: toNum(overview.EVToEBITDA),
        sharesOutstanding: toNum(overview.SharesOutstanding),
        bookValue: toNum(overview.BookValue),
        totalCash: null,
        beta: toNum(overview.Beta)
      },
      source: 'ALPHAVANTAGE'
    };

    return mapped;
  },

  // OVERVIEW -> matches yahooService.getProfile() output shape
  getProfile: async (symbol: string) => {
    const overview = await alphaVantageService._getOverview(symbol);
    if (!overview.Name && !overview.Symbol) {
      throw new Error('Alpha Vantage returned no profile data');
    }

    let logoUrl = '';
    if (overview.OfficialSite) {
      try {
        logoUrl = `https://logo.clearbit.com/${new URL(overview.OfficialSite).hostname}`;
      } catch (_) { /* ignore malformed site */ }
    }

    return {
      name: overview.Name || symbol.toUpperCase(),
      logo: logoUrl,
      finnhubIndustry: overview.Industry || overview.Sector || 'Miscellaneous Industries',
      exchange: overview.Exchange || 'OTC Market',
      country: overview.Country || 'US',
      weburl: overview.OfficialSite || '',
      ipo: '—',
      ceo: '—',
      description: overview.Description || `${overview.Name || symbol.toUpperCase()} is a leading global enterprise.`,
      source: 'ALPHAVANTAGE'
    };
  },

  // INCOME_STATEMENT + BALANCE_SHEET + CASH_FLOW -> yahooService.getFinancials() shape
  getFinancials: async (symbol: string) => {
    const rawSymbol = symbol.toUpperCase();
    const cacheKey = `av:financials:${rawSymbol}`;
    const cached = await cacheService.get<any>(cacheKey);
    if (cached) return cached;

    console.log(`[ALPHAVANTAGE] Fetching financial statements for: ${rawSymbol}`);
    const [income, balance, cash] = await Promise.all([
      avBreaker.fire({ function: 'INCOME_STATEMENT', symbol: rawSymbol }),
      avBreaker.fire({ function: 'BALANCE_SHEET', symbol: rawSymbol }),
      avBreaker.fire({ function: 'CASH_FLOW', symbol: rawSymbol })
    ]);

    // Map AV report rows into the ...History[] shape the fundamentals route expects.
    const mapIncome = (r: any) => ({
      endDate: r.fiscalDateEnding,
      totalRevenue: toNum(r.totalRevenue),
      grossProfit: toNum(r.grossProfit),
      netIncome: toNum(r.netIncome),
      operatingIncome: toNum(r.operatingIncome),
      ebit: toNum(r.ebit)
    });
    const mapBalance = (r: any) => ({
      endDate: r.fiscalDateEnding,
      totalAssets: toNum(r.totalAssets),
      totalLiabilities: toNum(r.totalLiabilities),
      totalStockholderEquity: toNum(r.totalShareholderEquity)
    });
    const mapCash = (r: any) => ({
      endDate: r.fiscalDateEnding,
      totalCashFromOperatingActivities: toNum(r.operatingCashflow),
      capitalExpenditures: toNum(r.capitalExpenditures),
      totalCashFromFinancingActivities: toNum(r.cashflowFromFinancing)
    });

    const mapped = {
      incomeStatement: (income.annualReports || []).map(mapIncome),
      incomeStatementQuarterly: (income.quarterlyReports || []).map(mapIncome),
      balanceSheet: (balance.annualReports || []).map(mapBalance),
      balanceSheetQuarterly: (balance.quarterlyReports || []).map(mapBalance),
      cashFlow: (cash.annualReports || []).map(mapCash),
      cashFlowQuarterly: (cash.quarterlyReports || []).map(mapCash),
      ratios: {
        recommendationKey: '—',
        targetMeanPrice: null,
        profitMargins: null,
        operatingMargins: null,
        returnOnAssets: null,
        returnOnEquity: null,
        debtToEquity: null,
        currentRatio: null,
        dividendYield: null,
        pegRatio: null,
        priceToBook: null,
        enterpriseToEquity: null
      },
      source: 'ALPHAVANTAGE'
    };

    await cacheService.set(cacheKey, mapped, CACHE_TTLS.FUNDAMENTALS);
    return mapped;
  },

  // SYMBOL_SEARCH -> matches yahooService.searchSymbol() output shape
  searchSymbol: async (query: string) => {
    console.log(`[ALPHAVANTAGE] SYMBOL_SEARCH for query: ${query}`);
    const data = await avBreaker.fire({ function: 'SYMBOL_SEARCH', keywords: query });
    const matches = data['bestMatches'] || [];
    return {
      result: matches
        .filter((m: any) => m && m['1. symbol'])
        .map((m: any) => ({
          symbol: m['1. symbol'],
          description: m['2. name'] || m['1. symbol'],
          displaySymbol: m['1. symbol'],
          type: m['3. type'] || 'Stock',
          exchange: m['4. region'] || 'Global'
        }))
    };
  },

  // Shared OVERVIEW fetch — profile and ratios both derive from it, so cache once.
  _getOverview: async (symbol: string): Promise<any> => {
    const rawSymbol = symbol.toUpperCase();
    const cacheKey = `av:overview:${rawSymbol}`;
    const cached = await cacheService.get<any>(cacheKey);
    if (cached) return cached;

    console.log(`[ALPHAVANTAGE] Fetching OVERVIEW for: ${rawSymbol}`);
    const data = await avBreaker.fire({ function: 'OVERVIEW', symbol: rawSymbol });
    if (!data || Object.keys(data).length === 0 || (!data.Symbol && !data.Name)) {
      throw new Error('Alpha Vantage returned empty overview');
    }
    await cacheService.set(cacheKey, data, CACHE_TTLS.FUNDAMENTALS);
    return data;
  }
};
