import { Router } from 'express';
import { yahooService } from '../services/yahoo.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import db from '../services/db.js';
import { prefetchEdgar } from '../services/edgar.js';
import { cacheService } from '../services/cache.js';

const router = Router();

function isUSSymbol(symbol: string): boolean {
  const upper = symbol.toUpperCase();
  if (!upper.includes('.')) {
    return true;
  }
  const parts = upper.split('.');
  const suffix = parts[parts.length - 1];
  if (suffix.length === 1) {
    return true;
  }
  return false;
}

// 1. GET /api/profile/:symbol -> Company name, logo, sector, industry, country, website, description
router.get('/profile/:symbol', apiLimiter, async (req, res, next) => {
  const symbol = req.params.symbol.toUpperCase();

  try {
    let profile: any = null;

    // --- LEVEL 1: YAHOO FINANCE ---
    try {
      profile = await yahooService.getProfile(symbol);
    } catch (err: any) {
      console.warn(`[PROFILE ROUTE] Yahoo failed for ${symbol}:`, err.message);
    }

    // --- LEVEL 2: FALLBACK TO SQLITE METADATA OR PLACEHOLDERS ---
    // Fetch local seeded stats if profile is empty or null
    let localMeta: any = null;
    try {
      const stmt = db.prepare('SELECT name, exchange, sector, industry, country FROM stocks WHERE symbol = ?');
      localMeta = stmt.get(symbol);
    } catch (dbErr) {
      console.error('[PROFILE SQLITE CHECK FAIL]', dbErr);
    }

    const isUS = isUSSymbol(symbol);
    const payload = {
      symbol,
      name: profile?.name || localMeta?.name || symbol,
      logo: profile?.logo || '',
      sector: profile?.finnhubIndustry || localMeta?.sector || 'Industrial Sector',
      industry: profile?.finnhubIndustry || localMeta?.industry || 'Miscellaneous Industries',
      exchange: profile?.exchange || localMeta?.exchange || (isUS ? 'OTC Market' : 'International Exchange'),
      country: profile?.country || localMeta?.country || (isUS ? 'US' : 'International'),
      weburl: profile?.weburl || '',
      ipo: profile?.ipo || '—',
      description: profile?.description || `${profile?.name || localMeta?.name || symbol} is a leading global enterprise registered in ${profile?.country || localMeta?.country || (isUS ? 'US markets' : 'international markets')}, specializing in ${profile?.finnhubIndustry || localMeta?.sector || 'specialized services'}.`
    };

    res.json(payload);

    // Fire-and-forget: start warming the EDGAR cache for this symbol in the background.
    // By the time the user navigates to the SEC tab (~10-30s), data will be pre-fetched.
    if (isUS) {
      setImmediate(() => prefetchEdgar(symbol));
    }
  } catch (error) {
    next(error);
  }
});

