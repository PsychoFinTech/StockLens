import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { edgarApiClient } from '../../../utils/apiClient.js';

export interface CompanyProfile {
  symbol: string;
  name: string;
  logo: string;
  sector: string;
  industry: string;
  exchange: string;
  country: string;
  weburl: string;
  ipo: string;
  description: string;
}

export interface Ratios {
  symbol: string;
  pe: string;
  pb: string;
  roe: string;
  roce: string;
  debt_equity: string;
  eps: string;
  market_cap: number;
  dividend_yield: string;
}

export interface Peer {
  symbol: string;
  name: string;
  price: number;
  mcap: number;
  pe: number;
  pb: number;
  roe: string;
  exchange: string;
}

export interface CompanyNews {
  id: string;
  headline: string;
  source: string;
  summary: string;
  url: string;
  datetime: number;
}

interface UseCompanyDataProps {
  upperSymbol: string;
  secComparePeer: string;
  holdingsQuery: string;
  showRiskDiff: boolean;
}

export const useCompanyData = ({
  upperSymbol,
  secComparePeer,
  holdingsQuery,
  showRiskDiff,
}: UseCompanyDataProps) => {
  const queryClient = useQueryClient();

  // 1. Fetch Watchlist to check item state
  const { data: watchlist } = useQuery<any[]>({
    queryKey: ['watchlist'],
    queryFn: async () => {
      const resp = await apiClient.get('/watchlist');
      return resp.data || [];
    }
  });

  const isStarred = watchlist?.some(item => item.symbol.toUpperCase() === upperSymbol) ?? false;

  // Watchlist Toggle mutation
  const toggleStar = useMutation({
    mutationFn: async () => {
      if (isStarred) {
        return await apiClient.delete(`/watchlist/${encodeURIComponent(upperSymbol)}`);
      } else {
        return await apiClient.post('/watchlist/add', { symbol: upperSymbol });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    }
  });

  // 2. Fetch Company Profile
  const { data: profile, isPending: isProfilePending, error: profileErr } = useQuery<CompanyProfile>({
    queryKey: ['profile', upperSymbol],
    queryFn: async () => {
      const resp = await apiClient.get(`/profile/${encodeURIComponent(upperSymbol)}`);
      return resp.data;
    }
  });

  // 3. Fetch Company Key Financial Multiples (Ratios Table)
  const { data: ratios, isPending: isRatiosPending } = useQuery<Ratios>({
    queryKey: ['ratios', upperSymbol],
    queryFn: async () => {
      const resp = await apiClient.get(`/ratios/${encodeURIComponent(upperSymbol)}`);
      return resp.data;
    }
  });

  // 4. Fetch Ticker Specific Bulletins Feed
  const { data: news, isPending: isNewsPending } = useQuery<CompanyNews[]>({
    queryKey: ['news', upperSymbol],
    queryFn: async () => {
      const resp = await apiClient.get(`/news/${encodeURIComponent(upperSymbol)}`);
      return resp.data || [];
    }
  });

  // 5. Fetch Sector Peers Metrics Grid
  const { data: peers, isPending: isPeersPending } = useQuery<Peer[]>({
    queryKey: ['peers', upperSymbol],
    queryFn: async () => {
      const resp = await apiClient.get(`/peers/${encodeURIComponent(upperSymbol)}`);
      return resp.data || [];
    }
  });

  // Quick query current stock quote
  const { data: quote } = useQuery({
    queryKey: ['quote', upperSymbol],
    queryFn: async () => {
      const resp = await apiClient.get(`/quote/${encodeURIComponent(upperSymbol)}`);
      return resp.data;
    },
    refetchInterval: 60000
  });

  // News bulletins query hook
  const { data: companyNews, isPending: isCompanyNewsPending } = useQuery({
    queryKey: ['companyNews', upperSymbol],
    queryFn: async () => {
      const resp = await apiClient.get(`/news/${encodeURIComponent(upperSymbol)}`);
      return resp.data || [];
    }
  });

  const isUSStock = profile ? (
    !upperSymbol.endsWith('.NS') && 
    !upperSymbol.endsWith('.BO') && 
    !(profile.exchange || '').toUpperCase().includes('NSE') && 
    !(profile.exchange || '').toUpperCase().includes('BSE') && 
    !(profile.exchange || '').toUpperCase().includes('INDIA')
  ) : (!upperSymbol.endsWith('.NS') && !upperSymbol.endsWith('.BO'));

  // SEC EDGAR Query Hooks - these are lazy loaded
  const { data: edgarFinancials, isPending: isEdgarFinancialsPending, isError: isEdgarFinancialsError } = useQuery({
    queryKey: ['edgarFinancials', upperSymbol],
    queryFn: async () => {
      const resp = await edgarApiClient.get(`/edgar/financials/${upperSymbol}`);
      return resp.data;
    },
    enabled: isUSStock,
    staleTime: 24 * 60 * 60 * 1000 // cache for 24h
  });

  const { data: edgarCompareFinancials } = useQuery({
    queryKey: ['edgarFinancials', secComparePeer],
    queryFn: async () => {
      if (!secComparePeer) return null;
      const resp = await edgarApiClient.get(`/edgar/financials/${secComparePeer.toUpperCase()}`);
      return resp.data;
    },
    enabled: !!secComparePeer && secComparePeer !== upperSymbol,
    staleTime: 24 * 60 * 60 * 1000
  });

  const { data: edgarInsiders, isPending: isEdgarInsidersPending, isError: isEdgarInsidersError } = useQuery({
    queryKey: ['edgarInsiders', upperSymbol],
    queryFn: async () => {
      const resp = await edgarApiClient.get(`/edgar/insiders/${upperSymbol}`);
      return resp.data;
    },
    enabled: isUSStock,
    staleTime: 60 * 60 * 1000 // cache 1h
  });

  const { data: edgarHoldings, isPending: isEdgarHoldingsPending, isError: isEdgarHoldingsError } = useQuery({
    queryKey: ['edgarHoldings', holdingsQuery],
    queryFn: async () => {
      const resp = await edgarApiClient.get(`/edgar/holdings/${holdingsQuery}`);
      return resp.data;
    },
    enabled: !!holdingsQuery,
    staleTime: 24 * 60 * 60 * 1000
  });

  const { data: edgarSection1, isPending: isSection1Pending, isError: isSection1Error } = useQuery({
    queryKey: ['edgarSection1_v2', upperSymbol],
    queryFn: async () => {
      const resp = await edgarApiClient.get(`/edgar/section/${upperSymbol}/1`);
      return resp.data;
    },
    enabled: isUSStock,
    staleTime: 5 * 60 * 1000 // 5 minutes cache
  });

  const { data: edgarSection1A, isPending: isSection1APending, isError: isSection1AError } = useQuery({
    queryKey: ['edgarSection1A_v2', upperSymbol],
    queryFn: async () => {
      const resp = await edgarApiClient.get(`/edgar/section/${upperSymbol}/1A`);
      return resp.data;
    },
    enabled: isUSStock,
    staleTime: 5 * 60 * 1000 // 5 minutes cache
  });

  const { data: edgarSection7, isPending: isSection7Pending, isError: isSection7Error } = useQuery({
    queryKey: ['edgarSection7_v2', upperSymbol],
    queryFn: async () => {
      const resp = await edgarApiClient.get(`/edgar/section/${upperSymbol}/7`);
      return resp.data;
    },
    enabled: isUSStock,
    staleTime: 5 * 60 * 1000 // 5 minutes cache
  });

  const { data: edgarRiskDiff, isPending: isRiskDiffPending, isError: isRiskDiffError } = useQuery({
    queryKey: ['edgarRiskDiff_v2', upperSymbol],
    queryFn: async () => {
      const resp = await edgarApiClient.get(`/edgar/risk-diff/${upperSymbol}`);
      return resp.data;
    },
    enabled: showRiskDiff && isUSStock,
    staleTime: 5 * 60 * 1000 // 5 minutes cache
  });

  return {
    watchlist,
    isStarred,
    toggleStar,
    profile,
    isProfilePending,
    profileErr,
    ratios,
    isRatiosPending,
    news,
    isNewsPending,
    peers,
    isPeersPending,
    quote,
    companyNews,
    isCompanyNewsPending,
    edgarFinancials,
    isEdgarFinancialsPending,
    isEdgarFinancialsError,
    edgarCompareFinancials,
    edgarInsiders,
    isEdgarInsidersPending,
    isEdgarInsidersError,
    edgarHoldings,
    isEdgarHoldingsPending,
    isEdgarHoldingsError,
    edgarSection1,
    isSection1Pending,
    isSection1Error,
    edgarSection1A,
    isSection1APending,
    isSection1AError,
    edgarSection7,
    isSection7Pending,
    isSection7Error,
    edgarRiskDiff,
    isRiskDiffPending,
    isRiskDiffError
  };
};
