import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { stripFieldsDeep } from './api.js';
import { stocklens } from './stocklens-client.js';
import { formatToolResult } from '../types.js';
import { TTL_1H } from './utils.js';

const REDUNDANT_INSIDER_FIELDS = ['issuer'] as const;

const InsiderTradesInputSchema = z.object({
  ticker: z
    .string()
    .describe("The stock ticker symbol to fetch insider trades for. For example, 'AAPL' for Apple."),
  limit: z
    .number()
    .default(10)
    .describe('Maximum number of insider trades to return (default: 10, max: 1000). Increase this for longer historical windows when needed.'),
  filing_date: z
    .string()
    .optional()
    .describe('Exact filing date to filter by (YYYY-MM-DD).'),
  filing_date_gte: z
    .string()
    .optional()
    .describe('Filter for trades with filing date greater than or equal to this date (YYYY-MM-DD).'),
  filing_date_lte: z
    .string()
    .optional()
    .describe('Filter for trades with filing date less than or equal to this date (YYYY-MM-DD).'),
  filing_date_gt: z
    .string()
    .optional()
    .describe('Filter for trades with filing date greater than this date (YYYY-MM-DD).'),
  filing_date_lt: z
    .string()
    .optional()
    .describe('Filter for trades with filing date less than this date (YYYY-MM-DD).'),
  name: z
    .string()
    .optional()
    .describe("Filter by insider name (e.g., 'HUANG JEN HSUN'). Names can be discovered via the /insider-trades/names/?ticker={ticker} endpoint."),
});

export const getInsiderTrades = new DynamicStructuredTool({
  name: 'get_insider_trades',
  description: `Retrieves insider trading transactions for a given company ticker. Insider trades include purchases and sales of company stock by executives, directors, and other insiders. This data is sourced from SEC Form 4 filings. Use filing_date filters to narrow down results by date range. Use the name parameter to filter by a specific insider.`,
  schema: InsiderTradesInputSchema,
  func: async (input) => {
    const limit = input.limit || 10;
    const ticker = input.ticker.toUpperCase();
    const { insider_trades, url } = await stocklens.getInsiderTrades(ticker, limit);
    return formatToolResult(
      stripFieldsDeep(insider_trades || [], REDUNDANT_INSIDER_FIELDS),
      [url]
    );
  },
});
