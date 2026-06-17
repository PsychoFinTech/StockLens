import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import apiClient from '../utils/apiClient.js';
import { StockCard } from '../components/StockCard.jsx';
import { CardSkeleton } from '../components/Skeleton.jsx';
import { Star, Newspaper, Plus, Sparkles, Building, Briefcase, ExternalLink } from 'lucide-react';
import { formatDate } from '../utils/formatters.js';

interface WatchItem {
  symbol: string;
  name: string;
  exchange: string;
  price: number | null;
  change: number;
  change_pct: number;
}

interface NewsItem {
  id: string;
  headline: string;
  source: string;
  summary: string;
  url: string;
  datetime: number;
  image?: string;
}

// Suggested starting stocks to let users seed their watchlists instantly
const SUGGESTED_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ' },
  { symbol: 'TSLA', name: 'Tesla, Inc.', exchange: 'NASDAQ' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ' },
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries', exchange: 'NSE' }
];

export const WatchlistPage: React.FC = () => {
  const queryClient = useQueryClient();

  // 1. Fetch user watchlist
  const { data: watchlist, isPending: isWatchPending } = useQuery<WatchItem[]>({
    queryKey: ['watchlist'],
    queryFn: async () => {
      const resp = await apiClient.get('/watchlist');
      return resp.data || [];
    }
  });

  // 2. Fetch global market news
  const { data: news, isPending: isNewsPending } = useQuery<NewsItem[]>({
    queryKey: ['marketNews'],
    queryFn: async () => {
      const resp = await apiClient.get('/news/market');
      return (resp.data || []).slice(0, 6); // Limit to top 6 news items for beautiful layout
    },
    refetchInterval: 180000 // refresh news every 3 minutes
  });

  // 3. Mutator to add stock instantly
  const addStockMutation = useMutation({
    mutationFn: async (symbol: string) => {
      await apiClient.post('/watchlist/add', { symbol });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    }
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* 1. Dashboard Jumbotron Intro */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50/50 via-teal-50/20 to-white p-6 sm:p-8 shadow-3xs">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-250 text-emerald-800 font-mono text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="h-3 w-3" />
            <span>Active Financial Analysis Engine</span>
          </div>
          <h1 className="font-sans text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
            Welcome to <span className="text-emerald-600">StockLens</span>
          </h1>
          <p className="font-sans text-sm sm:text-base text-gray-500 leading-relaxed max-w-lg">
            Track and analyze over 200+ global and Indian equities using high-fidelity historical candle charts, financial profiles, key ratios, and peers mapping.
          </p>
        </div>
        
        {/* Decorative corner graphics */}
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 hidden md:block select-none pointer-events-none">
          <svg className="w-full h-full text-emerald-400" viewBox="0 0 100 100" fill="none" preserveAspectRatio="none">
            <path d="M0,100 L50,40 L70,60 L100,0 L100,100 Z" fill="currentColor" />
          </svg>
        </div>
      </div>

      {/* 2. Main Two-Column Hub Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Watchlist Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2">
              <Star className="h-5.5 w-5.5 text-amber-500 fill-current" />
              <h2 className="font-sans text-xl font-bold text-gray-900 tracking-tight">Your Saved Watchlist</h2>
            </div>
            
            <Link 
              to="/screener" 
              className="font-sans text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              Browse Screener →
            </Link>
          </div>

          {isWatchPending ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 4, 3].map((idx) => (
                <CardSkeleton key={idx} />
              ))}
            </div>
          ) : watchlist && watchlist.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {watchlist.map((stock) => (
                <StockCard
                  key={stock.symbol}
                  symbol={stock.symbol}
                  name={stock.name}
                  exchange={stock.exchange}
                  price={stock.price ?? undefined}
                  change={stock.change}
                  change_pct={stock.change_pct}
                  isStarred={true}
                />
              ))}
            </div>
          ) : (
            /* Watchlist Empty Active State */
            <div className="border border-dashed border-gray-200 rounded-2xl p-8 sm:p-12 text-center bg-gray-50/30">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Star className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-sans text-base font-bold text-gray-900">Watchlist is currently empty</h3>
              <p className="mt-1 font-sans text-xs text-gray-500 max-w-sm mx-auto">
                Build your personal investment monitor board. Search a stock, or tap one of these popular tickers below to get started instantly:
              </p>
              
              {/* Seeding suggestions layout */}
              <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                {SUGGESTED_STOCKS.map((s) => (
                  <button
                    key={s.symbol}
                    onClick={() => addStockMutation.mutate(s.symbol)}
                    disabled={addStockMutation.isPending}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all shadow-3xs"
                  >
                    <Plus className="h-3 w-3 text-emerald-600" />
                    <span>{s.symbol}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Column: Immersive Financial Hub News */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
            <Newspaper className="h-5.5 w-5.5 text-emerald-600" />
            <h2 className="font-sans text-xl font-bold text-gray-900 tracking-tight">Market Bulletins</h2>
          </div>

          <div className="space-y-4">
            {isNewsPending ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="border-b border-gray-100 pb-4 last:border-0 space-y-2 animate-pulse">
                  <div className="h-3 w-28 bg-gray-200 rounded" />
                  <div className="h-4 w-full bg-gray-200 rounded" />
                  <div className="h-3.5 w-5/6 bg-gray-200 rounded" />
                </div>
              ))
            ) : news && news.length > 0 ? (
              news.map((item) => (
                <article key={item.id} className="border-b border-gray-150/60 pb-4 last:border-0 last:pb-0 group">
                  <div className="flex justify-between items-baseline gap-2 mb-1">
                    <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-150 px-1.5 py-0.5 rounded uppercase tracking-wide">
                      {item.source || 'BULLETIN'}
                    </span>
                    <span className="font-mono text-[10px] text-gray-400">
                      {formatDate(item.datetime * 1000)}
                    </span>
                  </div>

                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block group-hover:text-emerald-600 focus:text-emerald-700 outline-none"
                  >
                    <h3 className="font-sans font-bold text-[13.5px] leading-snug text-gray-900 group-hover:underline flex items-start gap-1">
                      <span>{item.headline}</span>
                      <ExternalLink className="h-3 w-3 shrink-0 text-gray-400 group-hover:text-emerald-500 inline-block mt-0.5" />
                    </h3>
                  </a>
                  
                  {item.summary && (
                    <p className="font-sans text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                      {item.summary}
                    </p>
                  )}
                </article>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 border border-dashed border-gray-150 rounded-xl bg-gray-50/50">
                <p className="font-sans text-sm">Bulletins feed temporarily offline</p>
                <p className="font-mono text-xs mt-1">Please try again shortly</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
