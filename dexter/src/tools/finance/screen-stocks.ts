import { DynamicStructuredTool } from '@langchain/core/tools';
import type { RunnableConfig } from '@langchain/core/runnables';
import { z } from 'zod';
import { callLlm } from '../../model/llm.js';
import { formatToolResult } from '../types.js';
import { getCurrentDate } from '../../agent/prompts.js';
import { stocklens } from './stocklens-client.js';

const StockLensScreenerSchema = z.object({
  sector: z.string().optional().describe('Sector name (e.g. Technology, Healthcare, Financial Services, Consumer Cyclical)'),
  exchange: z.string().optional(),
  minMcap: z.number().optional().describe('Minimum market cap in millions (e.g. 1000 for 1B)'),
  maxMcap: z.number().optional().describe('Maximum market cap in millions'),
  minPeTrailing: z.number().optional(),
  maxPeTrailing: z.number().optional(),
  minPeForward: z.number().optional(),
  maxPeForward: z.number().optional(),
  minPeg: z.number().optional(),
  maxPeg: z.number().optional(),
  minPb: z.number().optional(),
  maxPb: z.number().optional(),
  minPs: z.number().optional(),
  maxPs: z.number().optional(),
  minDiv: z.number().optional().describe('Minimum dividend yield percentage (e.g. 2 for 2%)'),
  maxDiv: z.number().optional(),
  minRoe: z.number().optional().describe('Minimum ROE percentage'),
  maxRoe: z.number().optional(),
  minRoa: z.number().optional(),
  maxRoa: z.number().optional(),
  minDe: z.number().optional(),
  maxDe: z.number().optional(),
  minCurrentRatio: z.number().optional(),
  maxCurrentRatio: z.number().optional(),
  minRevGrowth: z.number().optional().describe('Minimum revenue growth percentage'),
  maxRevGrowth: z.number().optional(),
  minEpsGrowth: z.number().optional(),
  maxEpsGrowth: z.number().optional(),
  minGrossMargin: z.number().optional().describe('Minimum gross margin percentage'),
  maxGrossMargin: z.number().optional(),
  minOpMargin: z.number().optional(),
  maxOpMargin: z.number().optional(),
  minNetMargin: z.number().optional(),
  maxNetMargin: z.number().optional(),
  minFcf: z.number().optional(),
  maxFcf: z.number().optional(),
  minTotalDebt: z.number().optional(),
  maxTotalDebt: z.number().optional(),
});

type ScreenerFilters = z.infer<typeof StockLensScreenerSchema>;

function buildScreenerPrompt(): string {
  return `You are a stock screening assistant.
Current date: ${getCurrentDate()}

Given a user's natural language query about stock screening criteria, produce the structured filter payload.

## Guidelines

1. Map user criteria to exact field names from the schema.
2. Market Cap (Mcap) is in MILLIONS. E.g. "large cap" > 10000. "1 billion" = 1000.
3. **Percentages**: Margins, growth rates, ROE, and dividend yield are in PERCENTAGES, NOT decimals. For example, "ROE above 15%" → minRoe: 15. "gross margin above 40%" → minGrossMargin: 40.
4. Use reasonable defaults if the user asks for "high growth" (e.g. minEpsGrowth: 20) or "low P/E" (e.g. maxPeTrailing: 15).
5. Company fields (sector) use string values. Common sectors: Technology, Healthcare, Financial Services, Consumer Cyclical, Consumer Defensive, Basic Materials.

Return only the structured output fields.`;
}

const ScreenStocksInputSchema = z.object({
  query: z.string().describe('Natural language query describing stock screening criteria'),
});

export const SCREEN_STOCKS_DESCRIPTION = `Screens for stocks matching financial criteria. Takes a natural language query and returns matching tickers with metric values. Use for:
- Finding stocks by valuation (P/E, P/B, EV/EBITDA)
- Screening by profitability (margins, ROE, ROA)
- Filtering by growth rates (revenue, earnings, EPS growth)
- Dividend screening (yield, payout ratio)
- Filtering by sector or industry (e.g., "health care", "oil and gas")`;

/**
 * Create a screen_stocks tool configured with the specified model.
 * Single LLM call: structured output translates natural language → screener filters.
 */
export function createScreenStocks(model: string): DynamicStructuredTool {
  return new DynamicStructuredTool({
    name: 'stock_screener',
    description: SCREEN_STOCKS_DESCRIPTION,
    schema: ScreenStocksInputSchema,
    func: async (input, _runManager, config?: RunnableConfig) => {
      const onProgress = config?.metadata?.onProgress as ((msg: string) => void) | undefined;

      // Step 1: LLM structured output — translate natural language → filters
      onProgress?.('Building screening criteria...');
      let filters: ScreenerFilters;
      try {
        const { response } = await callLlm(input.query, {
          model,
          systemPrompt: buildScreenerPrompt(),
          outputSchema: StockLensScreenerSchema,
        });
        filters = StockLensScreenerSchema.parse(response);
      } catch (error) {
        return formatToolResult(
          {
            error: 'Failed to parse screening criteria',
            details: error instanceof Error ? error.message : String(error),
          },
          [],
        );
      }

      // Step 2: GET from StockLens screener API
      onProgress?.('Screening stocks...');
      try {
        const { data, url } = await stocklens.screenStocks(filters);
        return formatToolResult(data, [url]);
      } catch (error) {
        return formatToolResult(
          {
            error: 'Screener request failed',
            details: error instanceof Error ? error.message : String(error),
            filters,
          },
          [],
        );
      }
    },
  });
}
