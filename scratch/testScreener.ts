import yahooFinance from 'yahoo-finance2';

async function main() {
  try {
    const queryOptions = {
      scrIds: 'day_gainers',
      count: 25,
      region: 'US',
    };
    const result = await yahooFinance.screener(queryOptions, { validateResult: false });
    console.log(result.quotes[0]);
  } catch (e) {
    console.error(e);
  }
}
main();
