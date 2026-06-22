import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { formatToolResult } from '../types.js';
import { stocklens } from './stocklens-client.js';

export const getCongressionalTrades = new DynamicStructuredTool({
  name: 'get_congressional_trades',
  description: 'Retrieves recent stock trades by members of the US Congress. Useful for tracking what politicians are buying and selling.',
  schema: z.object({}),
  func: async () => {
    try {
      const { trades, url } = await stocklens.getCongressionalTrades();
      return formatToolResult(trades || [], [url]);
    } catch (error) {
      return formatToolResult({ error: 'Failed to fetch congressional trades', details: error instanceof Error ? error.message : String(error) }, []);
    }
  },
});
