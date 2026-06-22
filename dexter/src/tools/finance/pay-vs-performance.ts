import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { formatToolResult } from '../types.js';
import { stocklens } from './stocklens-client.js';

export const getPayVsPerformance = new DynamicStructuredTool({
  name: 'get_pay_vs_performance',
  description: 'Retrieves executive compensation versus company performance data (Item 402(v)) from SEC EDGAR filings for a specific company.',
  schema: z.object({
    ticker: z.string().describe("The stock ticker symbol to fetch pay vs performance data for. For example, 'AAPL' for Apple."),
  }),
  func: async (input) => {
    try {
      const ticker = input.ticker.trim().toUpperCase();
      const { data, url } = await stocklens.getProxyPayVsPerformance(ticker);
      return formatToolResult(data || {}, [url]);
    } catch (error) {
      return formatToolResult({ error: 'Failed to fetch pay vs performance data', details: error instanceof Error ? error.message : String(error) }, []);
    }
  },
});
