import 'dotenv/config';
import { streamLlmWithMessages } from './src/model/llm.js';
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
  let accumulated = null;
  const chunks = [];
  try {
    for await (const chunk of streamLlmWithMessages(msgs, { model: 'free' })) {
      accumulated = accumulated ? accumulated.concat(chunk) : chunk;
      chunks.push(chunk);
    }
    console.log('ACCUMULATED CONTENT:', JSON.stringify(accumulated.content, null, 2));
  } catch(e) {
    console.error('ERROR:', e);
  }
}

test().catch(console.error);
