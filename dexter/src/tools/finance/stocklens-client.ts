const STOCKLENS_BASE_URL = process.env.STOCKLENS_API_URL || 'http://localhost:3000/api';

async function slFetch(path: string): Promise<Record<string, unknown> | any> {
  const res = await fetch(`${STOCKLENS_BASE_URL}${path}`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`[StockLens API] ${path} failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export const stocklens = {
  async getQuoteSnapshot(ticker: string) {
    const data = await slFetch(`/quote/${ticker}`);
    if (!data) return { snapshot: {}, url: `${STOCKLENS_BASE_URL}/quote/${ticker}` };
    
    // Reshape to the FD snapshot contract get_stock_price already expects
    return {
      snapshot: {
        ticker,
        price: data.price,
        day_high: data.high,
        day_low: data.low,
        open_price: data.open,
        previous_close: data.prev_close,
        fifty_two_week_high: data.high_52w,
        fifty_two_week_low: data.low_52w,
        time: data.updated_at,
      },
      url: `${STOCKLENS_BASE_URL}/quote/${ticker}`,
    };
  },

  async getHistoricalPrices(ticker: string, period: string) {
    const data = await slFetch(`/chart/${ticker}?period=${period}`);
    if (!data || data.s === 'no_data') return { prices: [], url: '' };
    return {
      prices: (data as any[]).map((c: any) => ({
        time: c.date,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
      })),
      url: `${STOCKLENS_BASE_URL}/chart/${ticker}?period=${period}`,
    };
  },

  async getFinancialStatements(ticker: string) {
    const data = await slFetch(`/financials/${ticker}`);
    return { data, url: `${STOCKLENS_BASE_URL}/financials/${ticker}` };
  },

  async getKeyRatios(ticker: string) {
    const data = await slFetch(`/ratios/${ticker}`);
    return { snapshot: data, url: `${STOCKLENS_BASE_URL}/ratios/${ticker}` };
  },

  async getCompanyNews(ticker?: string, limit = 5) {
    const path = ticker ? `/news/${ticker}` : '/news/market';
    const data = await slFetch(path);
    return { news: ((data as any).news ?? data).slice(0, limit), url: `${STOCKLENS_BASE_URL}${path}` };
  },

  async getInsiderTrades(ticker: string, limit = 10) {
    const data = await slFetch(`/edgar/insiders/${ticker}`);
    return { insider_trades: ((data as any).trades ?? data).slice(0, limit), url: `${STOCKLENS_BASE_URL}/edgar/insiders/${ticker}` };
  },

  async getInstitutionalHoldings(cikOrTicker: string) {
    const data = await slFetch(`/edgar/holdings/${cikOrTicker}`);
    return { holdings: data, url: `${STOCKLENS_BASE_URL}/edgar/holdings/${cikOrTicker}` };
  },

  async screenStocks(params: Record<string, any>) {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) query.append(k, String(v));
    }
    const data = await slFetch(`/screener?${query.toString()}`);
    return { data, url: `${STOCKLENS_BASE_URL}/screener?${query.toString()}` };
  },

  async searchFiler(name: string) {
    const data = await slFetch(`/edgar/filer-search?name=${encodeURIComponent(name)}`);
    return { data, url: `${STOCKLENS_BASE_URL}/edgar/filer-search?name=${encodeURIComponent(name)}` };
  },

  // StockLens-exclusive — Financial Datasets has no equivalent for these two.
  async getProxyPayVsPerformance(ticker: string) {
    const data = await slFetch(`/edgar/pay-vs-performance/${ticker}`);
    return { data, url: `${STOCKLENS_BASE_URL}/edgar/pay-vs-performance/${ticker}` };
  },
  
  async getFilingRiskDiff(ticker: string) {
    const data = await slFetch(`/edgar/risk-diff/${ticker}`);
    return { data, url: `${STOCKLENS_BASE_URL}/edgar/risk-diff/${ticker}` };
  },
  
  async getCongressionalTrades() {
    const data = await slFetch(`/edgar/congress/trades`);
    return { trades: data, url: `${STOCKLENS_BASE_URL}/edgar/congress/trades` };
  }
};
