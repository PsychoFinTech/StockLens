import { Router } from 'express';
import { yahooService } from '../services/yahoo.js';
import { runHedgeFundEngine, StockEvaluationData } from '../services/hedgeFundEngine.js';

const router = Router();

router.post('/run', async (req, res, next) => {
  if (!process.env.GEMINI_API_KEYS) {
    return res.status(503).json({ error: 'GEMINI_API_KEYS not configured', unavailable: true });
  }

  const { tickers, cash } = req.body;

  if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
    return res.status(400).json({ error: 'Missing or invalid tickers array' });
  }

  const initialCash = cash ? Number(cash) : 100000;
  const evaluationDataList: StockEvaluationData[] = [];

  try {
    await Promise.all(
      tickers.slice(0, 10).map(async (symbol) => {
        try {
          const profile = await yahooService.getProfile(symbol);
          const basic = await yahooService.getBasicFinancials(symbol);
          const m = basic?.metric || {};

          const to = Math.floor(Date.now() / 1000);
          const from = to - (375 * 24 * 3600); // 1 year history
          const candles = await yahooService.getCandles(symbol, 'D', from, to);

          let price = m.currentPrice || 0;
          let oneYearReturn = null;
          let sixMonthReturn = null;
          let threeMonthReturn = null;
          let volatility = null;

          if (candles.s === 'ok' && candles.c && candles.c.length > 0) {
            const prices = candles.c;
            const timestamps = candles.t;
            price = prices[prices.length - 1];

            const findClosestIndex = (targetTime: number) => {
              let closestIdx = 0;
              let minDiff = Infinity;
              for (let i = 0; i < timestamps.length; i++) {
                const diff = Math.abs(timestamps[i] - targetTime);
                if (diff < minDiff) {
                  minDiff = diff;
                  closestIdx = i;
                }
              }
              return closestIdx;
            };

            const oneYearIdx = findClosestIndex(to - 365 * 24 * 3600);
            const sixMonthIdx = findClosestIndex(to - 180 * 24 * 3600);
            const threeMonthIdx = findClosestIndex(to - 90 * 24 * 3600);

            const calcReturn = (pastPrice: number) => pastPrice ? ((price - pastPrice) / pastPrice) * 100 : null;

            oneYearReturn = calcReturn(prices[oneYearIdx]);
            sixMonthReturn = calcReturn(prices[sixMonthIdx]);
            threeMonthReturn = calcReturn(prices[threeMonthIdx]);
            
            // basic volatility (very simplified)
            volatility = m.beta || 1.0; 
          }

          const timeSeries = await yahooService.getFundamentalsTimeSeries(
            symbol,
            new Date(Date.now() - 4 * 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
            new Date().toISOString().split('T')[0]
          );

          const sortedStatements = (Array.isArray(timeSeries) ? timeSeries : []).sort((a: any, b: any) => {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          });

          const latest = sortedStatements[0] || {};
          const previous = sortedStatements[1] || {};

          const rev = latest.totalRevenue || latest.operatingRevenue || null;
          const prevRev = previous.totalRevenue || previous.operatingRevenue || null;
          let revenueGrowthYoY = null;
          if (rev && prevRev && prevRev !== 0) {
            revenueGrowthYoY = ((rev - prevRev) / prevRev) * 100;
          }

          const latestEPS = latest.basicEPS || latest.dilutedEPS || null;
          const prevEPS = previous.basicEPS || previous.dilutedEPS || null;
          let epsGrowthYoY = null;
          if (latestEPS !== null && prevEPS !== null && prevEPS !== 0) {
            epsGrowthYoY = ((latestEPS - prevEPS) / Math.abs(prevEPS)) * 100;
          }

          let grossMargin = m.grossMargins || null;
          if (grossMargin === null && rev && latest.grossProfit && rev !== 0) {
            grossMargin = (latest.grossProfit / rev) * 100;
          }

          let operatingMargin = m.operatingMargins || null;
          if (operatingMargin === null && rev && latest.operatingIncome && rev !== 0) {
            operatingMargin = (latest.operatingIncome / rev) * 100;
          }

          const fcf = m.freeCashflow || latest.freeCashFlow || null;
          const marketCap = m.marketCapitalization ? m.marketCapitalization * 1000000 : null;
          const fcfYield = (fcf && marketCap) ? (fcf / marketCap) * 100 : null;

          let calculatedRoic = null;
          const ebitVal = latest.EBIT || latest.operatingIncome || null;
          if (ebitVal !== null) {
            let cap = latest.investedCapital || null;
            if (cap === null) {
              const eq = latest.stockholdersEquity || latest.totalEquityGrossMinorityInterest || null;
              const debt = latest.totalDebt !== undefined ? latest.totalDebt : ((latest.longTermDebt || 0) + (latest.currentDebt || 0));
              const cashVal = latest.cashCashEquivalentsAndShortTermInvestments || latest.cashAndCashEquivalents || latest.cashFinancial || 0;
              if (eq !== null) {
                cap = eq + debt - cashVal;
              }
            }
            if (cap !== null && cap > 0) {
              const taxRate = latest.taxRateForCalcs !== undefined ? latest.taxRateForCalcs : 0.21;
              const nopat = ebitVal * (1 - taxRate);
              calculatedRoic = (nopat / cap) * 100;
            }
          }

          // Very simple fair value calculation (Graham style proxy)
          let intrinsicValue = null;
          if (latestEPS && latestEPS > 0) {
             const assumedGrowth = Math.min(Math.max(epsGrowthYoY || 5, 0), 20); // Cap growth between 0% and 20%
             intrinsicValue = latestEPS * (8.5 + 2 * assumedGrowth);
          }

          const debtToEquity = m.totalDebtToEquity !== undefined ? m.totalDebtToEquity / 100 : 
                               (latest.totalDebt && latest.stockholdersEquity ? latest.totalDebt / latest.stockholdersEquity : null);

          evaluationDataList.push({
            symbol: symbol.toUpperCase(),
            price,
            marketCap,
            peRatio: m.peTrailing || m.peAnnual || null,
            pbRatio: m.priceToBook || null,
            debtToEquity,
            currentRatio: m.currentRatio || null,
            roe: m.roeTTM || (latest.netIncome && latest.stockholdersEquity ? (latest.netIncome / latest.stockholdersEquity)*100 : null),
            roic: calculatedRoic,
            grossMargin,
            operatingMargin,
            netIncome: latest.netIncome || null,
            revenueGrowthYoY,
            epsGrowthYoY,
            fcfYield,
            oneYearReturn,
            sixMonthReturn,
            threeMonthReturn,
            volatility,
            sector: profile.finnhubIndustry || 'Unknown',
            intrinsicValue
          });

        } catch (e: any) {
          console.error(`Error evaluating ${symbol}:`, e.message);
        }
      })
    );

    const result = runHedgeFundEngine(evaluationDataList, initialCash);
    res.json(result);
  } catch (error: any) {
    console.error('[HedgeFund Error]', error);
    res.status(500).json({ error: 'Failed to run hedge fund engine', details: error.message, stack: error.stack });
  }
});

export default router;
