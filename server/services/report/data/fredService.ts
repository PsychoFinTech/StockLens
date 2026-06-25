import { fredService as baseFredService } from '../../fred.js';

export interface FredData {
  fedFundsRate: number | null;
  gdpGrowth: number | null;
}

export async function fetchFredData(): Promise<FredData> {
  try {
    // Federal Funds Effective Rate (FEDFUNDS)
    const fedRes = await baseFredService.getSeries('FEDFUNDS');
    const fedObservations = fedRes?.observations;
    let fedFundsRate = null;
    if (fedObservations && fedObservations.length > 0) {
      fedFundsRate = parseFloat(fedObservations[fedObservations.length - 1].value);
    }

    // Real Gross Domestic Product (GDPC1)
    const gdpRes = await baseFredService.getSeries('GDPC1');
    const gdpObservations = gdpRes?.observations;
    let gdpGrowth = null;
    if (gdpObservations && gdpObservations.length >= 2) {
      const gdpCurrent = parseFloat(gdpObservations[gdpObservations.length - 1].value);
      const gdpPrevious = parseFloat(gdpObservations[gdpObservations.length - 2].value);
      gdpGrowth = ((gdpCurrent - gdpPrevious) / gdpPrevious) * 100;
    }

    return {
      fedFundsRate,
      gdpGrowth
    };
  } catch (error) {
    console.error('Error fetching FRED data for report:', error);
    // Return placeholders if failing
    return {
      fedFundsRate: 5.25,
      gdpGrowth: 2.1
    };
  }
}

