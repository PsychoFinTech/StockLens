import YahooFinance from 'yahoo-finance2';
import dotenv from 'dotenv';
dotenv.config();

let YahooFinanceClass: any = YahooFinance;
if (YahooFinanceClass && typeof YahooFinanceClass.default === 'function') {
  YahooFinanceClass = YahooFinanceClass.default;
}

const yahooFinance = new YahooFinanceClass();

async function run() {
  try {
    console.log('--- TESTING DAY LOSERS SCREENER ---');
    const result = await yahooFinance.screener({ scrIds: 'day_losers', count: 10 }, {}, { validateResult: false });
    console.log('Result keys:', Object.keys(result));
    console.log('Total quotes found:', result.quotes?.length);
    if (result.quotes && result.quotes.length > 0) {
      console.log('First quote:', result.quotes[0]);
    } else {
      console.log('No quotes returned! Raw result:', JSON.stringify(result));
    }
  } catch (err: any) {
    console.error('Error:', err.message);
    if (err.stack) console.error(err.stack);
  }
}

run();
