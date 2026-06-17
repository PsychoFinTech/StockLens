import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../utils/apiClient.js';
import { formatPrice, formatPercentChange } from '../utils/formatters.js';
import { Flame, TrendingUp, TrendingDown, RefreshCcw } from 'lucide-react';

interface IndexQuote {
  name: string;
  symbol: string;
  price: number;
  change: number;
  change_pct: number;
}

export const Ticker: React.FC = () => {
  const { data: indices, isPending, error, refetch } = useQuery<IndexQuote[]>({
    queryKey: ['marketIndices'],
    queryFn: async () => {
      const resp = await apiClient.get('/market/indices');
      return resp.data;
    },
    refetchInterval: 60000 // refresh indices quote every minute
  });

  return (
    <div className="bg-gray-900 text-gray-100 border-b border-gray-800 text-xs py-2.5 px-4 overflow-hidden shadow-sm">
      <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Label block */}
        <div className="flex items-center gap-2 flex-shrink-0 text-emerald-400 font-mono tracking-wider font-semibold">
          <Flame className="h-4 w-4 animate-pulse" />
          <span>GLOBAL INDICES</span>
          <span className="h-3 w-px bg-gray-700 mx-1 hidden sm:inline" />
        </div>

        {/* Indices list */}
        <div className="flex items-center gap-4 md:gap-6 overflow-x-auto no-scrollbar py-0.5 w-full justify-start sm:justify-end">
          {isPending ? (
            <div className="flex gap-4 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div key={idx} className="h-4 w-24 bg-gray-800 rounded" />
              ))}
            </div>
          ) : error ? (
            <div className="text-gray-400 font-mono">Indices delayed. Retry.</div>
          ) : (
            indices?.map((idx) => {
              const isUp = idx.change >= 0;
              return (
                <div 
                  key={idx.symbol} 
                  className="flex items-center gap-2 flex-shrink-0 border-r border-gray-800/80 last:border-0 pr-4 last:pr-0"
                >
                  <span className="font-sans font-medium text-gray-300">{idx.name}</span>
                  <span className="font-mono font-bold text-white">
                    {idx.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className={`inline-flex items-center gap-0.5 font-mono text-[11px] font-semibold px-1 rounded ${
                    isUp ? 'text-emerald-400 bg-emerald-950/40' : 'text-rose-400 bg-rose-950/40'
                  }`}>
                    {isUp ? (
                      <TrendingUp className="h-2.5 w-2.5" />
                    ) : (
                      <TrendingDown className="h-2.5 w-2.5" />
                    )}
                    {formatPercentChange(idx.change_pct)}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Refreshes indicator */}
        <button 
          onClick={() => refetch()}
          title="Manual Indices Refresh"
          className="p-1 hover:bg-gray-800 rounded transition-colors text-gray-400 hover:text-white shrink-0 hidden md:block"
        >
          <RefreshCcw className="h-3.5 w-3.5" />
        </button>

      </div>
    </div>
  );
};
