import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { formatToolResult } from '../types.js';
import { stocklens } from './stocklens-client.js';

export const getFilingRiskDiff = new DynamicStructuredTool({
  name: 'get_filing_risk_diff',
  description: 'Retrieves paragraph-level diffs of the "Risk Factors" section between a company\'s two most recent 10-K filings. Useful for seeing exactly what new risks a company added or what old risks they removed over the last year.',
  schema: z.object({
    ticker: z.string().describe("The stock ticker symbol. For example, 'AAPL' for Apple."),
  }),
  func: async (input) => {
    try {
      const ticker = input.ticker.trim().toUpperCase();
      const { data, url } = await stocklens.getFilingRiskDiff(ticker);
      return formatToolResult(data || {}, [url]);
    } catch (error) {
      return formatToolResult({ error: 'Failed to fetch filing risk diff', details: error instanceof Error ? error.message : String(error) }, []);
    }
  },
});
