import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../utils/apiClient.js';
import { LineChart, AlertCircle, RefreshCw } from 'lucide-react';

interface IndexQuote {
  name: string;
  symbol: string;
  price: number | null;
  change: number | null;
  change_pct: number | null;
  unavailable?: boolean;
}

export const MarketDashboardPage: React.FC = () => {
  // 1. Fetch indices quotes
  const { data: indices, isPending: isIndicesPending, refetch: refetchIndices } = useQuery<IndexQuote[]>({
    queryKey: ['marketIndicesMain'],
    queryFn: async () => {
      const resp = await apiClient.get('/market/indices');
      return resp.data || [];
    }
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      
      {/* 1. Header with title and manual updates */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-150 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <LineChart className="h-6 w-6 text-emerald-600" />
            <h1 className="font-sans text-2xl font-black text-gray-900 tracking-tight">Financial Market Dashboard</h1>
          </div>
          <p className="font-sans text-xs sm:text-sm text-gray-500 max-w-2xl">
            Monitor real-time movers, multi-region key indices, and global sector leadership rotations.
          </p>
        </div>

        <button
          onClick={() => { refetchIndices(); }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-gray-200 hover:border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white shadow-3xs transition-all hover:bg-gray-50"
        >
          <RefreshCw className="h-3.5 w-3.5 text-emerald-650" />
          <span>Refresh All Listings</span>
        </button>
      </div>

      {/* 2. Global Index Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {isIndicesPending ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))
        ) : (
          indices?.map((idx) => {
            if (idx.unavailable || idx.price === null || idx.change_pct === null) {
              return (
                <div
                  key={idx.symbol}
                  className="p-4 bg-white border border-gray-150 rounded-xl shadow-3xs flex flex-col justify-between"
                >
                  <div>
                    <span className="font-sans font-extrabold text-[13px] text-gray-900 tracking-tight">
                      {idx.name}
                    </span>
                    <div className="font-mono text-[10px] text-gray-400 font-semibold uppercase">
                      {idx.symbol}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-gray-400">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span className="font-mono text-[11px] font-semibold uppercase">
                      Unavailable
                    </span>
                  </div>
                </div>
              );
            }

            const isUp = idx.change_pct >= 0;
            return (
              <div 
                key={idx.symbol}
                className="p-4 bg-white border border-gray-150 rounded-xl shadow-3xs flex flex-col justify-between"
              >
                <div>
                  <span className="font-sans font-extrabold text-[13px] text-gray-900 tracking-tight">
                    {idx.name}
                  </span>
                  <div className="font-mono text-[10px] text-gray-400 font-semibold uppercase">
                    {idx.symbol}
                  </div>
                </div>

                <div className="mt-2 flex items-baseline justify-between">
                  <span className="font-mono font-bold text-base text-gray-950">
                    {idx.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className={`font-mono text-xs font-extrabold flex items-center ${
                    isUp ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {isUp ? '+' : ''}{idx.change_pct.toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
