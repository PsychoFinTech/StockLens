import 'dotenv/config';
import { streamLlmWithMessages } from './src/model/llm.js';
import { HumanMessage } from '@langchain/core/messages';

async function test() {
  const msgs = [new HumanMessage('Say exactly the word hello.')];
  let accumulated = null;
  const chunks = [];
  for await (const chunk of streamLlmWithMessages(msgs, { model: 'free' })) {
    accumulated = accumulated ? accumulated.concat(chunk) : chunk;
    chunks.push(chunk);
  }
  console.log('ACCUMULATED CONTENT TYPE:', typeof accumulated.content);
  console.log('ACCUMULATED CONTENT:', JSON.stringify(accumulated.content, null, 2));
}

test().catch(console.error);