// 2. GET /api/financials/:symbol -> P&L, balance sheet, cash flow history (Last 5 years annual)
router.get('/financials/:symbol', apiLimiter, async (req, res, next) => {
  const symbol = req.params.symbol.toUpperCase();

  try {
    let financials: any = null;

    try {
      financials = await yahooService.getFinancials(symbol);
    } catch (yErr: any) {
      console.warn(`[FINANCIALS] Yahoo layer fail for ${symbol}:`, yErr.message);
    }

    // Standardize mapping format for charts
    const result = {
      symbol,
      incomeStatement: financials?.incomeStatement?.map((r: any) => {
        const dateVal = r.endDate || r.fiscalDateEnding || '—';
        return {
          ...r,
          year: dateVal !== '—' ? new Date(dateVal).getFullYear() : '—',
          date: dateVal,
          revenue: r.totalRevenue?.raw || r.totalRevenue || 0,
          grossProfit: r.grossProfit?.raw || r.grossProfit || 0,
          netIncome: r.netIncome?.raw || r.netIncome || 0
        };
      })?.slice(0, 5).reverse() || [],

      balanceSheet: financials?.balanceSheet?.map((r: any) => {
        const dateVal = r.endDate || r.fiscalDateEnding || '—';
        return {
          ...r,
          year: dateVal !== '—' ? new Date(dateVal).getFullYear() : '—',
          date: dateVal,
          assets: r.totalAssets?.raw || r.totalAssets || 0,
          liabilities: r.totalLiabilities?.raw || r.totalLiabilities || 0,
          equity: r.totalStockholderEquity?.raw || r.totalShareholderEquity || r.totalStockholderEquity || 0
        };
      })?.slice(0, 5).reverse() || [],

      cashFlow: financials?.cashFlow?.map((r: any) => {
        const dateVal = r.endDate || r.fiscalDateEnding || '—';
        return {
          ...r,
          year: dateVal !== '—' ? new Date(dateVal).getFullYear() : '—',
          date: dateVal,
          operating: r.totalCashFromOperatingActivities?.raw || r.operatingCashflow || 0,
          investing: r.capitalExpenditures?.raw || r.investingCashflow || 0,
          financing: r.totalCashFromFinancingActivities?.raw || r.financingCashflow || 0
        };
      })?.slice(0, 5).reverse() || [],
      
      quarterly: {
        incomeStatement: financials?.incomeStatementQuarterly || [],
        balanceSheet: financials?.balanceSheetQuarterly || [],
        cashFlow: financials?.cashFlowQuarterly || []
      }
    };

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// 3. GET /api/ratios/:symbol -> P/E, P/B, ROE, ROCE, Debt/Equity, EPS, Market Cap, Dividend Yield
router.get('/ratios/:symbol', apiLimiter, async (req, res, next) => {
  const symbol = req.params.symbol.toUpperCase();

  try {
    let metrics: any = null;

    try {
      metrics = await yahooService.getBasicFinancials(symbol);
    } catch (err: any) {
      console.warn(`[RATIOS ROUTE] Yahoo basic metrics failed for ${symbol}:`, err.message);
    }

    // Extract metrics parameters
    const m = metrics?.metric || {};
    
    const pe = m.peAnnual || null;
    const pb = m.pbAnnual || null;
    const roe = m.roeTTM || null;

    // Calculate real ROCE from fundamentals time series
    let roce: number | null = null;
    try {
      const timeSeries = await yahooService.getFundamentalsTimeSeries(
        symbol,
        new Date(Date.now() - 3 * 365 * 24 * 3600 * 1000).toISOString().split('T')[0], // last 3 years
        new Date().toISOString().split('T')[0]
      );
      
      const sortedStatements = (Array.isArray(timeSeries) ? timeSeries : []).sort((a: any, b: any) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      const latest = sortedStatements[0];
      if (latest) {
        const ebit = latest.EBIT || latest.operatingIncome || null;
        const totalAssets = latest.totalAssets || null;
        const currentLiabilities = latest.currentLiabilities || null;
        if (ebit !== null && totalAssets !== null && currentLiabilities !== null) {
          const capEmployed = totalAssets - currentLiabilities;
          if (capEmployed > 0) {
            roce = (ebit / capEmployed) * 100;
          }
        }
      }
    } catch (tsErr: any) {
      console.warn(`[RATIOS ROUTE] Failed to calculate ROCE from timeseries for ${symbol}:`, tsErr.message);
    }

    const de = m.debtEquityAnnual || null;
    const eps = m.epsBasicExclExtraItemsTTM || null;
    const mcap = m.marketCapitalization || null;
    const divYield = m.dividendYieldIndicated || null;
    const ev = m.enterpriseValue || null;
    const shares = m.sharesOutstanding || null;
    const bv = m.bookValue || null;
    const cash = m.totalCash || null;
    const debt = m.totalDebt || null;
    const salesGrowth = m.revenueGrowth || null;
    const profitGrowth = m.earningsGrowth || null;

    const payload = {
      symbol,
      pe: pe ? Number(pe).toFixed(2) : '—',
      pb: pb ? Number(pb).toFixed(2) : '—',
      roe: roe ? `${Number(roe).toFixed(2)}%` : '—',
      roce: roce ? `${Number(roce).toFixed(2)}%` : '—',
      debt_equity: de ? Number(de).toFixed(2) : '—',
      eps: eps ? Number(eps).toFixed(2) : '—',
      market_cap: mcap ? mcap * 1000000 : null,
      dividend_yield: divYield ? `${Number(divYield).toFixed(2)}%` : '—',
      enterprise_value: ev,
      shares_outstanding: shares,
      book_value: bv,
      total_cash: cash,
      total_debt: debt,
      sales_growth: salesGrowth ? `${Number(salesGrowth).toFixed(2)}%` : '—',
      profit_growth: profitGrowth ? `${Number(profitGrowth).toFixed(2)}%` : '—',
      updated_at: Date.now()
    };

    res.json(payload);
  } catch (error) {
    next(error);
  }
});

// Hardcoded curated direct-competitor maps for major tickers as tertiary fallback.
// These are carefully selected to only include companies that genuinely compete in the same market segment.
const KNOWN_COMPETITOR_MAP: Record<string, string[]> = {
  // Big Tech
  AAPL: ['MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA'],
  MSFT: ['AAPL', 'GOOGL', 'AMZN', 'ORCL', 'IBM'],
  GOOGL: ['META', 'MSFT', 'AMZN', 'SNAP', 'TTD'],
  GOOG: ['META', 'MSFT', 'AMZN', 'SNAP', 'TTD'],
  META: ['GOOGL', 'SNAP', 'PINS', 'TWTR', 'MTCH'],
  AMZN: ['MSFT', 'GOOGL', 'WMT', 'BABA', 'SHOP'],
  NVDA: ['AMD', 'INTC', 'QCOM', 'AVGO', 'MRVL'],
  AMD: ['NVDA', 'INTC', 'QCOM', 'AVGO', 'ARM'],
  INTC: ['AMD', 'NVDA', 'QCOM', 'TSM', 'AVGO'],
  // Semiconductors
  QCOM: ['INTC', 'AMD', 'AVGO', 'MRVL', 'SWKS'],
  AVGO: ['QCOM', 'MRVL', 'INTC', 'SWKS', 'QRVO'],
  TSM: ['INTC', 'SSNLF', 'GFS', 'UMC', 'AMAT'],
  AMAT: ['LRCX', 'KLAC', 'ASML', 'TOELY', 'ONTO'],
  // E-Commerce / Retail
  WMT: ['AMZN', 'TGT', 'COST', 'KR', 'DG'],
  TGT: ['WMT', 'AMZN', 'COST', 'DG', 'DLTR'],
  COST: ['WMT', 'TGT', 'BJ', 'AMZN', 'KR'],
  // Finance
  JPM: ['BAC', 'WFC', 'C', 'GS', 'MS'],
  BAC: ['JPM', 'WFC', 'C', 'USB', 'PNC'],
  GS: ['MS', 'JPM', 'C', 'BAC', 'UBS'],
  MS: ['GS', 'JPM', 'BAC', 'C', 'SCHW'],
  V: ['MA', 'AXP', 'PYPL', 'DFS', 'SQ'],
  MA: ['V', 'AXP', 'PYPL', 'DFS', 'SQ'],
  PYPL: ['SQ', 'V', 'MA', 'AAPL', 'ADYEN'],
  // Streaming / Entertainment
  NFLX: ['DIS', 'PARA', 'WBD', 'AMZN', 'AAPL'],
  DIS: ['NFLX', 'PARA', 'WBD', 'CMCSA', 'SONY'],
  // Electric Vehicles
  TSLA: ['GM', 'F', 'RIVN', 'LCID', 'NIO'],
  RIVN: ['TSLA', 'LCID', 'GM', 'F', 'FSR'],
  // Energy
  XOM: ['CVX', 'COP', 'SLB', 'EOG', 'PXD'],
  CVX: ['XOM', 'COP', 'SLB', 'BP', 'SHEL'],
  // Healthcare / Pharma
  JNJ: ['PFE', 'ABBV', 'MRK', 'BMY', 'LLY'],
  PFE: ['JNJ', 'ABBV', 'MRK', 'BMY', 'AZN'],
  LLY: ['PFE', 'JNJ', 'ABBV', 'MRK', 'NVO'],
  // India
  RELIANCE: ['TCS', 'ONGC', 'HDFCBANK', 'INFY', 'ITC'],
  TCS: ['INFY', 'WIPRO', 'HCL', 'TECHM', 'LTI'],
  INFY: ['TCS', 'WIPRO', 'HCL', 'TECHM', 'LTI'],
  HDFCBANK: ['ICICIBANK', 'SBIN', 'AXISBANK', 'KOTAKBANK', 'INDUSIND'],
  ICICIBANK: ['HDFCBANK', 'SBIN', 'AXISBANK', 'KOTAKBANK', 'INDUSIND'],
};

// 4. GET /api/peers/:symbol -> list of direct competitors only
router.get('/peers/:symbol', apiLimiter, async (req, res, next) => {
  const symbol = req.params.symbol.toUpperCase();

  try {
    let peers: string[] = [];

    // --- LEVEL 1: YAHOO FINANCE PEERS ---
    try {
      const yahooPeers = await yahooService.getPeers(symbol);
      if (yahooPeers && yahooPeers.length > 0) {
        peers = yahooPeers.filter((p: string) => p !== symbol).slice(0, 7);
      }
    } catch (err: any) {
      console.warn(`[PEERS ROUTE] Yahoo peers query fail for ${symbol}:`, err.message);
    }

    // --- LEVEL 2: KNOWN COMPETITOR MAP (curated hardcoded direct competitors) ---
    if (peers.length === 0 && KNOWN_COMPETITOR_MAP[symbol]) {
      peers = KNOWN_COMPETITOR_MAP[symbol].slice(0, 7);
    }

    // --- LEVEL 3: SQLITE PEERS FROM SAME INDUSTRY+SECTOR FALLBACK ---
    if (peers.length === 0) {
      try {
        const metaStmt = db.prepare('SELECT sector, industry FROM stocks WHERE symbol = ?');
        const stockMeta = metaStmt.get(symbol) as { sector: string; industry: string } | undefined;

        if (stockMeta?.industry) {
          // Try industry-level match first (tightest)
          const industryPeersStmt = db.prepare(
            'SELECT symbol FROM stocks WHERE industry = ? AND symbol != ? LIMIT 7'
          );
          const industryPeersList = industryPeersStmt.all(stockMeta.industry, symbol) as Array<{ symbol: string }>;
          peers = industryPeersList.map(p => p.symbol);
        }

        // If industry is too sparse, widen to sector but cap tightly
        if (peers.length < 3 && stockMeta?.sector) {
          const sectorPeersStmt = db.prepare(
            'SELECT symbol FROM stocks WHERE sector = ? AND symbol != ? LIMIT 7'
          );
          const sectorPeersList = sectorPeersStmt.all(stockMeta.sector, symbol) as Array<{ symbol: string }>;
          // Merge without duplicates
          const extra = sectorPeersList.map(p => p.symbol).filter(s => !peers.includes(s));
          peers = [...peers, ...extra].slice(0, 7);
        }
      } catch (dbErr) {
        console.error('[PEERS SQLITE FALLBACK ERROR]', dbErr);
      }
    }

    // Always ensure current company is included first in the list
    if (!peers.includes(symbol)) {
      peers.unshift(symbol);
    }

    // Construct pricing grid elements for Peers Comparison table in UI
    const peersMetrics = await Promise.all(
      peers.slice(0, 8).map(async (peerSymbol) => {
        // Find name / exchange in SQLite
        let profileStmt: any;
        try {
          profileStmt = db.prepare('SELECT name, sector, exchange FROM stocks WHERE symbol = ?').get(peerSymbol);
        } catch (e: any) {
          console.debug(`[PEERS] Failed to fetch SQLite profile for ${peerSymbol}:`, e.message);
        }

        let price: number | null = null;
        try {
          const q = await yahooService.getQuote(peerSymbol);
          price = q?.price ?? null;
        } catch (e: any) {
          console.debug(`[PEERS] Failed to fetch live quote for ${peerSymbol}:`, e.message);
        }

        let cachedRatios: any = null;
        try {
          cachedRatios = await yahooService.getBasicFinancials(peerSymbol);
        } catch (e: any) {
          console.debug(`[PEERS] Failed to fetch basic financials for ${peerSymbol}:`, e.message);
        }

        const pe = cachedRatios?.metric?.peAnnual ?? null;
        const pb = cachedRatios?.metric?.pbAnnual ?? null;
        const roe = cachedRatios?.metric?.roeTTM ? `${Number(cachedRatios.metric.roeTTM).toFixed(2)}%` : null;
        const mcap = cachedRatios?.metric?.marketCapitalization ? cachedRatios.metric.marketCapitalization * 1000000 : null;

        return {
          symbol: peerSymbol,
          name: profileStmt?.name || `${peerSymbol} Corp`,
          price: price,
          mcap: mcap,
          pe: pe ? Number(pe).toFixed(2) : '—',
          pb: pb ? Number(pb).toFixed(2) : '—',
          roe: roe || '—',
          exchange: profileStmt?.exchange || 'NYSE'
        };
      })
    );

    res.json(peersMetrics);
  } catch (error) {
    next(error);
  }
});

// 5. GET /api/shareholding/:symbol -> major holders, institutional ownership, mutual fund ownership
router.get('/shareholding/:symbol', apiLimiter, async (req, res, next) => {
  const symbol = req.params.symbol.toUpperCase();

  try {
    const data = await yahooService.getShareholding(symbol);
    res.json(data);
  } catch (error: any) {
    console.warn(`[SHAREHOLDING ROUTE] Failed for ${symbol}:`, error.message);
    res.json({
      majorHolders: {
        insidersPercentHeld: null,
        institutionsPercentHeld: null,
        institutionsFloatPercentHeld: null,
        institutionsCount: null
      },
      institutionalHolders: [],
      mutualFundHolders: []
    });
  }
});

// 6. GET /api/compare -> Compare up to 4 stocks side-by-side
router.get('/compare', apiLimiter, async (req, res, next) => {
  const symbolsQuery = (req.query.symbols || '').toString().trim();
  if (!symbolsQuery) {
    return res.status(400).json({ error: 'Missing symbols query parameter' });
  }

  const symbols = symbolsQuery
    .split(',')
    .map(s => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 4);

  if (symbols.length === 0) {
    return res.status(400).json({ error: 'No valid symbols provided' });
  }

  try {
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          // 1. Fetch Profile
          const profile = await yahooService.getProfile(symbol);

          // 2. Fetch Basic Ratios
          const basic = await yahooService.getBasicFinancials(symbol);
          const m = basic?.metric || {};

          // 3. Fetch Candles to compute Price Performance
          const to = Math.floor(Date.now() / 1000);
          const from = to - (375 * 24 * 3600); // 375 days of history
          const candles = await yahooService.getCandles(symbol, 'D', from, to);

          let performance: {
            oneWeek: number | null;
            threeMonths: number | null;
            ytd: number | null;
            oneYear: number | null;
          } = {
            oneWeek: null,
            threeMonths: null,
            ytd: null,
            oneYear: null
          };

          if (candles.s === 'ok' && candles.c && candles.c.length > 0) {
            const prices = candles.c;
            const timestamps = candles.t;
            const count = prices.length;
            const currentPrice = prices[count - 1];

            const findClosestIndex = (targetTime: number) => {
              let closestIdx = -1;
              let minDiff = Infinity;
              for (let i = 0; i < timestamps.length; i++) {
                const diff = Math.abs(timestamps[i] - targetTime);
                if (diff < minDiff) {
                  minDiff = diff;
                  closestIdx = i;
                }
              }
              // If the closest data point is more than 10 days away, reject it
              if (minDiff > 10 * 24 * 3600) return -1;
              return closestIdx;
            };

            const oneWeekAgoTarget = to - (7 * 24 * 3600);
            const threeMonthsAgoTarget = to - (90 * 24 * 3600);
            const oneYearAgoTarget = to - (365 * 24 * 3600);

            const oneWeekIdx = findClosestIndex(oneWeekAgoTarget);
            const threeMonthsIdx = findClosestIndex(threeMonthsAgoTarget);
            const oneYearIdx = findClosestIndex(oneYearAgoTarget);

            // YTD calculation
            const currentYear = new Date().getFullYear();
            let ytdIdx = -1;
            for (let i = 0; i < timestamps.length; i++) {
              const date = new Date(timestamps[i] * 1000);
              if (date.getFullYear() === currentYear) {
                ytdIdx = i;
                break;
              }
            }

            const calcReturn = (pastPrice: number | undefined) => {
              if (pastPrice === undefined || pastPrice === null || pastPrice === 0) return null;
              return ((currentPrice - pastPrice) / pastPrice) * 100;
            };

            performance = {
              oneWeek: oneWeekIdx !== -1 ? calcReturn(prices[oneWeekIdx]) : null,
              threeMonths: threeMonthsIdx !== -1 ? calcReturn(prices[threeMonthsIdx]) : null,
              ytd: ytdIdx !== -1 ? calcReturn(prices[ytdIdx]) : null,
              oneYear: oneYearIdx !== -1 ? calcReturn(prices[oneYearIdx]) : null
            };
          }

          // 4. Fetch Multi-Year (fundamentalsTimeSeries) for Income Statement, Balance Sheet, Cash Flow
          const timeSeries = await yahooService.getFundamentalsTimeSeries(
            symbol,
            new Date(Date.now() - 4 * 365 * 24 * 3600 * 1000).toISOString().split('T')[0], // last 4 years
            new Date().toISOString().split('T')[0]
          );

          // Get latest and previous annual statement for growth calculations
          const sortedStatements = (Array.isArray(timeSeries) ? timeSeries : []).sort((a: any, b: any) => {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          });

          const latest = sortedStatements[0] || {};
          const previous = sortedStatements[1] || {};

          const latestDate = latest.date ? new Date(latest.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

          // Accounts Receivable Turnover = Revenue / Accounts Receivable
          let receivablesTurnover = null;
          const rev = latest.totalRevenue || latest.operatingRevenue || null;
          const ar = latest.accountsReceivable || null;
          if (rev && ar && ar !== 0) {
            receivablesTurnover = rev / ar;
          }

          // Revenue Growth YoY
          let revenueGrowthYoY = null;
          const prevRev = previous.totalRevenue || previous.operatingRevenue || null;
          if (rev && prevRev && prevRev !== 0) {
            revenueGrowthYoY = ((rev - prevRev) / prevRev) * 100;
          }

          // EPS Growth YoY
          let epsGrowthYoY = null;
          const latestEPS = latest.basicEPS || latest.dilutedEPS || null;
          const prevEPS = previous.basicEPS || previous.dilutedEPS || null;
          if (latestEPS && prevEPS && prevEPS !== 0) {
            epsGrowthYoY = ((latestEPS - prevEPS) / prevEPS) * 100;
          }

          // Smart margin calculations & fallbacks (using annual statements if TTM modules are empty)
          let grossMargin = m.grossMargins || null;
          if (grossMargin === null && rev && latest.grossProfit && rev !== 0) {
            grossMargin = (latest.grossProfit / rev) * 100;
          }

          let operatingMargin = m.operatingMargins || null;
          if (operatingMargin === null && rev && latest.operatingIncome && rev !== 0) {
            operatingMargin = (latest.operatingIncome / rev) * 100;
          }

          let profitMargin = m.profitMargins || null;
          if (profitMargin === null && rev && latest.netIncome && rev !== 0) {
            profitMargin = (latest.netIncome / rev) * 100;
          }

          // Smart fallback for Free Cash Flow & P/FCF calculation
          const fcf = m.freeCashflow || latest.freeCashFlow || null;
          const pFreeCashFlow = fcf && m.marketCapitalization ? (m.marketCapitalization * 1000000) / fcf : null;

          // Calculate real ROIC
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

          const payload = {
            symbol,
            profile: {
              name: profile.name,
              sector: profile.finnhubIndustry,
              industry: profile.finnhubIndustry,
              ceo: profile.ceo || '—',
              exchange: profile.exchange,
              country: profile.country,
              logo: profile.logo
            },
            keyStats: {
              asOf: latestDate,
              marketCap: m.marketCapitalization ? m.marketCapitalization * 1000000 : null,
              enterpriseValue: m.enterpriseValue || null,
              peRatio: m.peTrailing || m.peAnnual || null,
              eps: m.epsBasicExclExtraItemsTTM || latest.basicEPS || latest.dilutedEPS || null,
              dividendRate: m.dividendRate || null,
              dividendYield: m.dividendYield || null
            },
            pricePerformance: {
              asOf: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              oneWeek: performance.oneWeek,
              threeMonths: performance.threeMonths,
              ytd: performance.ytd,
              oneYear: performance.oneYear
            },
            incomeStatement: {
              asOf: latestDate,
              revenue: rev,
              operatingExpenses: latest.operatingExpense || null,
              operatingIncome: latest.operatingIncome || null,
              revenueGrowthYoY,
              grossProfit: latest.grossProfit || null
            },
            balanceSheet: {
              asOf: latestDate,
              inventory: latest.inventory || null,
              receivablesTurnover
            },
            cashFlow: {
              asOf: latestDate,
              operatingCashFlow: latest.operatingCashFlow || null,
              capex: latest.capitalExpenditure ? Math.abs(latest.capitalExpenditure) : null,
              investingCashFlow: latest.investingCashFlow || latest.cashFlowFromContinuingInvestingActivities || null,
              freeCashFlow: fcf
            },
            priceRatios: {
              pe: m.peTrailing || m.peAnnual || null,
              forwardPe: m.peForward || null,
              pFreeCashFlow,
              pBook: m.priceToBook || null,
              pSales: m.priceToSales || null,
              evEbitda: m.enterpriseToEbitda || (m.enterpriseValue && latest.EBITDA ? m.enterpriseValue / latest.EBITDA : null)
            },
            margin: {
              operatingMargin,
              grossMargin,
              profitMargin
            },
            earnings: {
              eps: latest.basicEPS || latest.dilutedEPS || m.epsBasicExclExtraItemsTTM || null,
              epsGrowthYoY
            },
            equityReturn: {
              roe: m.roeTTM || null,
              roa: m.roaTTM || null,
              roic: calculatedRoic
            }
          };

          return payload;
        } catch (symError: any) {
          console.error(`[COMPARE SYMBOL ERROR] Failed for ${symbol}:`, symError.message);
          return {
            symbol,
            error: true,
            message: symError.message || 'Failed to fetch comparison data'
          };
        }
      })
    );

    res.json(results);
  } catch (error) {
    next(error);
  }
});

export default router;
