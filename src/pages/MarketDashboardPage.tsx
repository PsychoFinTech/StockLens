import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/apiClient.js';
import { getCountryFlagUrl, getExchangeBadge } from '../utils/symbolHelper.js';
import { formatPrice, formatPercentChange } from '../utils/formatters.js';
import { 
  LineChart, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, 
  Layers, Zap, Award, AlertCircle, RefreshCw 
} from 'lucide-react';

interface Mover {
  symbol: string;
  name: string;
  exchange: string;
  price: number;
  change_pct: number;
}

interface MoversResp {
  gainers: Mover[];
  losers: Mover[];
  highs_52w: Mover[];
  lows_52w: Mover[];
}

interface IndexQuote {
  name: string;
  symbol: string;
  price: number;
  change: number;
  change_pct: number;
}

interface SectorStat {
  name: string;
  proxy: string;
  performance: number;
}

export const MarketDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // 1. Fetch indices quotes
  const { data: indices, isPending: isIndicesPending } = useQuery<IndexQuote[]>({
    queryKey: ['marketIndicesMain'],
    queryFn: async () => {
      const resp = await apiClient.get('/market/indices');
      return resp.data || [];
    }
  });

  // 2. Fetch movers
  const { data: movers, isPending: isMoversPending, refetch: refetchMovers } = useQuery<MoversResp>({
    queryKey: ['marketMovers'],
    queryFn: async () => {
      const resp = await apiClient.get('/market/movers');
      return resp.data;
    }
  });

  // 3. Fetch sectors
  const { data: sectors, isPending: isSectorsPending } = useQuery<SectorStat[]>({
    queryKey: ['sectorPerformanceMain'],
    queryFn: async () => {
      const resp = await apiClient.get('/market/sectors');
      return resp.data || [];
    }
  });

  const handleStockClick = (symbol: string) => {
    navigate(`/company/${encodeURIComponent(symbol.toUpperCase())}`);
  };

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
          onClick={() => { refetchMovers(); }}
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

      {/* 3. Top Movers Split Panels (Gainers & Losers) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Top Gainers Tabular Widget */}
        <div className="space-y-4 bg-white border border-gray-200/90 rounded-2xl p-5 shadow-3xs">
          <div className="flex items-center gap-2 border-b border-gray-150 pb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-650">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
            <h3 className="font-sans font-bold text-gray-950 text-base">Top Gainers</h3>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-md uppercase ml-auto">
              Bullish Leaders
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {isMoversPending ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="py-3 flex justify-between items-center animate-pulse">
                  <div className="h-4 w-28 bg-gray-100 rounded" />
                  <div className="h-4 w-16 bg-gray-100 rounded" />
                </div>
              ))
            ) : (
              movers?.gainers.map((g) => (
                <button
                  key={g.symbol}
                  onClick={() => handleStockClick(g.symbol)}
                  className="w-full py-3 flex items-center justify-between hover:bg-emerald-50/20 px-2 rounded-lg transition-colors group text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={getCountryFlagUrl(g.exchange)}
                      alt="Exchange flag"
                      className="h-3 w-4 rounded-sm shrink-0 object-cover shadow-3xs"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <div className="font-mono font-bold text-sm text-gray-950 group-hover:text-emerald-750 transition-colors">
                        {g.symbol}
                      </div>
                      <div className="text-xs text-gray-400 font-semibold truncate max-w-[120px] sm:max-w-xs mt-0.5">
                        {g.name}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-sm text-gray-955">
                      {formatPrice(g.price, g.exchange)}
                    </div>
                    <div className="font-mono text-xs text-emerald-600 font-extrabold flex items-center justify-end gap-0.5 mt-0.5">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      <span>{formatPercentChange(g.change_pct)}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Top Losers Tabular Widget */}
        <div className="space-y-4 bg-white border border-gray-200/90 rounded-2xl p-5 shadow-3xs">
          <div className="flex items-center gap-2 border-b border-gray-150 pb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-650">
              <TrendingDown className="h-4.5 w-4.5" />
            </div>
            <h3 className="font-sans font-bold text-gray-950 text-base">Top Losers</h3>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded-md uppercase ml-auto">
              Bearish Drag
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {isMoversPending ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="py-3 flex justify-between items-center animate-pulse">
                  <div className="h-4 w-28 bg-gray-100 rounded" />
                  <div className="h-4 w-16 bg-gray-100 rounded" />
                </div>
              ))
            ) : (
              movers?.losers.map((l) => (
                <button
                  key={l.symbol}
                  onClick={() => handleStockClick(l.symbol)}
                  className="w-full py-3 flex items-center justify-between hover:bg-rose-50/10 px-2 rounded-lg transition-colors group text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={getCountryFlagUrl(l.exchange)}
                      alt="Exchange flag"
                      className="h-3 w-4 rounded-sm shrink-0 object-cover shadow-3xs"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <div className="font-mono font-bold text-sm text-gray-950 group-hover:text-rose-750 transition-colors">
                        {l.symbol}
                      </div>
                      <div className="text-xs text-gray-400 font-semibold truncate max-w-[120px] sm:max-w-xs mt-0.5">
                        {l.name}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-sm text-gray-955">
                      {formatPrice(l.price, l.exchange)}
                    </div>
                    <div className="font-mono text-xs text-rose-600 font-extrabold flex items-center justify-end gap-0.5 mt-0.5">
                      <ArrowDownRight className="h-3.5 w-3.5" />
                      <span>{formatPercentChange(l.change_pct)}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

      </div>

      {/* 4. 52-Week Breakout Channels Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
        {/* 52W Breakout Highs */}
        <div className="space-y-4 bg-white border border-gray-200/90 rounded-2xl p-5 shadow-3xs">
          <div className="flex items-center gap-2 border-b border-gray-150 pb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Award className="h-4.5 w-4.5" />
            </div>
            <h3 className="font-sans font-bold text-gray-950 text-base">52-Week Breakouts (Highs)</h3>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-amber-50 text-amber-750 rounded uppercase ml-auto">
              Resistance Clear
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {isMoversPending ? (
              [1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-gray-50 rounded" />)
            ) : movers?.highs_52w.length === 0 ? (
              <div className="col-span-2 text-center text-xs text-gray-400 py-6 font-mono">
                No active 52W resistance breakouts
              </div>
            ) : (
              movers?.highs_52w.map(h => (
                <button
                  key={h.symbol}
                  onClick={() => handleStockClick(h.symbol)}
                  className="p-3 border border-gray-150 rounded-xl hover:border-amber-450 bg-white text-left transition-all hover:bg-amber-50/10 flex justify-between items-center group"
                >
                  <div className="min-w-0">
                    <div className="font-mono font-bold text-sm text-gray-950 group-hover:text-amber-700">
                      {h.symbol}
                    </div>
                    <div className="text-[11px] text-gray-400 font-semibold truncate max-w-[100px]">
                      {h.name}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs font-bold text-gray-900 block">
                      {formatPrice(h.price, h.exchange)}
                    </span>
                    <span className="font-mono text-[10px] text-emerald-600 font-extrabold">
                      +{h.change_pct.toFixed(2)}%
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* 52W Breakout Lows */}
        <div className="space-y-4 bg-white border border-gray-200/90 rounded-2xl p-5 shadow-3xs">
          <div className="flex items-center gap-2 border-b border-gray-150 pb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-650">
              <AlertCircle className="h-4.5 w-4.5" />
            </div>
            <h3 className="font-sans font-bold text-gray-950 text-base">52-Week Breakdown (Lows)</h3>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded uppercase ml-auto">
              Support Breach
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {isMoversPending ? (
              [1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-gray-50 rounded" />)
            ) : movers?.lows_52w.length === 0 ? (
              <div className="col-span-2 text-center text-xs text-gray-400 py-6 font-mono">
                No active 52W breakdown support breach
              </div>
            ) : (
              movers?.lows_52w.map(l => (
                <button
                  key={l.symbol}
                  onClick={() => handleStockClick(l.symbol)}
                  className="p-3 border border-gray-150 rounded-xl hover:border-indigo-400 bg-white text-left transition-all hover:bg-neutral-50/30 flex justify-between items-center group"
                >
                  <div className="min-w-0">
                    <div className="font-mono font-bold text-sm text-gray-950 group-hover:text-indigo-750">
                      {l.symbol}
                    </div>
                    <div className="text-[11px] text-gray-400 font-semibold truncate max-w-[100px]">
                      {l.name}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs font-bold text-gray-900 block">
                      {formatPrice(l.price, l.exchange)}
                    </span>
                    <span className="font-mono text-[10px] text-rose-600 font-extrabold">
                      {l.change_pct.toFixed(2)}%
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
