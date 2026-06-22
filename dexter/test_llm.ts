import 'dotenv/config';
import { getChatModel } from './src/model/llm.js';
import { HumanMessage } from '@langchain/core/messages';

async function test() {
  console.log('Base:', process.env.OPENAI_API_BASE);
  try {
    const llm = getChatModel('gpt-3.5-turbo');
    const res = await llm.invoke([new HumanMessage('Say hello!')]);
    console.log('Response:', res.content);
  } catch(e) {
    console.error(e);
  }
}
test();
