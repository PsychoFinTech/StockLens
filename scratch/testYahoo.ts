import YahooFinance from 'yahoo-finance2';

let YahooFinanceClass: any = YahooFinance;
if (YahooFinanceClass && typeof YahooFinanceClass.default === 'function') {
  YahooFinanceClass = YahooFinanceClass.default;
}

const yahooFinance = new YahooFinanceClass();

async function run() {
  try {
    const symbol = 'AAPL';
    console.log('Fetching fundamentalsTimeSeries for AAPL...');
    
    const now = new Date();
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    
    const result = await yahooFinance.fundamentalsTimeSeries(symbol, {
      period1: fiveYearsAgo,
      period2: now,
      type: 'annual',
      module: 'all'
    });
    
    console.log('Total items in result:', result?.length);
    if (result && result.length > 0) {
      result.forEach((item: any, idx: number) => {
        console.log(`\n--- Item ${idx} ---`);
        console.log('Date:', item.date);
        console.log('Period Type:', item.periodType);
        console.log('Revenue:', item.totalRevenue);
        console.log('Free Cash Flow:', item.freeCashFlow);
        console.log('Interest Expense:', item.interestExpense);
        console.log('Tax Rate For Calcs:', item.taxRateForCalcs);
        console.log('Net Income:', item.netIncome);
        console.log('Total Debt:', item.totalDebt);
        console.log('Shares:', item.ordinarySharesNumber);
      });
    }
  } catch (error: any) {
    console.error('Error fetching fundamentalsTimeSeries:', error.message);
  }
}

run();
