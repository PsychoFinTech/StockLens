import { Router } from 'express';
import { yahooService } from '../services/yahoo.js';
import { fredService } from '../services/fred.js';
import { edgarService } from '../services/edgar.js';
import { fetchPeersForReport } from '../services/report/data/peerService.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import { cacheService, CACHE_TTLS } from '../services/cache.js';

// Damodaran Synthetic Credit Rating table for non-financials
function getSyntheticCreditRating(icr: number): { rating: string, spread: number } {
  if (icr > 8.5) return { rating: 'AAA', spread: 0.0069 };
  if (icr > 6.5) return { rating: 'AA', spread: 0.0085 };
  if (icr > 5.5) return { rating: 'A+', spread: 0.0107 };
  if (icr > 4.25) return { rating: 'A', spread: 0.0118 };
  if (icr > 3.0) return { rating: 'A-', spread: 0.0133 };
  if (icr > 2.5) return { rating: 'BBB', spread: 0.0171 };
  if (icr > 2.25) return { rating: 'BB+', spread: 0.0231 };
  if (icr > 2.0) return { rating: 'BB', spread: 0.0277 };
  if (icr > 1.75) return { rating: 'B+', spread: 0.0405 };
  if (icr > 1.5) return { rating: 'B', spread: 0.0486 };
  if (icr > 1.25) return { rating: 'B-', spread: 0.0594 };
  if (icr > 0.8) return { rating: 'CCC', spread: 0.0946 };
  if (icr > 0.65) return { rating: 'CC', spread: 0.1045 };
  if (icr > 0.2) return { rating: 'C', spread: 0.1434 };
  return { rating: 'D', spread: 0.1834 };
}

const router = Router();

