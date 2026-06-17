import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../utils/apiClient.js';
import { formatPercentChange } from '../utils/formatters.js';
import { Flame, TrendingUp, TrendingDown, RefreshCcw } from 'lucide-react';

interface IndexQuote {
  name: string;
  symbol: string;
  price: number;
  change: number;
  change_pct: number;
}

export const TickerPreview: React.FC = () => {
  const { data: indices, isPending, error, refetch } = useQuery<IndexQuote[]>({
    queryKey: ['marketIndices'],
    queryFn: async () => {
      const resp = await apiClient.get('/market/indices');
      return resp.data;
    },
    refetchInterval: 60000
  });

  return (
    <div className="bg-[#0F1117] text-white border-b border-[#1e2330] text-xs py-3 px-4 overflow-hidden shadow-sm relative z-40 select-none">
      <style>{`
        @keyframes marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .ticker-marquee-container {
          display: flex;
          width: max-content;
          animation: marquee 25s linear infinite;
        }
        .ticker-marquee-container:hover {
          animation-play-state: paused;
        }
      `}</style>
      
      <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
        
        {/* Label block */}
        <div className="flex items-center gap-2 flex-shrink-0 text-[#1A6EFF] font-mono tracking-wider font-bold z-10 bg-[#0F1117] pr-3 border-r border-[#1e2330]">
          <Flame className="h-4 w-4 animate-pulse text-[#1A6EFF]" />
          <span className="text-[10px] tracking-[0.08em] uppercase">GLOBAL INDICES</span>
        </div>

        {/* Scrolling Indices List Container */}
        <div className="flex-1 overflow-hidden relative flex items-center">
          {isPending ? (
            <div className="flex gap-6 animate-pulse">
              {[1, 2, 3, 4, 5].map((idx) => (
                <div key={idx} className="h-4 w-28 bg-[#1e2330] rounded" />
              ))}
            </div>
          ) : error ? (
            <div className="text-gray-400 font-mono text-[11px]">Indices feed currently offline.</div>
          ) : (
            <div className="ticker-marquee-container flex items-center gap-8">
              {/* Render indices twice for seamless infinite looping */}
              {[...(indices || []), ...(indices || [])].map((idx, index) => {
                const isUp = idx.change >= 0;
                return (
                  <div 
                    key={`${idx.symbol}-${index}`} 
                    className="flex items-center gap-2.5 flex-shrink-0 pr-6 border-r border-[#1e2330]/60 last:border-0"
                  >
                    <span className="font-sans font-medium text-gray-400 text-[11px]">{idx.name}</span>
                    <span className="font-mono font-bold text-[#FFFFFF] text-[11.5px]">
                      {idx.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className={`inline-flex items-center gap-0.5 font-mono text-[10.5px] font-bold px-1.5 py-0.5 rounded ${
                      isUp ? 'text-[#16A34A] bg-[#16A34A]/10' : 'text-[#DC2626] bg-[#DC2626]/10'
                    }`}>
                      {isUp ? (
                        <TrendingUp className="h-3 w-3 stroke-[2.5]" />
                      ) : (
                        <TrendingDown className="h-3 w-3 stroke-[2.5]" />
                      )}
                      {formatPercentChange(idx.change_pct)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Refreshes indicator */}
        <button 
          onClick={() => refetch()}
          title="Manual Indices Refresh"
          className="p-1 hover:bg-[#1e2330] rounded transition-colors text-gray-400 hover:text-white shrink-0 hidden md:block bg-[#0F1117] pl-3 border-l border-[#1e2330] z-10"
        >
          <RefreshCcw className="h-3.5 w-3.5" />
        </button>

      </div>
    </div>
  );
};
