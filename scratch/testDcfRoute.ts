import { yahooService } from '../server/services/yahoo.js';
import { fredService } from '../server/services/fred.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const symbol = 'AAPL';
  try {
    console.log(`Running live DCF aggregation for ${symbol}...`);
    
    const now = new Date();
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    const fiveYearsAgoStr = fiveYearsAgo.toISOString().split('T')[0];
    const nowStr = now.toISOString().split('T')[0];

    const profile = await yahooService.getProfile(symbol);
    console.log('Profile fetched successfully. Country:', profile?.country);
    
    const quote = await yahooService.getQuote(symbol);
    console.log('Quote fetched successfully. Price:', quote?.price);
    
    const basicFinancials = await yahooService.getBasicFinancials(symbol);
    console.log('Basic Financials keys:', Object.keys(basicFinancials?.metric || {}));
    console.log('Shares Outstanding:', basicFinancials?.metric?.sharesOutstanding);
    console.log('Total Cash:', basicFinancials?.metric?.totalCash);
    console.log('Total Debt:', basicFinancials?.metric?.totalDebt);
    console.log('Beta:', basicFinancials?.metric?.beta);
    console.log('Market Cap:', basicFinancials?.metric?.marketCapitalization);

    const timeSeries = await yahooService.getFundamentalsTimeSeries(symbol, fiveYearsAgoStr, nowStr);
    console.log('TimeSeries items count:', timeSeries?.length);
    
    const sortedStatements = (Array.isArray(timeSeries) ? timeSeries : []).sort((a: any, b: any) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    
    const sortedNewestFirst = [...sortedStatements].reverse();
    
    const totalDebt = basicFinancials?.metric?.totalDebt ?? 
                      sortedNewestFirst.find(s => s.totalDebt !== undefined && s.totalDebt !== null)?.totalDebt ?? 
                      null;

    const cashAndEquivalents = basicFinancials?.metric?.totalCash ?? 
                               sortedNewestFirst.find(s => s.cashCashEquivalentsAndShortTermInvestments !== undefined && s.cashCashEquivalentsAndShortTermInvestments !== null)?.cashCashEquivalentsAndShortTermInvestments ?? 
                               sortedNewestFirst.find(s => s.cashAndCashEquivalents !== undefined && s.cashAndCashEquivalents !== null)?.cashAndCashEquivalents ?? 
                               null;

    const sharesOutstanding = basicFinancials?.metric?.sharesOutstanding ?? 
                              sortedNewestFirst.find(s => s.ordinarySharesNumber !== undefined && s.ordinarySharesNumber !== null)?.ordinarySharesNumber ?? 
                              null;

    console.log('\n--- Final Derived Inputs ---');
    console.log('Shares Outstanding derived:', sharesOutstanding);
    console.log('Total Debt derived:', totalDebt);
    console.log('Cash & Equivalents derived:', cashAndEquivalents);
    console.log('Latest Revenue derived:', sortedNewestFirst.length > 0 ? sortedNewestFirst[0].totalRevenue : null);
    
  } catch (error: any) {
    console.error('Error during live aggregation:', error);
  }
}

run();
