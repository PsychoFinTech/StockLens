import { yahooService } from '../server/services/yahoo.js';

async function main() {
  const symbol = 'AMAT';
  const nowStr = new Date().toISOString().split('T')[0];
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
  const fiveYearsAgoStr = fiveYearsAgo.toISOString().split('T')[0];

  try {
    const timeSeries = await yahooService.getFundamentalsTimeSeries(symbol, fiveYearsAgoStr, nowStr);
    
    if (timeSeries && timeSeries.length > 0) {
      const latest = timeSeries[timeSeries.length - 1];
      console.log(`There are ${timeSeries.length} years of data.`);
      console.log('Latest payload keys count:', Object.keys(latest).length);
      console.log('Latest payload keys:', Object.keys(latest));
      console.log('\nSample latest object:', JSON.stringify(latest, null, 2));
      
      // Let's also check if "freeCashFlow", "totalRevenue" exist in any year
      const allKeys = new Set<string>();
      timeSeries.forEach(ts => Object.keys(ts).forEach(k => allKeys.add(k)));
      console.log('\nAll unique keys across all years:', Array.from(allKeys));
      
    } else {
      console.log('No timeSeries data returned.');
    }
  } catch (err) {
    console.error('Error fetching data:', err);
  }
}

main();
