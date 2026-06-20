import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/apiClient.js';
import { Table, Column } from '../components/Table.jsx';
import { getCountryFlagUrl, getExchangeBadge } from '../utils/symbolHelper.js';
import { formatPrice, formatPercentChange, formatMarketCap } from '../utils/formatters.js';
import {
  ChevronRight,
  Search,
  X,
  RotateCcw,
  Star,
  Percent,
  Wallet,
  ChevronLeft,
  Layers,
  Filter,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react';

// ----------------------------------------------------------------------------
// 1. DATA MODEL & TYPES FOR FILTER REGISTRY
// ----------------------------------------------------------------------------

interface ScreenerStock {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  industry: string;
  country: string;
  price: number | null;
  change_pct: number | null;
  market_cap: number | null;
  pe: number | null;
  roe: number | null;
  debt_equity: number | null;
}

interface SectorStat {
  name: string;
  proxy: string;
  performance: number;
}

type MetricType = 'categorical' | 'numeric';

interface PresetRange {
  id: string;
  label: string;
}

interface Metric {
  id: string;
  name: string;
  category: string;
  description: string;
  type: MetricType;
  unit?: string; // e.g. '%', '$', 'x'
  placeholder?: string;
  presets?: PresetRange[];
  options?: string[]; // for categorical fields
}

type Operator = 'more' | 'less' | 'equal' | 'between';

interface NumericFilterValue {
  kind: 'numeric';
  preset?: string;
  custom?: {
    operator: Operator;
    value1: string;
    value2: string;
  };
}

interface CategoricalFilterValue {
  kind: 'categorical';
  selected: string[];
}

type FilterValue = NumericFilterValue | CategoricalFilterValue;
type FilterState = Record<string, FilterValue>;

const CATEGORIES = ['Popular', 'Valuation', 'Ratios'] as const;

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Popular: Star,
  Valuation: Wallet,
  Ratios: Percent,
};

const METRIC_REGISTRY: Metric[] = [
  // --- Popular ---------------------------------------------------------
  {
    id: 'market_cap',
    name: 'Market Cap',
    category: 'Popular',
    description: 'Total market value of a company\'s outstanding shares.',
    type: 'numeric',
    unit: '$',
    placeholder: 'e.g. 10B',
    presets: [
      { id: 'small', label: 'Small Cap (Under $2B)' },
      { id: 'mid', label: 'Mid Cap ($2B - $10B)' },
      { id: 'large', label: 'Large Cap ($10B - $200B)' },
      { id: 'mega', label: 'Mega Cap (Above $200B)' },
    ],
  },
  {
    id: 'exchange',
    name: 'Exchange',
    category: 'Popular',
    description: 'The stock exchange a security is primarily listed on.',
    type: 'categorical',
    options: ['NASDAQ', 'NYSE', 'NSE', 'LSE', 'XETRA', 'TSE'],
  },
  {
    id: 'sector',
    name: 'Sector',
    category: 'Popular',
    description: 'The broad industry sector a company is classified under.',
    type: 'categorical',
    options: [
      'Technology',
      'Healthcare',
      'Financial Services',
      'Consumer Cyclical',
      'Industrials',
      'Energy',
      'Utilities',
      'Real Estate',
      'Communication Services',
      'Basic Materials',
    ],
  },

  // --- Valuation ---------------------------------------------------------
  {
    id: 'trailing_pe',
    name: 'Trailing P/E',
    category: 'Valuation',
    description: 'P/E ratio using earnings from the last 12 months.',
    type: 'numeric',
    unit: 'x',
    placeholder: 'e.g. 20',
    presets: [
      { id: 'below0', label: 'Below 0' },
      { id: '0to20', label: '0 to 20' },
      { id: '20to50', label: '20 to 50' },
      { id: '50to80', label: '50 to 80' },
      { id: 'above80', label: 'Above 80' },
    ],
  },

  // --- Ratios ---------------------------------------------------------
  {
    id: 'roe',
    name: 'Return on Equity (ROE)',
    category: 'Ratios',
    description: 'Net income as a percent of shareholders\' equity.',
    type: 'numeric',
    unit: '%',
    placeholder: 'e.g. 15',
    presets: [
      { id: 'below0', label: 'Below 0%' },
      { id: '0to10', label: '0% to 10%' },
      { id: '10to20', label: '10% to 20%' },
      { id: 'above20', label: 'Above 20%' },
    ],
  },
  {
    id: 'debt_equity',
    name: 'Total Debt / Equity',
    category: 'Ratios',
    description: 'Total debt relative to shareholders\' equity.',
    type: 'numeric',
    unit: 'x',
    placeholder: 'e.g. 1',
    presets: [
      { id: 'below0.5', label: 'Below 0.5' },
      { id: '0.5to1', label: '0.5 to 1' },
      { id: '1to2', label: '1 to 2' },
      { id: 'above2', label: 'Above 2' },
    ],
  },
];

