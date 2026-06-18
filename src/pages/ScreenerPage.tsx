import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/apiClient.js';
import { Table, Column } from '../components/Table.jsx';
import { getCountryFlagUrl, getExchangeBadge } from '../utils/symbolHelper.js';
import { formatPrice, formatPercentChange, formatMarketCap } from '../utils/formatters.js';
import { Search, Filter, Layers, ChevronLeft, ChevronRight, X, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

interface ScreenerStock {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  industry: string;
  country: string;
  price: number | null;
  change_pct: number;
  market_cap: number;
}

interface SectorStat {
  name: string;
  proxy: string;
  performance: number;
}

export const ScreenerPage: React.FC = () => {
  const navigate = useNavigate();

  // state variables for filtering and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExchange, setSelectedExchange] = useState('ALL');
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [sortBy, setSortBy] = useState('market_cap');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const itemsPerPage = 20; // Matches backend default limit

  // 1. Fetch Sector Stats for Heatmap
  const { data: sectorSummary, isPending: isSectorPending } = useQuery<SectorStat[]>({
    queryKey: ['marketSectors'],
    queryFn: async () => {
      const resp = await apiClient.get('/market/sectors');
      return resp.data || [];
    }
  });

  // 2. Fetch Filtered Stocks from `/api/screener`
  const { data: sData, isPending: isScreenerPending, refetch } = useQuery<{
    results: ScreenerStock[];
    total: number;
    page: number;
    totalPages: number;
  }>({
    queryKey: ['screener', searchQuery, selectedExchange, selectedSector, sortBy, sortOrder, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        exchange: selectedExchange,
        sector: selectedSector,
        sortBy,
        sortOrder,
        page: page.toString(),
        limit: itemsPerPage.toString()
      });
      // Append text search optionally
      if (searchQuery.trim()) {
        params.append('q', searchQuery);
      }
      const resp = await apiClient.get(`/screener?${params.toString()}`);
      return resp.data;
    },
    placeholderData: (previousData) => previousData
  });

  // Handle manual sorting updates trigger from table columns clicking
  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('desc'); // default desc for metric rankings
    }
    setPage(1); // reset on sorting change
  };

  const handleSectorCardClick = (sector: string) => {
    if (selectedSector === sector) {
      setSelectedSector('ALL'); // untoggle
    } else {
      setSelectedSector(sector);
    }
    setPage(1);
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedExchange('ALL');
    setSelectedSector('ALL');
    setSortBy('market_cap');
    setSortOrder('desc');
    setPage(1);
  };

  // Setup Column specifications for reusable data Table matches
  const columns: Column<ScreenerStock>[] = [
    {
      key: 'symbol',
      label: 'Equities Symbol',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <img
            src={getCountryFlagUrl(row.exchange)}
            alt="Flag"
            referrerPolicy="no-referrer"
            className="h-3 w-4 rounded-sm object-cover shrink-0 shadow-3xs"
          />
          <div className="flex flex-col">
            <span className="font-mono font-bold text-gray-950 group-hover:text-emerald-600 transition-colors">
              {row.symbol}
            </span>
            <span className="text-[10px] font-mono text-gray-400 font-semibold uppercase -mt-0.5">
              {getExchangeBadge(row.exchange)}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'name',
      label: 'Company Name',
      sortable: true,
      render: (row) => (
        <div className="font-sans font-semibold text-gray-950 max-w-[180px] sm:max-w-xs truncate">
          {row.name}
        </div>
      )
    },
    {
      key: 'sector',
      label: 'Sector Category',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-50 text-gray-650 border border-gray-150">
          {row.sector}
        </span>
      )
    },
    {
      key: 'price',
      label: 'Last Price',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-gray-950">
          {formatPrice(row.price, row.exchange)}
        </span>
      )
    },
    {
      key: 'change_pct',
      label: 'Market Change',
      align: 'right',
      sortable: true,
      render: (row) => {
        const isUp = (row.change_pct ?? 0) >= 0;
        return (
          <span className={`inline-flex items-center gap-0.5 font-mono text-xs font-bold px-1.5 py-0.5 rounded ${
            isUp ? 'text-emerald-700 bg-emerald-50 border border-emerald-150' : 'text-rose-700 bg-rose-50 border border-rose-150'
          }`}>
            {isUp ? '+' : ''}{formatPercentChange(row.change_pct)}
          </span>
        );
      }
    },
    {
      key: 'market_cap',
      label: 'Market Capitalization',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs text-gray-650 font-bold">
          {formatMarketCap(row.market_cap, row.exchange)}
        </span>
      )
    }
  ];

  const stocks = sData?.results || [];
  const total = sData?.total || 0;
  const totalPages = sData?.totalPages || 1;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Page Title Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Layers className="h-6 w-6 text-emerald-600 animate-pulse" />
          <h1 className="font-sans text-2xl font-black text-gray-900 tracking-tight">Equities Stock Screener</h1>
        </div>
        <p className="font-sans text-xs sm:text-sm text-gray-500 max-w-2xl">
          Instantly filter through our seeded S&P 500 and popular global equities.
        </p>
      </div>

      {/* 1. Sector Heatmap Widget Grid (Actions Toggle) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <h3 className="font-sans text-sm font-bold text-gray-950 flex items-center gap-1.5">
            <span>Market Sector Heatmap</span>
            <span className="text-[10px] font-mono text-gray-400 font-semibold normal-case">
              (Tap card to filter stock table)
            </span>
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {isSectorPending ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-gray-100 animate-pulse" />
            ))
          ) : (
            sectorSummary?.map((s) => {
              const isSelected = selectedSector === s.name;
              const isUp = s.performance >= 0;
              return (
                <button
                  key={s.name}
                  onClick={() => handleSectorCardClick(s.name)}
                  className={`p-5 rounded-2xl border text-left transition-all ${
                    isSelected 
                      ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20' 
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  <div className="font-sans font-bold text-lg text-gray-950 truncate">
                    {s.name}
                  </div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="font-mono text-xs font-bold text-gray-400">
                      {s.proxy}
                    </span>
                    <span className={`font-mono text-base font-black ml-auto ${
                      isUp ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {isUp ? '+' : ''}{s.performance.toFixed(2)}%
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Advanced Search & Category Filters Panel */}
      <div className="border border-gray-200 bg-white p-4 sm:p-5 rounded-xl shadow-3xs flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch justify-between">
          
          {/* Text search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Search ticker symbol or company name..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-4 text-xs font-semibold placeholder-gray-400 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center">
            {/* Exchange Filter Selector */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <Filter className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <select
                value={selectedExchange}
                onChange={(e) => { setSelectedExchange(e.target.value); setPage(1); }}
                className="w-full sm:w-auto rounded-lg border border-gray-200 bg-gray-50/50 p-2 text-xs font-semibold outline-none focus:border-emerald-500 focus:bg-white cursor-pointer"
              >
                <option value="ALL">All Exchanges</option>
                <option value="NASDAQ">NASDAQ (US)</option>
                <option value="NYSE">NYSE (US)</option>
                <option value="NSE">NSE (India)</option>
                <option value="LSE">London Stock Exchange (LSE)</option>
                <option value="XETRA">XETRA (Germany)</option>
                <option value="TSE">Tokyo Stock Exchange (TSE)</option>
              </select>
            </div>

            {/* Custom reset all trigger if filters are dirty */}
            {(searchQuery || selectedExchange !== 'ALL' || selectedSector !== 'ALL') && (
              <button
                onClick={resetAllFilters}
                className="flex items-center gap-1 justify-center px-4 py-2 border border-dashed border-emerald-500 text-emerald-800 bg-emerald-50/30 rounded-lg text-xs font-semibold hover:bg-emerald-50 transition-colors w-full sm:w-auto"
              >
                <X className="h-3.5 w-3.5" />
                <span>Clear Filters</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* 3. Main Screener Results Table Container */}
      <div className="space-y-4">
        <Table<ScreenerStock>
          columns={columns}
          data={stocks}
          isPending={isScreenerPending}
          sortKey={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onRowClick={(row) => navigate(`/company/${encodeURIComponent(row.symbol.toUpperCase())}`)}
        />

        {/* 4. Elegant Pagination Controls & Rows Stats */}
        {!isScreenerPending && total > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-gray-100 pt-4">
            <span className="font-mono text-xs text-gray-500">
              Showing <span className="font-bold text-gray-900">{Math.min((page - 1) * itemsPerPage + 1, total)}</span> to <span className="font-bold text-gray-900">{Math.min(page * itemsPerPage, total)}</span> of <span className="font-bold text-gray-900">{total}</span> Equities
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-gray-700" />
              </button>

              <div className="flex items-center gap-1 font-sans text-xs">
                {Array.from({ length: totalPages }).map((_, pIdx) => {
                  const pNum = pIdx + 1;
                  // Only show current, first, last, and immediate sister pages to avoid slider bloat
                  if (pNum === 1 || pNum === totalPages || Math.abs(pNum - page) <= 1) {
                    return (
                      <button
                        key={pNum}
                        onClick={() => setPage(pNum)}
                        className={`h-7 w-7 rounded-md font-semibold transition-colors ${
                          page === pNum
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'border border-gray-150 bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {pNum}
                      </button>
                    );
                  }
                  if (pNum === 2 || pNum === totalPages - 1) {
                    return <span key={pNum} className="px-1 text-gray-400">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-1.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-gray-700" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
