import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/apiClient.js';
import { Search, Globe, Command, Loader2 } from 'lucide-react';
import { getCountryFlagUrl, getExchangeBadge } from '../utils/symbolHelper.js';

interface SearchResult {
  symbol: string;
  description: string;
  displaySymbol: string;
  type: string;
  exchange: string;
  country: string;
  isLocal: boolean;
}

interface SearchBarProps {
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ placeholder = 'Search tickers...' }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce dynamically
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const resp = await apiClient.get<SearchResult[]>(`/search?q=${encodeURIComponent(query)}`);
        setResults(resp.data || []);
        setIsOpen(true);
      } catch (err) {
        console.error('[SEARCH COMPONENT ERROR]', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (symbol: string) => {
    setQuery('');
    setIsOpen(false);
    navigate(`/company/${encodeURIComponent(symbol.toUpperCase())}`);
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      {/* Search Input Container */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setIsOpen(true)}
          placeholder={placeholder}
          id="global-stock-search"
          className="w-full rounded-lg border border-gray-200/80 bg-gray-50/50 py-2 pl-10 pr-10 text-sm placeholder-gray-400 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/15"
        />
        <div className="absolute right-3.5 top-2 ml-1 items-center flex gap-1 pointer-events-none">
          {isSearching ? (
            <Loader2 className="h-4.5 w-4.5 animate-spin text-gray-400" />
          ) : (
            <div className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-gray-150 bg-white shadow-3xs text-[10px] text-gray-400 font-mono">
              <Command className="h-2.5 w-2.5" />
              <span>K</span>
            </div>
          )}
        </div>
      </div>

      {/* Autocomplete Results Grid */}
      {isOpen && (
        <div className="absolute right-0 top-11 z-50 w-full min-w-[310px] max-h-[380px] overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-xl animate-in fade-in-50 slide-in-from-top-2 duration-150">
          
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="font-sans text-sm text-gray-500 font-medium">No equities found query</p>
              <p className="font-mono text-xs text-gray-400 mt-1">Try "AAPL", "TCS", "REL" or "Shell"</p>
            </div>
          ) : (
            <div>
              <div className="px-3 py-1 text-[10px] font-mono tracking-wider text-gray-400 uppercase font-semibold border-b border-gray-55 pb-1.5 mb-1.5 flex justify-between items-center">
                <span>Autocomplete matches </span>
                <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold">
                  {results.filter(r => r.isLocal).length} Seeded
                </span>
              </div>
              <div className="space-y-0.5">
                {results.map((item) => (
                  <button
                    key={item.symbol}
                    onClick={() => handleSelect(item.symbol)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-emerald-50/40 transition-colors focus:bg-emerald-50/40 outline-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Country Flag Badge */}
                      <img
                        src={getCountryFlagUrl(item.exchange)}
                        alt="Flag"
                        referrerPolicy="no-referrer"
                        className="h-3 w-4 rounded-sm shrink-0 shadow-3xs object-cover"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[13px] text-gray-900 group-hover:text-emerald-600">
                            {item.displaySymbol || item.symbol}
                          </span>
                          <span className="text-[10px] font-sans font-semibold text-gray-400 px-1 bg-gray-100/90 rounded border border-gray-150">
                            {getExchangeBadge(item.exchange)}
                          </span>
                        </div>
                        <p className="truncate text-xs text-gray-500 font-medium mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Source marker tag */}
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <span className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                        item.isLocal 
                          ? 'bg-amber-50 text-amber-700 border border-amber-150' 
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-150'
                      }`}>
                        {item.isLocal ? 'Seeded' : 'Global'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
