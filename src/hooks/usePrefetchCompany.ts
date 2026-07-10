import { useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import apiClient from '../utils/apiClient.js';

/**
 * Returns a prefetch handler for company data.
 * On hover/focus of a stock row, warms the CompanyPage route chunk
 * and prefetches profile + quote data via TanStack Query
 * (using the SAME query keys as useCompanyData so the cache is shared).
 *
 * Each symbol is prefetched at most once per session.
 */
export function usePrefetchCompany() {
  const queryClient = useQueryClient();
  const prefetchedRef = useRef(new Set<string>());

  const prefetch = useCallback((symbol: string) => {
    const sym = symbol.toUpperCase();
    if (prefetchedRef.current.has(sym)) return;
    prefetchedRef.current.add(sym);

    // 1. Warm the CompanyPage route chunk (matches the React.lazy import in App.tsx)
    import('../pages/CompanyPage/index.jsx').catch(() => {});

    // 2. Warm primary data queries (same keys + fetchers as useCompanyData)
    queryClient.prefetchQuery({
      queryKey: ['profile', sym],
      queryFn: () => apiClient.get(`/profile/${encodeURIComponent(sym)}`).then(r => r.data),
    });
    queryClient.prefetchQuery({
      queryKey: ['quote', sym],
      queryFn: () => apiClient.get(`/quote/${encodeURIComponent(sym)}`).then(r => r.data),
    });
  }, [queryClient]);

  return prefetch;
}
