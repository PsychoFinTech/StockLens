import React from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../utils/apiClient.js';
import { Star, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { getCountryFlagUrl, getExchangeBadge } from '../utils/symbolHelper.js';
import { formatPrice, formatPercentChange } from '../utils/formatters.js';
import { usePrefetchCompany } from '../hooks/usePrefetchCompany.js';

interface StockCardProps {
  symbol: string;
  name: string;
  exchange: string;
  price?: number;
  change?: number;
  change_pct?: number;
  isStarred?: boolean;
}

export const StockCard: React.FC<StockCardProps> = ({
  symbol,
  name,
  exchange,
  price,
  change,
  change_pct,
  isStarred = false
}) => {
  const queryClient = useQueryClient();
  const prefetch = usePrefetchCompany();

  // Watchlist Star mutations
  const toggleStar = useMutation({
    mutationFn: async () => {
      if (isStarred) {
        return await apiClient.delete(`/watchlist/${encodeURIComponent(symbol)}`);
      } else {
        return await apiClient.post('/watchlist/add', { symbol });
      }
    },
    onSuccess: () => {
      // Invalidate both user watchlists & global query caches
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      queryClient.invalidateQueries({ queryKey: ['watchlistStatus', symbol] });
    }
  });

  const isUp = (change ?? 0) >= 0;

  return (
    <div
      className="group relative border border-white/50 bg-white/95 backdrop-blur-xl rounded-3xl p-5 shadow-xl shadow-blue-500/5 transition-all duration-300 hover:border-white hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-2 flex flex-col justify-between h-44"
      onMouseEnter={() => prefetch(symbol)}
      onFocus={() => prefetch(symbol)}
    >
      {/* Upper info section */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={getCountryFlagUrl(exchange)}
              alt="Exchange flag"
              className="h-3 w-4 rounded-sm shrink-0 object-cover shadow-3xs"
              referrerPolicy="no-referrer"
            />
            <span className="text-[10px] font-sans font-bold text-gray-400 uppercase tracking-wide">
              {getExchangeBadge(exchange)}
            </span>
          </div>

          {/* Star watchlist button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleStar.mutate();
            }}
            disabled={toggleStar.isPending}
            className={`p-1.5 rounded-lg border transition-all ${
              isStarred
                ? 'bg-amber-50 border-amber-200 text-amber-500 hover:bg-amber-100/70'
                : 'bg-gray-50 border-gray-150 text-gray-400 hover:text-gray-600 hover:bg-gray-100/80'
            }`}
            title={isStarred ? 'Remove from Watchlist' : 'Add to Watchlist'}
          >
            <Star className={`h-3.5 w-3.5 ${isStarred ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Ticker & Full Name Link */}
        <Link 
          to={`/company/${encodeURIComponent(symbol)}`}
          className="block mt-2.5 min-w-0"
        >
          <div className="flex items-baseline gap-2">
            <h3 className="font-mono font-bold text-lg text-gray-900 group-hover:text-emerald-600 transition-colors tracking-tight">
              {symbol}
            </h3>
            <span className="truncate text-xs text-gray-400 font-medium max-w-[120px] sm:max-w-none">
              {name}
            </span>
          </div>
        </Link>
      </div>

      {/* Pricing block */}
      <div className="pt-3 border-t border-gray-50 flex items-end justify-between">
        <div>
          <div className="font-mono font-bold text-xl text-gray-950">
            {formatPrice(price, exchange)}
          </div>
          <div className={`flex items-center gap-1 font-mono text-[12px] font-bold mt-0.5 ${
            isUp ? 'text-emerald-600' : 'text-rose-600'
          }`}>
            {isUp ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            <span>{formatPercentChange(change_pct)}</span>
          </div>
        </div>

        {/* Detailed direct navigation action button */}
        <Link
          to={`/company/${encodeURIComponent(symbol)}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-emerald-50 hover:text-emerald-700 transition-colors border border-gray-150"
        >
          <Eye className="h-3.5 w-3.5" />
          <span>Analyze</span>
        </Link>
      </div>
    </div>
  );
};