// ----------------------------------------------------------------------------
// 2. HELPER UTILITY FUNCTIONS
// ----------------------------------------------------------------------------

function isFilterActive(value: FilterValue | undefined): boolean {
  if (!value) return false;
  if (value.kind === 'categorical') return value.selected.length > 0;
  if (value.preset) return true;
  if (value.custom) {
    const { operator, value1, value2 } = value.custom;
    if (operator === 'between') return value1.trim() !== '' || value2.trim() !== '';
    return value1.trim() !== '';
  }
  return false;
}

function summarizeFilter(metric: Metric, value: FilterValue | undefined): string | null {
  if (!isFilterActive(value)) return null;
  if (!value) return null;
  if (value.kind === 'categorical') {
    if (value.selected.length === 1) return value.selected[0];
    return `${value.selected.length} selected`;
  }
  if (value.preset) {
    const preset = metric.presets?.find((p) => p.id === value.preset);
    return preset?.label ?? null;
  }
  if (value.custom) {
    const { operator, value1, value2 } = value.custom;
    const u = metric.unit === '%' ? '%' : '';
    const prefix = metric.unit === '$' ? '$' : '';
    if (operator === 'between') return `${prefix}${value1}${u} \u2013 ${prefix}${value2}${u}`;
    const opLabel = operator === 'more' ? '>' : operator === 'less' ? '<' : '=';
    return `${opLabel} ${prefix}${value1}${u}`;
  }
  return null;
}

const OPERATORS: { id: Operator; label: string }[] = [
  { id: 'more', label: 'More than' },
  { id: 'less', label: 'Less than' },
  { id: 'equal', label: 'Equal' },
  { id: 'between', label: 'Between' },
];

function parseAbbreviatedNumber(valStr: string): number | null {
  const clean = valStr.toUpperCase().trim();
  if (!clean) return null;
  const num = parseFloat(clean);
  if (isNaN(num)) return null;
  if (clean.endsWith('B')) return num * 1000; // in millions
  if (clean.endsWith('M')) return num;
  if (clean.endsWith('T')) return num * 1000000;
  if (clean.endsWith('K')) return num / 1000;
  return num; // assume already in millions or simple number
}

