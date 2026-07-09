/**
 * Standard utility formatters for currency, market capitalization, percentages, and dates.
 * Enforces StockLens global data formatting rules.
 */

// Helper to resolve currency symbols based on exchange
export const getCurrencySymbol = (exchange: string, symbol: string = ''): string => {
  const ex = (exchange || '').toUpperCase();
  const sym = (symbol || '').toUpperCase();

  // Explicit checks for NSE/BSE and Indian local format suffix (.NS, .BO)
  if (sym.endsWith('.NS') || sym.endsWith('.BO') || ex.includes('NSE') || ex.includes('BSE') || ex.includes('INDIA')) {
    return '₹';
  }
  if (ex.includes('NYSE') || ex.includes('NASDAQ') || ex.includes('US') || ex.includes('OTC')) {
    return '$';
  }
  if (ex.includes('LSE') || ex.includes('LONDON')) {
    return '£';
  }
  if (ex.includes('XETRA') || ex.includes('EURONEXT') || ex.includes('MADRID') || ex.includes('ITALIANA') || ex.includes('AMSTERDAM') || ex.includes('GERMANY') || ex.includes('FRANCE') || ex.includes('SPAIN')) {
    return '€';
  }
  if (ex.includes('TOKYO') || ex.includes('TSE') || ex.includes('JAPAN')) {
    return '¥';
  }
  if (ex.includes('HKEX') || ex.includes('HK')) {
    return 'HK$';
  }
  
  // Standard fallback
  return '$'; // default USD
};

// Formats prices with appropriate decimal places and currency symbol
export const formatPrice = (price: number | null | undefined, exchange: string = 'US', symbol: string = ''): string => {
  if (price === null || price === undefined || isNaN(price)) {
    return '—';
  }
  const symbolStr = getCurrencySymbol(exchange, symbol);
  return `${symbolStr}${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Formats market cap according to scale constraints (<1B: $XXXm, 1B–1T: $XX.XB, >1T: $X.XXT)
export const formatMarketCap = (mcap: number | null | undefined, exchange: string = 'US', symbol: string = ''): string => {
  if (mcap === null || mcap === undefined || isNaN(mcap)) {
    return '—';
  }
  const symbolStr = getCurrencySymbol(exchange, symbol);
  const val = Number(mcap);

  if (val < 1_000_000) {
    return `${symbolStr}${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  }
  if (val < 1_000_000_000) {
    const valueM = val / 1_000_000;
    return `${symbolStr}${valueM.toFixed(0)}m`;
  }
  if (val < 1_000_000_000_000) {
    const valueB = val / 1_000_000_000;
    return `${symbolStr}${valueB.toFixed(2)}B`;
  }
  const valueT = val / 1_000_000_000_000;
  return `${symbolStr}${valueT.toFixed(2)}T`;
};

// Formats percentage changes with sign: +1.23% or -0.45%
export const formatPercentChange = (pct: number | null | undefined): string => {
  if (pct === null || pct === undefined || isNaN(pct)) {
    return '—';
  }
  const val = Number(pct);
  const sign = val > 0 ? '+' : '';
  return `${sign}${val.toFixed(2)}%`;
};

// Formats date strings to "Jun 11, 2025"
export const formatDate = (dateInput: string | number | null | undefined): string => {
  if (!dateInput) return '—';
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return '—';
  }
};

// Pretty large values with locale delimiter representation
export const formatLargeNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined || isNaN(num)) {
    return '—';
  }
  return Math.round(num).toLocaleString();
};

// Formats outstanding shares (B/M for US, Cr/L for India)
export const formatShares = (shares: number | null | undefined, exchange: string = 'US', symbol: string = ''): string => {
  if (shares === null || shares === undefined || isNaN(shares)) {
    return '—';
  }
  const val = Number(shares);
  const ex = (exchange || '').toUpperCase();
  const sym = (symbol || '').toUpperCase();
  const isIndian = sym.endsWith('.NS') || sym.endsWith('.BO') || ex.includes('NSE') || ex.includes('BSE') || ex.includes('INDIA');

  if (isIndian) {
    if (val >= 10_000_000) {
      return `${(val / 10_000_000).toFixed(2)} Cr`;
    }
    if (val >= 100_000) {
      return `${(val / 100_000).toFixed(2)} L`;
    }
    return val.toLocaleString();
  } else {
    if (val >= 1_000_000_000) {
      return `${(val / 1_000_000_000).toFixed(2)} B`;
    }
    if (val >= 1_000_000) {
      return `${(val / 1_000_000).toFixed(2)} M`;
    }
    return val.toLocaleString();
  }
};

