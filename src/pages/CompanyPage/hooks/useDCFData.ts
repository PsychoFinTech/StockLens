import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../utils/apiClient.js';

export interface DCFData {
  symbol: string;
  companyName: string;
  currentPrice: number;
  sharesOutstanding: number | null;
  historicalFCF: { year: number; value: number }[];
  historicalRevenue: { year: number; value: number }[];
  totalDebt: number | null;
  cashAndEquivalents: number | null;
  beta: number | null;
  riskFreeRate: number | null;
  marketCap: number | null;
  interestExpense: number | null;
  taxRate: number | null;
  analystGrowthEstimate5yr: number | null;
  currency: 'USD' | 'INR';
  lastFiscalYear: number;
  dataFreshness: string;
  high_52w: number | null;
  low_52w: number | null;
  dataConfidence?: 'high' | 'medium' | 'low';
  peerMedianPE?: number | null;
  companyEPS?: number | null;
  syntheticRating?: string | null;
  syntheticCostOfDebt?: number | null;
  provenance?: Record<string, { source: string; timestamp?: string; fallbackApplied: boolean }>;
}

export function useDCFData(symbol: string) {
  return useQuery<DCFData>({
    queryKey: ['dcf-inputs', symbol.toUpperCase()],
    queryFn: async () => {
      const resp = await apiClient.get(`/dcf/${encodeURIComponent(symbol.toUpperCase())}`);
      return resp.data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!symbol
  });
}