function getApiParamsFromFilters(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams();

  // Exchange
  const exchangeVal = filters['exchange'] as CategoricalFilterValue | undefined;
  if (exchangeVal && exchangeVal.selected.length > 0) {
    params.append('exchange', exchangeVal.selected[0]);
  } else {
    params.append('exchange', 'ALL');
  }

  // Sector
  const sectorVal = filters['sector'] as CategoricalFilterValue | undefined;
  if (sectorVal && sectorVal.selected.length > 0) {
    params.append('sector', sectorVal.selected[0]);
  } else {
    params.append('sector', 'ALL');
  }

  // Market Cap
  const mcapVal = filters['market_cap'] as NumericFilterValue | undefined;
  if (mcapVal) {
    if (mcapVal.preset) {
      if (mcapVal.preset === 'small') params.append('maxMcap', '2000');
      else if (mcapVal.preset === 'mid') {
        params.append('minMcap', '2000');
        params.append('maxMcap', '10000');
      } else if (mcapVal.preset === 'large') {
        params.append('minMcap', '10000');
        params.append('maxMcap', '200000');
      } else if (mcapVal.preset === 'mega') params.append('minMcap', '200000');
    } else if (mcapVal.custom) {
      const { operator, value1, value2 } = mcapVal.custom;
      const num1 = parseAbbreviatedNumber(value1);
      const num2 = parseAbbreviatedNumber(value2);
      if (operator === 'more' && num1 !== null) params.append('minMcap', num1.toString());
      else if (operator === 'less' && num1 !== null) params.append('maxMcap', num1.toString());
      else if (operator === 'equal' && num1 !== null) {
        params.append('minMcap', num1.toString());
        params.append('maxMcap', num1.toString());
      } else if (operator === 'between') {
        if (num1 !== null) params.append('minMcap', num1.toString());
        if (num2 !== null) params.append('maxMcap', num2.toString());
      }
    }
  }

  // Trailing PE
  const peVal = filters['trailing_pe'] as NumericFilterValue | undefined;
  if (peVal) {
    if (peVal.preset) {
      if (peVal.preset === 'below0') params.append('maxPe', '0');
      else if (peVal.preset === '0to20') {
        params.append('minPe', '0');
        params.append('maxPe', '20');
      } else if (peVal.preset === '20to50') {
        params.append('minPe', '20');
        params.append('maxPe', '50');
      } else if (peVal.preset === '50to80') {
        params.append('minPe', '50');
        params.append('maxPe', '80');
      } else if (peVal.preset === 'above80') params.append('minPe', '80');
    } else if (peVal.custom) {
      const { operator, value1, value2 } = peVal.custom;
      const num1 = parseFloat(value1);
      const num2 = parseFloat(value2);
      if (operator === 'more' && !isNaN(num1)) params.append('minPe', num1.toString());
      else if (operator === 'less' && !isNaN(num1)) params.append('maxPe', num1.toString());
      else if (operator === 'equal' && !isNaN(num1)) {
        params.append('minPe', num1.toString());
        params.append('maxPe', num1.toString());
      } else if (operator === 'between') {
        if (!isNaN(num1)) params.append('minPe', num1.toString());
        if (!isNaN(num2)) params.append('maxPe', num2.toString());
      }
    }
  }

  // ROE
  const roeVal = filters['roe'] as NumericFilterValue | undefined;
  if (roeVal) {
    if (roeVal.preset) {
      if (roeVal.preset === 'below0') {
        params.append('maxRoe', '0');
      } else if (roeVal.preset === '0to10') {
        params.append('minRoe', '0');
      } else if (roeVal.preset === '10to20') {
        params.append('minRoe', '10');
      } else if (roeVal.preset === 'above20') {
        params.append('minRoe', '20');
      }
    } else if (roeVal.custom) {
      const { operator, value1 } = roeVal.custom;
      const num1 = parseFloat(value1);
      if (operator === 'more' && !isNaN(num1)) params.append('minRoe', num1.toString());
      else if (operator === 'between' && !isNaN(num1)) params.append('minRoe', num1.toString());
    }
  }

  // Debt to Equity
  const deVal = filters['debt_equity'] as NumericFilterValue | undefined;
  if (deVal) {
    if (deVal.preset) {
      if (deVal.preset === 'below0.5') params.append('maxDe', '0.5');
      else if (deVal.preset === '0.5to1') params.append('maxDe', '1.0');
      else if (deVal.preset === '1to2') params.append('maxDe', '2.0');
      else if (deVal.preset === 'above2') {
        params.append('minDe', '2.0');
      }
    } else if (deVal.custom) {
      const { operator, value1 } = deVal.custom;
      const num1 = parseFloat(value1);
      if (operator === 'less' && !isNaN(num1)) params.append('maxDe', num1.toString());
      else if (operator === 'between' && !isNaN(num1)) params.append('maxDe', num1.toString());
    }
  }

  return params;
}