router.get('/dcf/:symbol', apiLimiter, async (req, res, next) => {
  const symbol = req.params.symbol.toUpperCase();
  const cacheKey = `route:dcf:${symbol}`;

  try {
    // Check cache unless refresh is requested
    if (req.query.refresh !== 'true') {
      const cached = await cacheService.get<any>(cacheKey);
      if (cached) {
        return res.json(cached);
      }
    }

    // Dates for the last 5 years
    const now = new Date();
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

    const fiveYearsAgoStr = fiveYearsAgo.toISOString().split('T')[0];
    const nowStr = now.toISOString().split('T')[0];

    // Fetch data in parallel
    const [profile, quote, basicFinancials, timeSeries, timeSeriesQuarterly, growthEstimates, edgarData, peers] = await Promise.all([
      yahooService.getProfile(symbol).catch(() => null),
      yahooService.getQuote(symbol).catch(() => null),
      yahooService.getBasicFinancials(symbol).catch(() => null),
      yahooService.getFundamentalsTimeSeries(symbol, fiveYearsAgoStr, nowStr, 'annual').catch(() => []),
      yahooService.getFundamentalsTimeSeries(symbol, fiveYearsAgoStr, nowStr, 'quarterly').catch(() => []),
      yahooService.getGrowthEstimates(symbol).catch(() => ({ growthEstimate5yr: null })),
      edgarService.getFinancials(symbol).catch(() => null),
      fetchPeersForReport(symbol).catch(() => [])
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
        return { year, value, source: 'Yahoo Annual' };
      })
      .filter(item => item.value !== null);

    let ttmFCF = null;
    let ttmRevenue = null;
    const latestYear = historicalFCF.length > 0 ? historicalFCF[historicalFCF.length - 1].year : null;

    if (Array.isArray(timeSeriesQuarterly) && timeSeriesQuarterly.length > 0) {
      const sortedQNewestFirst = [...timeSeriesQuarterly].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const last4 = sortedQNewestFirst.slice(0, 4);
      if (last4.length === 4) {
        const revs = last4.map(q => getField(q, 'totalRevenue')).filter(v => v !== null);
        const fcfs = last4.map(q => getField(q, 'freeCashFlow')).filter(v => v !== null);

        if (revs.length === 4) ttmRevenue = revs.reduce((sum, val) => sum + val, 0);
        if (fcfs.length === 4) ttmFCF = fcfs.reduce((sum, val) => sum + val, 0);

        const ttmYear = latestYear ? latestYear + 1 : new Date().getFullYear();
        
        if (ttmFCF !== null) {
          historicalFCF.push({ year: ttmYear, value: ttmFCF, source: 'Yahoo Quarterly TTM' });
        }
        if (ttmRevenue !== null) {
          historicalRevenue.push({ year: ttmYear, value: ttmRevenue, source: 'Yahoo Quarterly TTM' });
        }
      }
    }

    let dataConfidence = 'low';
    const latestYahooFCF = historicalFCF.length > 0 ? historicalFCF[historicalFCF.length - 1].value : null;
    const latestYahooRev = historicalRevenue.length > 0 ? historicalRevenue[historicalRevenue.length - 1].value : null;

    if (!edgarData) {
      dataConfidence = 'low';
    } else {
      dataConfidence = 'medium';
      try {
        const secOpCFRow = edgarData.cashFlow.find(r => r.label === 'Cash generated by operating activities');
        const secCapExRow = edgarData.cashFlow.find(r => r.label === 'Payments for property, plant and equipment');
        const secRevRow = edgarData.incomeStatement.find(r => r.label === 'Net sales' || r.label === 'Revenue' || r.label === 'Total revenue');

        if (secOpCFRow && secCapExRow && secRevRow && latestYear) {
          const secOpCF = secOpCFRow.values[latestYear.toString()];
          const secCapEx = secCapExRow.values[latestYear.toString()];
          const secRev = secRevRow.values[latestYear.toString()];

          if (secOpCF !== null && secCapEx !== null && secRev !== null && latestYahooFCF !== null && latestYahooRev !== null) {
             const secFCF = secOpCF - Math.abs(secCapEx);
             
             // In edgarService, values are rounded to millions!
             const yahooFcfMils = latestYahooFCF / 1000000;
             const yahooRevMils = latestYahooRev / 1000000;

             const fcfDiff = Math.abs((secFCF - yahooFcfMils) / (yahooFcfMils || 1));
             const revDiff = Math.abs((secRev - yahooRevMils) / (yahooRevMils || 1));

             if (fcfDiff <= 0.05 && revDiff <= 0.05) {
               dataConfidence = 'high';
             }
          }
        }
      } catch (e) {
        // ignore
      }
    }

    let peerMedianPE = null;
    if (peers && peers.length > 0) {
      const validPEs = peers.map((p: any) => parseFloat(p.pe)).filter((val: number) => !isNaN(val));
      if (validPEs.length > 0) {
        validPEs.sort((a: number, b: number) => a - b);
        const mid = Math.floor(validPEs.length / 2);
        peerMedianPE = validPEs.length % 2 !== 0 ? validPEs[mid] : (validPEs[mid - 1] + validPEs[mid]) / 2;
      }
    }

    const provenance: Record<string, any> = {};

    // WACC Cost of Debt components fallback mapping
    let interestExpense = null;
    const latestInterestObj = sortedNewestFirst.find(s => getField(s, 'interestExpense') !== null || getField(s, 'interestExpenseNonOperating') !== null);
    if (latestInterestObj) {
      const rawInterest = getField(latestInterestObj, 'interestExpense') ?? getField(latestInterestObj, 'interestExpenseNonOperating');
      interestExpense = rawInterest !== null ? Math.abs(rawInterest) : null;
      provenance.interestExpense = { source: 'Yahoo Time Series', fallbackApplied: false, timestamp: latestInterestObj.date };
    }

    let taxRate = null;
    const latestTaxObj = sortedNewestFirst.find(s => getField(s, 'taxRateForCalcs') !== null);
    if (latestTaxObj) {
      taxRate = getField(latestTaxObj, 'taxRateForCalcs');
      provenance.taxRate = { source: 'Yahoo Time Series', fallbackApplied: false, timestamp: latestTaxObj.date };
    }

    // Leverage cash and debt from basic stats, fallback to latest balance sheet statement
    const debtObj = sortedNewestFirst.find(s => getField(s, 'totalDebt') !== null);
    let totalDebt = null;
    if (basicFinancials?.metric?.totalDebt !== undefined && basicFinancials?.metric?.totalDebt !== null) {
      totalDebt = Math.abs(basicFinancials.metric.totalDebt);
      provenance.totalDebt = { source: 'Yahoo Basic Financials', fallbackApplied: false, timestamp: new Date().toISOString() };
    } else if (debtObj && getField(debtObj, 'totalDebt') !== null) {
      totalDebt = Math.abs(getField(debtObj, 'totalDebt'));
      provenance.totalDebt = { source: 'Yahoo Time Series', fallbackApplied: true, timestamp: debtObj.date };
    }

    const cashObj1 = sortedNewestFirst.find(s => getField(s, 'cashCashEquivalentsAndShortTermInvestments') !== null);
    const cashObj2 = sortedNewestFirst.find(s => getField(s, 'cashAndCashEquivalents') !== null);
    let cashAndEquivalents = null;
    if (basicFinancials?.metric?.totalCash !== undefined && basicFinancials?.metric?.totalCash !== null) {
      cashAndEquivalents = basicFinancials.metric.totalCash;
      provenance.cashAndEquivalents = { source: 'Yahoo Basic Financials', fallbackApplied: false, timestamp: new Date().toISOString() };
    } else if (cashObj1 && getField(cashObj1, 'cashCashEquivalentsAndShortTermInvestments') !== null) {
      cashAndEquivalents = getField(cashObj1, 'cashCashEquivalentsAndShortTermInvestments');
      provenance.cashAndEquivalents = { source: 'Yahoo Time Series', fallbackApplied: true, timestamp: cashObj1.date };
    } else if (cashObj2 && getField(cashObj2, 'cashAndCashEquivalents') !== null) {
      cashAndEquivalents = getField(cashObj2, 'cashAndCashEquivalents');
      provenance.cashAndEquivalents = { source: 'Yahoo Time Series', fallbackApplied: true, timestamp: cashObj2.date };
    }

    const sharesObj = sortedNewestFirst.find(s => getField(s, 'ordinarySharesNumber') !== null);
    let sharesOutstanding = null;
    if (basicFinancials?.metric?.sharesOutstanding !== undefined && basicFinancials?.metric?.sharesOutstanding !== null) {
      sharesOutstanding = basicFinancials.metric.sharesOutstanding;
      provenance.sharesOutstanding = { source: 'Yahoo Basic Financials', fallbackApplied: false, timestamp: new Date().toISOString() };
    } else if (sharesObj && getField(sharesObj, 'ordinarySharesNumber') !== null) {
      sharesOutstanding = getField(sharesObj, 'ordinarySharesNumber');
      provenance.sharesOutstanding = { source: 'Yahoo Time Series', fallbackApplied: true, timestamp: sharesObj.date };
    }

    const beta = basicFinancials?.metric?.beta ?? null;
    if (beta !== null) {
      provenance.beta = { source: 'Yahoo Basic Financials', fallbackApplied: false, timestamp: new Date().toISOString() };
    }

    let marketCap = basicFinancials?.metric?.marketCapitalization;
    if (marketCap !== null && marketCap !== undefined) {
      marketCap = marketCap * 1000000;
      provenance.marketCap = { source: 'Yahoo Basic Financials', fallbackApplied: false, timestamp: new Date().toISOString() };
    } else if (sharesOutstanding && quote.price) {
      marketCap = sharesOutstanding * quote.price;
      provenance.marketCap = { source: 'Shares * Price (Fallback)', fallbackApplied: true, timestamp: new Date().toISOString() };
    }

    // Resolve Risk-Free Rate based on region (US vs India)
    const isIndian = symbol.endsWith('.NS') || symbol.endsWith('.BO') || profile?.country === 'IN' || profile?.country === 'India';
    let riskFreeRate = null;

    if (isIndian) {
      riskFreeRate = 0.071; // default fallback
      provenance.riskFreeRate = { source: 'RBI Hardcoded Fallback', fallbackApplied: true, timestamp: new Date().toISOString() };
      try {
        const fredData = await fredService.getSeries('INDIRLTLT01STM');
        const observations = fredData?.observations || [];
        if (observations.length > 0) {
          const lastValid = [...observations].reverse().find(obs => obs.value && obs.value !== '.');
          if (lastValid) {
            riskFreeRate = parseFloat(lastValid.value) / 100;
            provenance.riskFreeRate = { source: 'FRED INDIRLTLT01STM', fallbackApplied: false, timestamp: lastValid.date || new Date().toISOString() };
          }
        }
      } catch (err: any) {
        console.warn(`[DCF ROUTE] FRED INDIRLTLT01STM fetch failed for ${symbol}, using default India risk-free rate:`, err.message);
      }
    } else {
      try {
        const fredData = await fredService.getSeries('DGS10');
        const observations = fredData?.observations || [];
        if (observations.length > 0) {
          const lastValid = [...observations].reverse().find(obs => obs.value && obs.value !== '.');
          if (lastValid) {
            riskFreeRate = parseFloat(lastValid.value) / 100;
            provenance.riskFreeRate = { source: 'FRED DGS10', fallbackApplied: false, timestamp: lastValid.date || new Date().toISOString() };
          }
        }
      } catch (err: any) {
        console.warn(`[DCF ROUTE] FRED DGS10 fetch failed for ${symbol}, using default US risk-free rate:`, err.message);
        riskFreeRate = 0.0425; // Default 10y Treasury fallback
        provenance.riskFreeRate = { source: 'US 10y Treasury Hardcoded Fallback', fallbackApplied: true, timestamp: new Date().toISOString() };
      }
    }

    // Synthetic Credit Rating Logic
    let syntheticCostOfDebt = null;
    let syntheticRating = null;

    const latestEbitObj = sortedNewestFirst.find(s => getField(s, 'operatingIncome') !== null || getField(s, 'ebit') !== null || getField(s, 'pretaxIncome') !== null);
    let ebit = null;
    if (latestEbitObj) {
      ebit = getField(latestEbitObj, 'operatingIncome') ?? getField(latestEbitObj, 'ebit') ?? getField(latestEbitObj, 'pretaxIncome');
    }

    if (ebit !== null && riskFreeRate !== null) {
      // If we have EBIT but absolutely no interest expense, assume extremely high ICR (100) and AAA rating
      const icr = (!interestExpense || interestExpense === 0) ? 100 : ebit / interestExpense;
      const creditProfile = getSyntheticCreditRating(icr);
      syntheticRating = creditProfile.rating;
      syntheticCostOfDebt = riskFreeRate + creditProfile.spread;
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
      low_52w: quote.low_52w || null,
      dataConfidence,
      peerMedianPE,
      companyEPS: quote.epsTrailingTwelveMonths || quote.epsForward || null,
      syntheticRating,
      syntheticCostOfDebt,
      provenance
    };

    // Cache with standard fundamentals TTL (24h)
    await cacheService.set(cacheKey, payload, CACHE_TTLS.FUNDAMENTALS);

    res.json(payload);
  } catch (error) {
    next(error);
  }
});

export default router;
