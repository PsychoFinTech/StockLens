import { Router } from 'express';
import { yahooService } from '../services/yahoo.js';
import { fredService } from '../services/fred.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import { cacheService, CACHE_TTLS } from '../services/cache.js';

const router = Router();

router.get('/dcf/:symbol', apiLimiter, async (req, res, next) => {
  const symbol = req.params.symbol.toUpperCase();
  const cacheKey = `route:dcf:${symbol}`;

  try {
    // Check cache
    const cached = await cacheService.get<any>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Dates for the last 5 years
    const now = new Date();
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

    const fiveYearsAgoStr = fiveYearsAgo.toISOString().split('T')[0];
    const nowStr = now.toISOString().split('T')[0];

    // Fetch data in parallel
    const [profile, quote, basicFinancials, timeSeries, growthEstimates] = await Promise.all([
      yahooService.getProfile(symbol).catch(() => null),
      yahooService.getQuote(symbol).catch(() => null),
      yahooService.getBasicFinancials(symbol).catch(() => null),
      yahooService.getFundamentalsTimeSeries(symbol, fiveYearsAgoStr, nowStr).catch(() => []),
      yahooService.getGrowthEstimates(symbol).catch(() => ({ growthEstimate5yr: null }))
    ]);

    if (!quote) {
      return res.status(404).json({ error: `Could not fetch real-time quote for symbol ${symbol}` });
    }

    const getField = (obj: any, name: string) => {
      if (!obj) return null;
      const key = Object.keys(obj).find(k => k.toLowerCase() === name.toLowerCase());
      return key !== undefined && obj[key] !== undefined ? obj[key] : null;
    };

    const sortedStatements = (Array.isArray(timeSeries) ? timeSeries : []).sort((a: any, b: any) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    const sortedNewestFirst = [...sortedStatements].reverse();

    // Map historical Free Cash Flow (oldest -> newest)
    const historicalFCF = sortedStatements
      .map((item: any) => {
        const year = new Date(item.date).getFullYear();
        const value = getField(item, 'freeCashFlow') ?? null;
        return { year, value };
      })
      .filter(item => item.value !== null);

    // Map historical Revenue (oldest -> newest)
    const historicalRevenue = sortedStatements
      .map((item: any) => {
        const year = new Date(item.date).getFullYear();
        const value = getField(item, 'totalRevenue') ?? null;
        return { year, value };
      })
      .filter(item => item.value !== null);

    // WACC Cost of Debt components fallback mapping
    let interestExpense = null;
    const latestInterestObj = sortedNewestFirst.find(s => getField(s, 'interestExpense') !== null);
    if (latestInterestObj) {
      const rawInterest = getField(latestInterestObj, 'interestExpense');
      interestExpense = rawInterest !== null ? Math.abs(rawInterest) : null;
    }

    let taxRate = null;
    const latestTaxObj = sortedNewestFirst.find(s => getField(s, 'taxRateForCalcs') !== null);
    if (latestTaxObj) {
      taxRate = getField(latestTaxObj, 'taxRateForCalcs');
    }

    // Leverage cash and debt from basic stats, fallback to latest balance sheet statement
    let totalDebt = basicFinancials?.metric?.totalDebt ?? 
                    sortedNewestFirst.find(s => getField(s, 'totalDebt') !== null)?.totalDebt ?? 
                    null;
    if (totalDebt !== null) {
      totalDebt = Math.abs(totalDebt); // Keep debt positive
    }

    let cashAndEquivalents = basicFinancials?.metric?.totalCash ?? 
                             sortedNewestFirst.find(s => getField(s, 'cashCashEquivalentsAndShortTermInvestments') !== null)?.cashCashEquivalentsAndShortTermInvestments ?? 
                             sortedNewestFirst.find(s => getField(s, 'cashAndCashEquivalents') !== null)?.cashAndCashEquivalents ?? 
                             null;

    let sharesOutstanding = basicFinancials?.metric?.sharesOutstanding ?? 
                              sortedNewestFirst.find(s => getField(s, 'ordinarySharesNumber') !== null)?.ordinarySharesNumber ?? 
                              null;

    const beta = basicFinancials?.metric?.beta ?? null;

    let marketCap = basicFinancials?.metric?.marketCapitalization;
    if (marketCap !== null && marketCap !== undefined) {
      marketCap = marketCap * 1000000;
      // Sanity check: if it is abnormally low (< $1M), the original number was likely already absolute, not in millions
      if (marketCap < 1000000 && basicFinancials.metric.marketCapitalization > 0) {
        marketCap = basicFinancials.metric.marketCapitalization;
      }
    } else if (sharesOutstanding && quote.price) {
      marketCap = sharesOutstanding * quote.price;
    }

    // Sanity check for shares outstanding unit mismatch
    if (sharesOutstanding && quote.price && marketCap) {
      const calculatedCap = sharesOutstanding * quote.price;
      const ratio = marketCap / calculatedCap;
      if (ratio >= 500000 && ratio <= 2000000) {
        sharesOutstanding = sharesOutstanding * 1000000;
      } else if (ratio >= 500 && ratio <= 2000) {
        sharesOutstanding = sharesOutstanding * 1000;
      }
    }

    // Resolve Risk-Free Rate based on region (US vs India)
    const isIndian = symbol.endsWith('.NS') || symbol.endsWith('.BO') || profile?.country === 'IN' || profile?.country === 'India';
    let riskFreeRate = null;

    if (isIndian) {
      riskFreeRate = 0.071; // India 10-Year Government Bond Yield (Approx. 7.10%)
    } else {
      try {
        const fredData = await fredService.getSeries('DGS10');
        const observations = fredData?.observations || [];
        if (observations.length > 0) {
          const lastValid = [...observations].reverse().find(obs => obs.value && obs.value !== '.');
          if (lastValid) {
            riskFreeRate = parseFloat(lastValid.value) / 100;
          }
        }
      } catch (err: any) {
        console.warn(`[DCF ROUTE] FRED DGS10 fetch failed for ${symbol}, using default US risk-free rate:`, err.message);
        riskFreeRate = 0.0425; // Default 10y Treasury fallback
      }
    }

    const payload = {
      symbol,
      companyName: profile?.name || symbol,
      currentPrice: quote.price,
      sharesOutstanding,
      historicalFCF,
      historicalRevenue,
      totalDebt,
      cashAndEquivalents,
      beta,
      riskFreeRate,
      marketCap,
      interestExpense,
      taxRate,
      analystGrowthEstimate5yr: growthEstimates?.growthEstimate5yr || null,
      currency: isIndian ? 'INR' : 'USD',
      lastFiscalYear: sortedNewestFirst.length > 0 ? new Date(sortedNewestFirst[0].date).getFullYear() : new Date().getFullYear() - 1,
      dataFreshness: new Date().toISOString(),
      high_52w: quote.high_52w || null,
      low_52w: quote.low_52w || null
    };

    // Cache with standard fundamentals TTL (24h)
    await cacheService.set(cacheKey, payload, CACHE_TTLS.FUNDAMENTALS);

    res.json(payload);
  } catch (error) {
    next(error);
  }
});

export default router;