// ----------------------------------------------------------------------------
// 3. MAIN COMPONENT: SCREENER PAGE
// ----------------------------------------------------------------------------

export const ScreenerPage: React.FC = () => {
  const navigate = useNavigate();

  // Advanced filters state
  const [filters, setFilters] = useState<FilterState>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('market_cap');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  // Editor states
  const [activeCategory, setActiveCategory] = useState<string>(CATEGORIES[0]);
  const [activeMetricId, setActiveMetricId] = useState<string>(
    METRIC_REGISTRY.find((m) => m.category === CATEGORIES[0])?.id ?? METRIC_REGISTRY[0].id
  );
  const [customOpen, setCustomOpen] = useState<boolean>(false);
  const [categoricalSearch, setCategoricalSearch] = useState<string>('');

  const activeMetric = useMemo(
    () => METRIC_REGISTRY.find((m) => m.id === activeMetricId)!,
    [activeMetricId]
  );

  const metricsInCategory = useMemo(
    () => METRIC_REGISTRY.filter((m) => m.category === activeCategory),
    [activeCategory]
  );

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter(isFilterActive).length,
    [filters]
  );

  // 1. Fetch Sector Stats for Heatmap
  const { data: sectorSummary, isPending: isSectorPending } = useQuery<SectorStat[]>({
    queryKey: ['marketSectors'],
    queryFn: async () => {
      const resp = await apiClient.get('/market/sectors');
      return resp.data || [];
    }
  });

  // 2. Fetch Filtered Stocks from `/api/screener`
  const { data: sData, isPending: isScreenerPending } = useQuery<{
    results: ScreenerStock[];
    total: number;
    page: number;
    totalPages: number;
  }>({
    queryKey: ['screener', searchQuery, filters, sortBy, sortOrder, page],
    queryFn: async () => {
      const params = getApiParamsFromFilters(filters);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      params.append('page', page.toString());
      params.append('limit', itemsPerPage.toString());

      if (searchQuery.trim()) {
        params.append('q', searchQuery);
      }
      const resp = await apiClient.get(`/screener?${params.toString()}`);
      return resp.data;
    },
    placeholderData: (previousData) => previousData
  });

  // Handle Sector Heatmap card toggle (synced with advanced filters sector)
  const handleSectorCardClick = (sectorName: string) => {
    setFilters((prev) => {
      const current = prev['sector'] as CategoricalFilterValue | undefined;
      const selected = current?.selected ?? [];
      const isSelected = selected.includes(sectorName);
      const next = isSelected ? [] : [sectorName]; // single selection toggle
      return {
        ...prev,
        ['sector']: { kind: 'categorical', selected: next } as CategoricalFilterValue,
      };
    });
    setPage(1);
  };

  const handleSelectCategory = (category: string) => {
    setActiveCategory(category);
    const firstMetric = METRIC_REGISTRY.find((m) => m.category === category);
    if (firstMetric) {
      setActiveMetricId(firstMetric.id);
      setCustomOpen(false);
      setCategoricalSearch('');
    }
  };

  const handleSelectMetric = (metricId: string) => {
    setActiveMetricId(metricId);
    setCustomOpen(false);
    setCategoricalSearch('');
  };

  const updateNumericPreset = (presetId: string) => {
    setFilters((prev) => {
      const current = prev[activeMetricId] as NumericFilterValue | undefined;
      const isSame = current?.preset === presetId;
      return {
        ...prev,
        [activeMetricId]: {
          kind: 'numeric',
          preset: isSame ? undefined : presetId,
          custom: current?.custom,
        },
      };
    });
    setPage(1);
  };

  const updateNumericCustom = (partial: Partial<NumericFilterValue['custom']>) => {
    setFilters((prev) => {
      const current = prev[activeMetricId] as NumericFilterValue | undefined;
      const base = current?.custom ?? { operator: 'more' as Operator, value1: '', value2: '' };
      return {
        ...prev,
        [activeMetricId]: {
          kind: 'numeric',
          preset: undefined,
          custom: { ...base, ...partial },
        },
      };
    });
    setPage(1);
  };

  const toggleCategoricalOption = (option: string) => {
    setFilters((prev) => {
      const current = prev[activeMetricId] as CategoricalFilterValue | undefined;
      const selected = current?.selected ?? [];
      const next = selected.includes(option)
        ? selected.filter((o) => o !== option)
        : [...selected, option];
      return {
        ...prev,
        [activeMetricId]: { kind: 'categorical', selected: next },
      };
    });
    setPage(1);
  };

  const resetAllFilters = () => {
    setFilters({});
    setSearchQuery('');
    setSortBy('market_cap');
    setSortOrder('desc');
    setPage(1);
  };

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const selectedSector = useMemo(() => {
    const sFilter = filters['sector'] as CategoricalFilterValue | undefined;
    return sFilter?.selected?.[0] || 'ALL';
  }, [filters]);

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
            <span className="font-mono font-bold text-gray-955 group-hover:text-emerald-600 transition-colors">
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
        <div className="font-sans font-semibold text-gray-950 max-w-[150px] sm:max-w-xs truncate">
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
      key: 'pe',
      label: 'P/E',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-gray-950">
          {row.pe !== null ? `${row.pe.toFixed(1)}x` : '—'}
        </span>
      )
    },
    {
      key: 'roe',
      label: 'ROE',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-gray-950">
          {row.roe !== null ? `${row.roe.toFixed(1)}%` : '—'}
        </span>
      )
    },
    {
      key: 'debt_equity',
      label: 'D/E',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-gray-950">
          {row.debt_equity !== null ? `${row.debt_equity.toFixed(2)}x` : '—'}
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
      label: 'Market Cap',
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

  const currentValue = filters[activeMetricId];
  const currentNumeric = currentValue?.kind === 'numeric' ? currentValue : undefined;
  const currentCategorical = currentValue?.kind === 'categorical' ? currentValue : undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Page Title Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-6 w-6 text-emerald-600 animate-pulse" />
            <h1 className="font-sans text-2xl font-black text-gray-900 tracking-tight">Equities Stock Screener</h1>
          </div>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-3xs transition-all ${
              showAdvancedFilters
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-white text-gray-705 hover:bg-gray-50 border-gray-200'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>{showAdvancedFilters ? 'Hide Advanced Filters' : 'Show Advanced Filters'}</span>
          </button>
        </div>
        <p className="font-sans text-xs sm:text-sm text-gray-500 max-w-2xl">
          Instantly filter through our seeded S&P 500 and popular global equities.
        </p>
      </div>

      {/* 1. Sector Heatmap Widget Grid (Actions Toggle) - PRESERVED */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <h3 className="font-sans text-sm font-bold text-gray-955 flex items-center gap-1.5">
            <span>Market Sector Heatmap</span>
            <span className="text-[10px] font-mono text-gray-400 font-semibold normal-case">
              (Tap card to filter stock table)
            </span>
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {isSectorPending ? (
            Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
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
                  <div className="font-sans font-bold text-base sm:text-lg text-gray-950 truncate">
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

      {/* 2. Interactive Multi-Factor Filters Builder Panel */}
      {showAdvancedFilters && (
        <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* Filters Builder Title Header */}
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Filter Builder</span>
              <span className="rounded-full bg-emerald-100/70 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                Multi-Factor Screen
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-mono font-bold ${
                  activeFilterCount > 0
                    ? 'bg-emerald-600 text-white animate-bounce'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {activeFilterCount} Active
              </span>
              <button
                onClick={resetAllFilters}
                className="flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-emerald-700 transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                Clear All
              </button>
            </div>
          </div>

          {/* Three Panes Splitter Layout */}
          <div className="flex flex-col md:flex-row h-[320px] overflow-hidden">
            {/* L1: Categories (25%) */}
            <div className="w-full md:w-1/4 border-r border-gray-100 bg-gray-50/40 p-2 overflow-y-auto">
              <nav className="space-y-1">
                {CATEGORIES.map((category) => {
                  const Icon = CATEGORY_ICONS[category];
                  const isActive = category === activeCategory;
                  const countInCategory = METRIC_REGISTRY.filter(
                    (m) => m.category === category && isFilterActive(filters[m.id])
                  ).length;
                  return (
                    <button
                      key={category}
                      onClick={() => handleSelectCategory(category)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-gray-600 hover:bg-gray-100/70'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Icon
                          className={`h-3.5 w-3.5 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}
                        />
                        {category}
                      </span>
                      <span className="flex items-center gap-1">
                        {countInCategory > 0 && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        )}
                        <ChevronRight
                          className={`h-3 w-3 ${isActive ? 'text-emerald-500' : 'text-gray-300'}`}
                        />
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* L2: Metrics (35%) */}
            <div className="w-full md:w-[35%] border-r border-gray-100 p-2 overflow-y-auto">
              <div className="space-y-1">
                {metricsInCategory.map((metric) => {
                  const isActive = metric.id === activeMetricId;
                  const summary = summarizeFilter(metric, filters[metric.id]);
                  return (
                    <button
                      key={metric.id}
                      onClick={() => handleSelectMetric(metric.id)}
                      className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left transition-colors ${
                        isActive ? 'bg-emerald-50/50' : 'hover:bg-gray-50/50'
                      }`}
                    >
                      <div className="min-w-0">
                        <div
                          className={`truncate text-xs ${
                            isActive ? 'font-bold text-emerald-800' : 'font-semibold text-gray-700'
                          }`}
                        >
                          {metric.name}
                        </div>
                        {summary && (
                          <div className="mt-0.5 truncate text-[10px] font-mono font-bold text-emerald-600">
                            {summary}
                          </div>
                        )}
                      </div>
                      <ChevronRight
                        className={`h-3 w-3 flex-shrink-0 ${
                          isActive ? 'text-emerald-500' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* L3: Editors (40%) */}
            <div className="w-full md:w-[40%] bg-white p-4 overflow-y-auto flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-gray-950">{activeMetric.name}</h4>
                <p className="mt-1 text-[11px] leading-relaxed text-gray-400 font-medium">
                  {activeMetric.description}
                </p>
                <div className="mt-3">
                  {activeMetric.type === 'categorical' ? (
                    <CategoricalEditor
                      metric={activeMetric}
                      search={categoricalSearch}
                      onSearchChange={setCategoricalSearch}
                      selected={currentCategorical?.selected ?? []}
                      onToggle={toggleCategoricalOption}
                    />
                  ) : (
                    <NumericEditor
                      metric={activeMetric}
                      value={currentNumeric}
                      customOpen={customOpen}
                      onCustomOpenChange={setCustomOpen}
                      onPresetToggle={updateNumericPreset}
                      onCustomChange={updateNumericCustom}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Search and Dynamic Columns Table */}
      <div className="space-y-4">
        {/* Simple Search bar overlay on results */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Search ticker symbol or company name..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-8 text-xs font-semibold placeholder-gray-400 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

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

// ----------------------------------------------------------------------------
// 4. SUB-COMPONENTS: CAT EDITORS & NUM EDITORS
// ----------------------------------------------------------------------------

function CategoricalEditor({
  metric,
  search,
  onSearchChange,
  selected,
  onToggle,
}: {
  metric: Metric;
  search: string;
  onSearchChange: (v: string) => void;
  selected: string[];
  onToggle: (option: string) => void;
}) {
  const filteredOptions = (metric.options ?? []).filter((o) =>
    o.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={`Search ${metric.name.toLowerCase()}...`}
          className="w-full rounded-lg border border-gray-200 py-1.5 pl-8 pr-7 text-xs text-gray-700 placeholder:text-gray-450 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="max-h-[120px] space-y-0.5 overflow-y-auto rounded-lg border border-gray-200 p-1">
        {filteredOptions.length === 0 && (
          <p className="px-2 py-3 text-center text-xs text-gray-450">No matches found.</p>
        )}
        {filteredOptions.map((option) => {
          const checked = selected.includes(option);
          return (
            <label
              key={option}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1 text-xs text-gray-750 hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(option)}
                className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
              {option}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function NumericEditor({
  metric,
  value,
  customOpen,
  onCustomOpenChange,
  onPresetToggle,
  onCustomChange,
}: {
  metric: Metric;
  value: NumericFilterValue | undefined;
  customOpen: boolean;
  onCustomOpenChange: (open: boolean) => void;
  onPresetToggle: (presetId: string) => void;
  onCustomChange: (partial: Partial<NonNullable<NumericFilterValue['custom']>>) => void;
}) {
  const operator = value?.custom?.operator ?? 'more';
  const value1 = value?.custom?.value1 ?? '';
  const value2 = value?.custom?.value2 ?? '';
  const placeholder = metric.placeholder ?? 'e.g. 10';

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-2 gap-1.5">
        {metric.presets?.map((preset) => {
          const checked = value?.preset === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onPresetToggle(preset.id)}
              className={`flex items-center justify-between rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-all ${
                checked
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              <span className="truncate">{preset.label}</span>
              <span className={`h-2 w-2 rounded-full border border-gray-300 shrink-0 ml-1 ${
                checked ? 'bg-emerald-600 border-emerald-600' : 'bg-white'
              }`} />
            </button>
          );
        })}
      </div>

      {/* Custom toggle */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <button
          onClick={() => onCustomOpenChange(!customOpen)}
          className={`flex w-full items-center justify-between px-3 py-1.5 text-[11px] font-bold transition-all ${
            customOpen ? 'bg-gray-50 text-gray-800' : 'text-gray-750 hover:bg-gray-50'
          }`}
        >
          <span>Custom Value</span>
          <ChevronRight
            className={`h-3 w-3 text-gray-400 transition-transform ${
              customOpen ? 'rotate-90' : ''
            }`}
          />
        </button>

        {customOpen && (
          <div className="space-y-2 border-t border-gray-100 bg-gray-50/40 p-2.5">
            {/* Operator button group */}
            <div className="grid grid-cols-4 gap-0.5 rounded-lg bg-gray-200/50 p-0.5">
              {OPERATORS.map((op) => (
                <button
                  key={op.id}
                  onClick={() => onCustomChange({ operator: op.id })}
                  className={`rounded px-1 py-1 text-[10px] font-bold transition-all ${
                    operator === op.id
                      ? 'bg-white text-emerald-705 shadow-3xs'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {op.label}
                </button>
              ))}
            </div>

            {/* Inputs */}
            {operator === 'between' ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={value1}
                  onChange={(e) => onCustomChange({ value1: e.target.value })}
                  placeholder={placeholder}
                  className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 placeholder:text-gray-400 focus:border-emerald-400 outline-none"
                />
                <span className="text-[10px] text-gray-400 font-bold">and</span>
                <input
                  type="text"
                  value={value2}
                  onChange={(e) => onCustomChange({ value2: e.target.value })}
                  placeholder={placeholder}
                  className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 placeholder:text-gray-400 focus:border-emerald-400 outline-none"
                />
              </div>
            ) : (
              <input
                type="text"
                value={value1}
                onChange={(e) => onCustomChange({ value1: e.target.value })}
                placeholder={placeholder}
                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 placeholder:text-gray-400 focus:border-emerald-400 outline-none"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
