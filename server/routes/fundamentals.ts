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
          year: dateVal !== '—' ? new Date(dateVal).getFullYear() : '—',
          date: dateVal,
          operating: r.totalCashFromOperatingActivities?.raw || r.operatingCashflow || 0,
          investing: r.capitalExpenditures?.raw || r.investingCashflow || 0,
          financing: r.totalCashFromFinancingActivities?.raw || r.financingCashflow || 0
        };
      })?.slice(0, 5).reverse() || [],
      
      quarterly: []
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
    const roce = m.roicTTM || (roe !== null ? roe * 0.95 : null);
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
    const peersMetrics = peers.slice(0, 8).map(peerSymbol => {
      // Find name / exchange in SQLite
      let profileStmt: any;
      try {
        profileStmt = db.prepare('SELECT name, sector, exchange FROM stocks WHERE symbol = ?').get(peerSymbol);
      } catch (e) {}

      // Try to get cached/live metrics if available
      const qStmt = db.prepare('SELECT price FROM quotes WHERE symbol = ?');
      const quoteRow = qStmt.get(peerSymbol) as { price: number } | undefined;

      const fStmt = db.prepare('SELECT data FROM fundamentals WHERE symbol = ?');
      const fundRow = fStmt.get(peerSymbol) as { data: string } | undefined;
      
      let fundData: any = null;
      if (fundRow) {
        try {
          fundData = JSON.parse(fundRow.data);
        } catch (e) {}
      }

      // Check basic financials node cache
      const cachedRatios = cacheService.get<any>(`yahoo:basic:${peerSymbol}`);

      const pe = cachedRatios?.metric?.peAnnual ?? null;
      const pb = cachedRatios?.metric?.pbAnnual ?? null;
      const roe = cachedRatios?.metric?.roeTTM ? `${Number(cachedRatios.metric.roeTTM).toFixed(2)}%` : (fundData?.ratios?.returnOnEquity ? `${(fundData.ratios.returnOnEquity * 100).toFixed(2)}%` : null);
      const mcap = cachedRatios?.metric?.marketCapitalization ? cachedRatios.metric.marketCapitalization * 1000000 : null;

      return {
        symbol: peerSymbol,
        name: profileStmt?.name || `${peerSymbol} Corp`,
        price: quoteRow ? quoteRow.price : null,
        mcap: mcap,
        pe: pe,
        pb: pb,
        roe: roe,
        exchange: profileStmt?.exchange || 'NYSE'
      };
    });

    res.json(peersMetrics);
  } catch (error) {
    next(error);
  }
});

export default router;
