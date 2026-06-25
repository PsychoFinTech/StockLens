import axios from 'axios';

export interface FredData {
  fedFundsRate: number | null;
  gdpGrowth: number | null;
}

export async function fetchFredData(): Promise<FredData> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    console.warn('FRED_API_KEY not found in environment variables. Returning placeholder data.');
    return {
      fedFundsRate: 5.25,
      gdpGrowth: 2.1
    };
  }

  try {
    // Federal Funds Effective Rate (FEDFUNDS)
    const fedRes = await axios.get(`https://api.stlouisfed.org/fred/series/observations?series_id=FEDFUNDS&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`);
    const fedFundsRate = parseFloat(fedRes.data.observations[0].value);

    // Real Gross Domestic Product (GDPC1)
    const gdpRes = await axios.get(`https://api.stlouisfed.org/fred/series/observations?series_id=GDPC1&api_key=${apiKey}&file_type=json&sort_order=desc&limit=2`);
    const gdpCurrent = parseFloat(gdpRes.data.observations[0].value);
    const gdpPrevious = parseFloat(gdpRes.data.observations[1].value);
    const gdpGrowth = ((gdpCurrent - gdpPrevious) / gdpPrevious) * 100;

    return {
      fedFundsRate,
      gdpGrowth
    };
  } catch (error) {
    console.error('Error fetching FRED data:', error);
    return {
      fedFundsRate: null,
      gdpGrowth: null
    };
  }
}
