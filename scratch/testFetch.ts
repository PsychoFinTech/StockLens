import YahooFinance from 'yahoo-finance2';

// Compatibility for CJS/ESM
let YahooFinanceClass = YahooFinance;
if (YahooFinanceClass && typeof YahooFinanceClass.default === 'function') {
  YahooFinanceClass = YahooFinanceClass.default;
}

const yahooFinance = new YahooFinanceClass({
  queue: { concurrency: 4 }
});

async function main() {
  try {
    const symbols = ['AAPL', 'MSFT', 'TSLA'];
    const result = await yahooFinance.quote(symbols);
    console.log(result[0]);
  } catch (e) {
    console.error(e);
  }
}
main();
