import 'dotenv/config';
import { callLlmWithMessages } from './src/model/llm.js';
import { HumanMessage, ToolMessage } from '@langchain/core/messages';

async function test() {
  const msgs = [
    new HumanMessage('What is the apple stock price?'),
    new ToolMessage({ name: 'get_market_data', tool_call_id: '123', content: 'Apple stock is 100 dollars' })
  ];
  const res = await callLlmWithMessages(msgs, { model: 'free' });
  console.log(JSON.stringify(res.response, null, 2));
}

test().catch(console.error);
