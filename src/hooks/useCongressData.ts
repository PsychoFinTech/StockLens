import { useState, useEffect, useCallback } from 'react';
import { convertFMPTrades, EnrichedTrade } from '../utils/congressHelpers.js';

let cachedTrades: any[] | null = null;
let cachedCommittees: any | null = null;

export function useCongressData(ticker: string) {
  const [trades, setTrades] = useState<EnrichedTrade[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);

  const fetchData = useCallback(async (force = false) => {
    setIsLoading(true);
    setIsError(false);

    try {
      if (force || !cachedTrades || !cachedCommittees) {
        const [tradesRes, committeesRes] = await Promise.all([
          fetch('/api/edgar/congress/trades').then(res => {
            if (!res.ok) throw new Error('Failed to fetch transactions');
            return res.json();
          }),
          fetch('/api/edgar/congress/committees').then(res => {
            if (!res.ok) throw new Error('Failed to fetch committee memberships');
            return res.json();
          })
        ]);

        cachedTrades = tradesRes;
        cachedCommittees = committeesRes;
      }

      // Use FMP converter — data is already flat from the API
      const joined = convertFMPTrades(cachedTrades as any[], cachedCommittees, ticker);

      setTrades(joined);
    } catch (err) {
      console.error('Error loading political alpha data:', err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [ticker]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    trades,
    isLoading,
    isError,
    refetch: () => fetchData(true)
  };
}
