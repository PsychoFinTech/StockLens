import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { stocklens } from './stocklens-client.js';
import { formatToolResult } from '../types.js';

export const STOCK_PRICE_DESCRIPTION = `
Fetches current stock price snapshots for equities, including open, high, low, close prices, volume, and market cap. Powered by Financial Datasets.
`.trim();

const StockPriceInputSchema = z.object({
  ticker: z
    .string()
    .describe("The stock ticker symbol to fetch current price for. For example, 'AAPL' for Apple."),
});

export const getStockPrice = new DynamicStructuredTool({
  name: 'get_stock_price',
  description:
    'Fetches the current stock price snapshot for an equity ticker, including open, high, low, close prices, volume, and market cap.',
  schema: StockPriceInputSchema,
  func: async (input) => {
    const ticker = input.ticker.trim().toUpperCase();
    const { snapshot, url } = await stocklens.getQuoteSnapshot(ticker);
    return formatToolResult(snapshot || {}, [url]);
  },
});

const StockPricesInputSchema = z.object({
  ticker: z
    .string()
    .describe("The stock ticker symbol to fetch historical prices for. For example, 'AAPL' for Apple."),
  interval: z
    .enum(['day', 'week', 'month', 'year'])
    .default('day')
    .describe("The time interval for price data. Defaults to 'day'."),
  start_date: z.string().describe('Start date in YYYY-MM-DD format. Required.'),
  end_date: z.string().describe('End date in YYYY-MM-DD format. Required.'),
});

export const getStockPrices = new DynamicStructuredTool({
  name: 'get_stock_prices',
  description:
    'Retrieves historical price data for a stock over a specified date range, including open, high, low, close prices and volume.',
  schema: StockPricesInputSchema,
  func: async (input) => {
    // Map interval and date diff to roughly equivalent periods
    const ticker = input.ticker.trim().toUpperCase();
    const end = new Date(input.end_date);
    const start = new Date(input.start_date);
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
    let period = '1Y';
    if (diffDays <= 7) period = '1W';
    else if (diffDays <= 31) period = '1M';
    else if (diffDays <= 93) period = '3M';
    else if (diffDays <= 186) period = '6M';
    else if (diffDays <= 366) period = '1Y';
    else if (diffDays <= 365 * 5 + 2) period = '5Y';
    else period = 'MAX';

    const { prices, url } = await stocklens.getHistoricalPrices(ticker, period);
    return formatToolResult(prices || [], [url]);
  },
});

export const getStockTickers = new DynamicStructuredTool({
  name: 'get_available_stock_tickers',
  description: 'Retrieves the list of available stock tickers that can be used with the stock price tools.',
  schema: z.object({}),
  func: async () => {
    const { data, url } = await api.get('/prices/snapshot/tickers/', {}, { cacheable: true, ttlMs: 24 * 60 * 60 * 1000 });
    return formatToolResult(data.tickers || [], [url]);
  },
});
