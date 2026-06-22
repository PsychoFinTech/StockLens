import 'dotenv/config';
import { callLlmWithMessages } from './src/model/llm.js';
import { HumanMessage, ToolMessage, AIMessage } from '@langchain/core/messages';

async function test() {
  const msgs = [
    new HumanMessage('current stock price of AAPL'),
    new AIMessage({
      content: '',
      tool_calls: [{
        id: 'get_market_data-1782118544448-0',
        name: 'get_market_data',
        args: { query: 'current stock price of AAPL' }
      }]
    }),
    new ToolMessage({
      name: 'get_market_data',
      tool_call_id: 'get_market_data-1782118544448-0',
      content: '{"data":{"get_stock_price_AAPL":{"ticker":"AAPL","price":298.01}}}'
    })
  ];
  const res = await callLlmWithMessages(msgs, { model: 'free' });
  console.log(JSON.stringify(res.response, null, 2));
}

test().catch(console.error);
