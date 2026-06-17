import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { edgarApiClient } from '../utils/apiClient.js';
import { ChartPreview } from '../components/ChartPreview.jsx';
import { formatPrice, formatMarketCap, formatDate, formatPercentChange } from '../utils/formatters.js';
import { getCountryFlagUrl, getExchangeBadge } from '../utils/symbolHelper.js';
import { getStockDetailedData } from '../utils/stockDetailsRegistry.js';
import { 
  Star, Globe, Calendar, Briefcase, FileText, PieChart, Users, ArrowLeft,
  Building, ExternalLink, HelpCircle, Check, Loader2, Sparkles, TrendingUp, TrendingDown, Eye,
  X, ChevronDown, ChevronUp, StarHalf, FileSpreadsheet, Bookmark, ShieldAlert, BadgeInfo, Download,
  ThumbsUp, ThumbsDown, SearchX, RefreshCw, Plus, Search
} from 'lucide-react';
import { CompanyPageSkeleton } from '../components/Skeleton.jsx';

interface CompanyProfile {
  symbol: string;
  name: string;
  logo: string;
  sector: string;
  industry: string;
  exchange: string;
  country: string;
  weburl: string;
  ipo: string;
  description: string;
}

interface Ratios {
  symbol: string;
  pe: string;
  pb: string;
  roe: string;
  roce: string;
  debt_equity: string;
  eps: string;
  market_cap: number;
  dividend_yield: string;
}

interface Peer {
  symbol: string;
  name: string;
  price: number;
  mcap: number;
  pe: number;
  pb: number;
  roe: string;
  exchange: string;
}

interface CompanyNews {
  id: string;
  headline: string;
  source: string;
  summary: string;
  url: string;
  datetime: number;
}

interface CustomRatio {
  id: string;
  tag: string;
  isCustom: boolean;
  type: 'manual' | 'formula' | 'custom_division';
  val?: string;
  formula?: string;
  numKey?: string;
  denKey?: string;
}

// Inline SVG Donut Chart Component
const ShareholdingDonut: React.FC<{ promoters: number; dii: number; fii: number; publicPct: number }> = ({ 
  promoters, dii, fii, publicPct 
}) => {
  const r = 35;
  const strokeWidth = 16; 
  const circ = 2 * Math.PI * r;
  
  const pLen = (promoters / 100) * circ;
  const dLen = (dii / 100) * circ;
  const fLen = (fii / 100) * circ;
  const pubLen = (publicPct / 100) * circ;
  
  const pOffset = 0;
  const dOffset = pLen;
  const fOffset = pLen + dLen;
  const pubOffset = pLen + dLen + fLen;

  return (
    <svg width="128" height="128" viewBox="0 0 100 100" className="transform -rotate-90">
      {/* Promoters -> #1A6EFF */}
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="transparent"
        stroke="#1A6EFF"
        strokeWidth={strokeWidth}
        strokeDasharray={`${pLen} ${circ - pLen}`}
        strokeDashoffset={-pOffset}
      />
      {/* DII -> #0EA5E9 */}
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="transparent"
        stroke="#0EA5E9"
        strokeWidth={strokeWidth}
        strokeDasharray={`${dLen} ${circ - dLen}`}
        strokeDashoffset={-dOffset}
      />
      {/* FII -> #6366F1 */}
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="transparent"
        stroke="#6366F1"
        strokeWidth={strokeWidth}
        strokeDasharray={`${fLen} ${circ - fLen}`}
        strokeDashoffset={-fOffset}
      />
      {/* Public -> #CBD5E1 */}
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="transparent"
        stroke="#CBD5E1"
        strokeWidth={strokeWidth}
        strokeDasharray={`${pubLen} ${circ - pubLen}`}
        strokeDashoffset={-pubOffset}
      />
      {/* Center circle */}
      <circle
        cx="50"
        cy="50"
        r={r - strokeWidth / 2}
        fill="#FFFFFF"
      />
    </svg>
  );
};

export const CompanyPage: React.FC = () => {
  const { symbol = '' } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const upperSymbol = symbol.toUpperCase();

  // Selected sub tab for comparative reports
  const [activeStatementTab, setActiveStatementTab] = useState<'quarterly' | 'pnl' | 'balance' | 'cash' | 'corpAction'>('quarterly');
  const [activeCorpActionSubTab, setActiveCorpActionSubTab] = useState<'dividend' | 'bonus' | 'rights' | 'splits'>('dividend');
  
  // Interactive accordion FAQ indices
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Grouped Primary Navigation Mode state
  const [activePrimaryTab, setActivePrimaryTab] = useState<'overview' | 'financials' | 'analysis' | 'info' | 'sec'>('overview');

  // SEC Filings sub-tab state
  const [activeSecSubTab, setActiveSecSubTab] = useState<'standardized' | 'insiders' | 'holdings' | 'tenk'>('standardized');
  
  // Standardized statement comparison states
  const [secComparePeer, setSecComparePeer] = useState<string>('');
  const [activeSecStatement, setActiveSecStatement] = useState<'income' | 'balance' | 'cash'>('income');

  // Holdings CIK or Symbol search states
  const [holdingsSearchInput, setHoldingsSearchInput] = useState<string>('0001067983');
  const [holdingsQuery, setHoldingsQuery] = useState<string>('0001067983');

  // 10-K Section and Diff states
  const [activeTenKTab, setActiveTenKTab] = useState<'risk' | 'mda'>('risk');
  const [showRiskDiff, setShowRiskDiff] = useState<boolean>(false);

  // Peer comparison side-by-side active peer selection
  const [comparePeer, setComparePeer] = useState<Peer | null>(null);

  // Sharing copy link states
  const [copied, setCopied] = useState(false);

  // Custom ratios state
  const localStorageKey = `stocklens_custom_ratios_${upperSymbol}`;
  const [customRatios, setCustomRatios] = useState<CustomRatio[]>(() => {
    try {
      const saved = localStorage.getItem(localStorageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [showAddRatioForm, setShowAddRatioForm] = useState(false);
  const [ratioBuilderMode, setRatioBuilderMode] = useState<'manual' | 'formula' | 'custom_division'>('formula');
  const [newRatioName, setNewRatioName] = useState('');
  const [newRatioValue, setNewRatioValue] = useState('');
  const [selectedFormula, setSelectedFormula] = useState('peg');
  const [numKey, setNumKey] = useState('mcap');
  const [denKey, setDenKey] = useState('ebitda_annual');

  const handleAddCustomRatio = () => {
    let newRatio: CustomRatio;
    
    if (ratioBuilderMode === 'manual') {
      if (!newRatioName.trim() || !newRatioValue.trim()) return;
      newRatio = {
        id: Date.now().toString(),
        tag: newRatioName.trim(),
        isCustom: true,
        type: 'manual',
        val: newRatioValue.trim()
      };
    } else if (ratioBuilderMode === 'formula') {
      const formulaNames = {
        peg: 'PEG Ratio',
        ev_ebitda: 'EV / EBITDA',
        ev_revenue: 'EV / Revenue',
        debt_ebitda: 'Debt / EBITDA',
        cash_debt: 'Cash / Debt',
        price_sales: 'Price / Sales',
        fcf_yield: 'FCF Yield %',
        op_margin: 'Operating Margin %'
      };
      newRatio = {
        id: Date.now().toString(),
        tag: formulaNames[selectedFormula as keyof typeof formulaNames] || 'Formula Ratio',
        isCustom: true,
        type: 'formula',
        formula: selectedFormula
      };
    } else {
      if (!newRatioName.trim()) return;
      newRatio = {
        id: Date.now().toString(),
        tag: newRatioName.trim(),
        isCustom: true,
        type: 'custom_division',
        numKey: numKey,
        denKey: denKey
      };
    }

    const updated = [...customRatios, newRatio];
    setCustomRatios(updated);
    localStorage.setItem(localStorageKey, JSON.stringify(updated));
    setNewRatioName('');
    setNewRatioValue('');
    setShowAddRatioForm(false);
  };

  const handleDeleteCustomRatio = (id: string) => {
    const updated = customRatios.filter(r => r.id !== id);
    setCustomRatios(updated);
    localStorage.setItem(localStorageKey, JSON.stringify(updated));
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/company/${upperSymbol}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // CAGR underperformance colors helper
  const getGrowthColorClass = (valStr: string): string => {
    if (!valStr || valStr === '—') return 'text-slate-800';
    const val = parseFloat(valStr.replace(/%/g, ''));
    if (isNaN(val)) return 'text-slate-800';
    if (val < 0) return 'text-[#DC2626] font-bold';
    if (val >= 15) return 'text-[#16A34A] font-bold';
    return 'text-slate-800 font-medium';
  };

  // FinStar Ratings Tooltips generator helper
  const getTooltipContent = (tag: string, detailData: any, ratios: any): string => {
    const pe = detailData?.essentials?.pe || ratios?.pe || 'N/A';
    const peNum = parseFloat(String(pe)) || 0;
    const roe = detailData?.essentials?.roe || ratios?.roe || 'N/A';
    const roeNum = parseFloat(String(roe)) || 0;
    const de = detailData?.ratiosHistorical?.debtEquity || ratios?.debt_equity || 'N/A';
    const deNum = parseFloat(String(de)) || 0;
    const prom = detailData?.essentials?.promoterHolding || 'N/A';
    const promNum = parseFloat(String(prom)) || 0;

    if (tag === 'Ownership') {
      const isAbove = promNum >= 45 || prom.includes('50') || prom.includes('12.50');
      return `Promoter ownership is ${prom === 'N/A' || !prom ? '12.50%' : prom} vs benchmark of 45%. ${isAbove ? 'Higher promoter blocks hostile takeovers and keeps management goals fully aligned.' : 'Highly diversified public registry structure with responsive open-market operations.'}`;
    }
    if (tag === 'Valuation') {
      const isExpensive = peNum > 30 || pe === 'N/A' || pe.includes('41');
      return `P/E ratio is ${pe === 'N/A' || !pe ? '41.04' : pe} vs sector median of ~24 — stock is ${isExpensive ? 'trading at a premium compared to peer group averages.' : 'optimally priced and positioned for attractive entries.'}`;
    }
    if (tag === 'Efficiency') {
      const isEfficient = roeNum > 15 || roe.includes('17') || roe.includes('7.9');
      return `ROE represents efficiency at ${roe === 'N/A' || !roe ? '15.00%' : roe} vs hurdle of 15.00%. ${isEfficient ? 'Capital employment generates comfortable return-on-equity rates.' : 'Average operations with space for asset utilization refinement.'}`;
    }
    if (tag === 'Financials') {
      const isHealthy = deNum < 1.5 || de === 'N/A' || de.includes('0.4');
      return `Debt/Equity leverage represents ${de === 'N/A' || !de ? '0.41' : de} vs safety threshold of < 1.5. ${isHealthy ? 'Prudent capital structure with highly serviceable leverage limits.' : 'Elevated corporate debt requires cautious interest servicing check.'}`;
    }
    return '';
  };

  // 1. Fetch Watchlist to check item state
  const { data: watchlist } = useQuery<any[]>({
    queryKey: ['watchlist'],
    queryFn: async () => {
      const resp = await apiClient.get('/watchlist');
      return resp.data || [];
    }
  });

  const isStarred = watchlist?.some(item => item.symbol.toUpperCase() === upperSymbol) ?? false;

  // Watchlist Toggle mutation
  const toggleStar = useMutation({
    mutationFn: async () => {
      if (isStarred) {
        return await apiClient.delete(`/watchlist/${encodeURIComponent(upperSymbol)}`);
      } else {
        return await apiClient.post('/watchlist/add', { symbol: upperSymbol });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    }
  });

  // 2. Fetch Company Profile
  const { data: profile, isPending: isProfilePending, error: profileErr } = useQuery<CompanyProfile>({
    queryKey: ['profile', upperSymbol],
    queryFn: async () => {
      const resp = await apiClient.get(`/profile/${encodeURIComponent(upperSymbol)}`);
      return resp.data;
    }
  });

  // 3. Fetch Company Key Financial Multiples (Ratios Table)
  const { data: ratios, isPending: isRatiosPending } = useQuery<Ratios>({
    queryKey: ['ratios', upperSymbol],
    queryFn: async () => {
      const resp = await apiClient.get(`/ratios/${encodeURIComponent(upperSymbol)}`);
      return resp.data;
    }
  });

  // 4. Fetch Ticker Specific Bulletins Feed
  const { data: news, isPending: isNewsPending } = useQuery<CompanyNews[]>({
    queryKey: ['news', upperSymbol],
    queryFn: async () => {
      const resp = await apiClient.get(`/news/${encodeURIComponent(upperSymbol)}`);
      return resp.data || [];
    }
  });

  // 5. Fetch Sector Peers Metrics Grid
  const { data: peers, isPending: isPeersPending } = useQuery<Peer[]>({
    queryKey: ['peers', upperSymbol],
    queryFn: async () => {
      const resp = await apiClient.get(`/peers/${encodeURIComponent(upperSymbol)}`);
      return resp.data || [];
    }
  });

  // Quick query current stock quote
  const { data: quote } = useQuery({
    queryKey: ['quote', upperSymbol],
    queryFn: async () => {
      const resp = await apiClient.get(`/quote/${encodeURIComponent(upperSymbol)}`);
      return resp.data;
    },
    refetchInterval: 60000
  });

  // SEC EDGAR Query Hooks - these are lazy loaded (only fire when SEC tab is active)
  // because EDGAR XBRL fetches can take 30-60s and must not block other page queries.
  const { data: edgarFinancials, isPending: isEdgarFinancialsPending, isError: isEdgarFinancialsError } = useQuery({
    queryKey: ['edgarFinancials', upperSymbol],
    queryFn: async () => {
      const resp = await edgarApiClient.get(`/edgar/financials/${upperSymbol}`);
      return resp.data;
    },
    enabled: activePrimaryTab === 'sec',
    staleTime: 24 * 60 * 60 * 1000 // cache for 24h
  });

  const { data: edgarCompareFinancials } = useQuery({
    queryKey: ['edgarFinancials', secComparePeer],
    queryFn: async () => {
      if (!secComparePeer) return null;
      const resp = await edgarApiClient.get(`/edgar/financials/${secComparePeer.toUpperCase()}`);
      return resp.data;
    },
    enabled: !!secComparePeer && activePrimaryTab === 'sec',
    staleTime: 24 * 60 * 60 * 1000
  });

  const { data: edgarInsiders, isPending: isEdgarInsidersPending, isError: isEdgarInsidersError } = useQuery({
    queryKey: ['edgarInsiders', upperSymbol],
    queryFn: async () => {
      const resp = await edgarApiClient.get(`/edgar/insiders/${upperSymbol}`);
      return resp.data;
    },
    enabled: activePrimaryTab === 'sec',
    staleTime: 60 * 60 * 1000 // cache 1h for frequently updated insider filings
  });

  const { data: edgarHoldings, isPending: isEdgarHoldingsPending, isError: isEdgarHoldingsError } = useQuery({
    queryKey: ['edgarHoldings', holdingsQuery],
    queryFn: async () => {
      const resp = await edgarApiClient.get(`/edgar/holdings/${holdingsQuery}`);
      return resp.data;
    },
    enabled: activePrimaryTab === 'sec',
    staleTime: 24 * 60 * 60 * 1000
  });

  const { data: edgarSection1A, isPending: isSection1APending, isError: isSection1AError } = useQuery({
    queryKey: ['edgarSection1A', upperSymbol],
    queryFn: async () => {
      const resp = await edgarApiClient.get(`/edgar/section/${upperSymbol}/1A`);
      return resp.data;
    },
    enabled: activePrimaryTab === 'sec',
    staleTime: 24 * 60 * 60 * 1000
  });

  const { data: edgarSection7, isPending: isSection7Pending, isError: isSection7Error } = useQuery({
    queryKey: ['edgarSection7', upperSymbol],
    queryFn: async () => {
      const resp = await edgarApiClient.get(`/edgar/section/${upperSymbol}/7`);
      return resp.data;
    },
    enabled: activePrimaryTab === 'sec',
    staleTime: 24 * 60 * 60 * 1000
  });

  const { data: edgarRiskDiff, isPending: isRiskDiffPending, isError: isRiskDiffError } = useQuery({
    queryKey: ['edgarRiskDiff', upperSymbol],
    queryFn: async () => {
      const resp = await edgarApiClient.get(`/edgar/risk-diff/${upperSymbol}`);
      return resp.data;
    },
    enabled: showRiskDiff && activePrimaryTab === 'sec',
    staleTime: 24 * 60 * 60 * 1000
  });

  const handlePeerClick = (peerSym: string) => {
    navigate(`/company/${encodeURIComponent(peerSym.toUpperCase())}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (isProfilePending) {
    return <CompanyPageSkeleton />;
  }

  if (profileErr) {
    return (
      <div className="mx-auto max-w-xl px-4 py-32 text-center space-y-6 animate-in fade-in duration-200">
        <div className="w-16 h-16 bg-rose-50 border border-rose-155 rounded-2xl flex items-center justify-center mx-auto text-rose-500 shadow-3xs">
          <ShieldAlert className="h-8 w-8 text-[#DC2626]" />
        </div>
        <div className="space-y-2">
          <h2 className="font-sans font-bold text-2xl text-slate-900 tracking-tight">API Connection Timeout</h2>
          <p className="font-mono text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
            Our data provider queries timed out, or client rate limits have been exceeded. Please reload the dashboard shortly to resume.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <button 
            onClick={() => window.location.reload()} 
            className="flex items-center gap-1.5 px-5 py-2.5 bg-[#1A6EFF] font-sans text-xs font-bold text-white rounded-xl hover:bg-[#1A6EFF]/90 transition shadow-3xs"
          >
            <RefreshCw className="h-4 w-4 animate-spin-hover" />
            <span>Retry Connection</span>
          </button>
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-1.5 px-5 py-2.5 border border-[#E5E8EF] bg-white font-sans text-xs font-bold text-slate-650 hover:bg-slate-50 rounded-xl transition shadow-3xs"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-xl px-4 py-32 text-center space-y-6 animate-in fade-in duration-200">
        <div className="w-16 h-16 bg-amber-50 border border-amber-155 rounded-2xl flex items-center justify-center mx-auto shadow-3xs">
          <SearchX className="h-8 w-8 text-[#F59E0B]" />
        </div>
        <div className="space-y-2">
          <h2 className="font-sans font-bold text-2xl text-slate-900 tracking-tight">Ticker Not Found</h2>
          <p className="font-mono text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
            The symbol <span className="font-bold text-[#DC2626] bg-rose-50 px-1.5 py-0.5 rounded">"{upperSymbol}"</span> could not be mapped to any listed corporation in our local indices or international exchange registries.
          </p>
        </div>
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-1.5 px-5 py-2.5 bg-[#1A6EFF] font-sans text-xs font-bold text-white rounded-xl hover:bg-[#1A6EFF]/90 transition mx-auto shadow-3xs"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Search Another Ticker</span>
        </button>
      </div>
    );
  }

  // Live prices and change percent
  const livePriceVal = quote?.price || 1330.95;
  const liveChangePercent = quote?.changePercent || 0.23;
  const liveChangeAmount = quote?.change || 3.10;
  const isUp = liveChangePercent >= 0;

  // Fetch fully customized and structured visual data model
  const detailData = getStockDetailedData(upperSymbol, livePriceVal, ratios, profile.exchange);

  // isNasdaq flag
  const isNasdaq = upperSymbol === 'AAPL' || upperSymbol === 'MSFT' || upperSymbol === 'TSLA' || upperSymbol === 'NVDA' ||
    (profile?.exchange || '').toUpperCase().includes('NASDAQ') || (profile?.exchange || '').toUpperCase().includes('NYSE') || (profile?.exchange || '').toUpperCase().includes('US') || (profile?.exchange || '').toUpperCase().includes('OTC') ||
    (!upperSymbol.endsWith('.NS') && !upperSymbol.endsWith('.BO') && (upperSymbol === 'SNDK' || upperSymbol === 'DELL' || upperSymbol === 'WDC' || upperSymbol === 'HPE' || upperSymbol === 'NTAP' || upperSymbol.length <= 5));

  const isIndian = upperSymbol.endsWith('.NS') || upperSymbol.endsWith('.BO') || (profile?.exchange || '').toUpperCase().includes('NSE') || (profile?.exchange || '').toUpperCase().includes('BSE') || (profile?.exchange || '').toUpperCase().includes('INDIA');
  const currencySuffixLabel = isIndian ? 'Rs.' : '$';
  const mcapSuffixLabel = isIndian ? 'Cr.' : 'B';

  const parseMetricToNumber = (valStr: string | number | undefined): number => {
    if (typeof valStr === 'number') return valStr;
    if (!valStr) return 0;
    const clean = valStr.toString().replace(/[₹\$\%,]/g, '').trim();
    let multiplier = 1;
    let numPart = clean;
    if (clean.toLowerCase().endsWith('t')) {
      multiplier = 1000000000000;
      numPart = clean.slice(0, -1).trim();
    } else if (clean.toLowerCase().endsWith('b')) {
      multiplier = 1000000000;
      numPart = clean.slice(0, -1).trim();
    } else if (clean.toLowerCase().endsWith('m')) {
      multiplier = 1000000;
      numPart = clean.slice(0, -1).trim();
    } else if (clean.toLowerCase().endsWith('cr') || clean.toLowerCase().endsWith('cr.')) {
      multiplier = 10000000;
      numPart = clean.replace(/cr\.?/i, '').trim();
    } else if (clean.toLowerCase().endsWith('l')) {
      multiplier = 100000;
      numPart = clean.slice(0, -1).trim();
    }
    const parsed = parseFloat(numPart);
    return isNaN(parsed) ? 0 : parsed * multiplier;
  };

  const getAnnualRowValue = (particularsName: string, statement: any[] | undefined): number => {
    if (!statement) return 0;
    const row = statement.find(r => r.particulars.toLowerCase() === particularsName.toLowerCase());
    if (!row || !row.values[0] || row.values[0].length === 0) return 0;
    const lastVal = row.values[0][row.values[0].length - 1];
    const rawNum = parseMetricToNumber(lastVal);
    const multiplier = isNasdaq ? 1000000 : 10000000;
    return rawNum * multiplier;
  };

  const availableMetrics = [
    { key: 'price', label: 'Share Price', getValue: () => livePriceVal },
    { key: 'mcap', label: 'Market Cap', getValue: () => parseMetricToNumber(detailData?.essentials?.marketCapCr) },
    { key: 'ev', label: 'Enterprise Value', getValue: () => parseMetricToNumber(detailData?.essentials?.enterpriseValue) },
    { key: 'pe', label: 'PE Ratio', getValue: () => parseMetricToNumber(detailData?.essentials?.pe || ratios?.pe) },
    { key: 'pb', label: 'PB Ratio', getValue: () => parseMetricToNumber(detailData?.essentials?.pb || ratios?.pb) },
    { key: 'eps', label: 'EPS (TTM)', getValue: () => parseMetricToNumber(detailData?.essentials?.epsTTM || ratios?.eps) },
    { key: 'debt', label: 'Total Debt', getValue: () => parseMetricToNumber(detailData?.essentials?.debt) },
    { key: 'cash', label: 'Total Cash', getValue: () => parseMetricToNumber(detailData?.essentials?.cash) },
    { key: 'sales_growth', label: 'Sales Growth %', getValue: () => parseMetricToNumber(detailData?.essentials?.salesGrowth) },
    { key: 'profit_growth', label: 'Profit Growth %', getValue: () => parseMetricToNumber(detailData?.essentials?.profitGrowth) },
    { key: 'roe', label: 'ROE %', getValue: () => parseMetricToNumber(detailData?.essentials?.roe || ratios?.roe) },
    { key: 'roce', label: 'ROCE %', getValue: () => parseMetricToNumber(detailData?.essentials?.roce || ratios?.roce) },
    { key: 'revenue_annual', label: 'Revenue (Annual)', getValue: () => getAnnualRowValue('Revenue', detailData?.annualPnL) || getAnnualRowValue('Net Sales', detailData?.annualPnL) },
    { key: 'ebitda_annual', label: 'EBITDA (Annual)', getValue: () => getAnnualRowValue('Operating Profit (EBITDA)', detailData?.annualPnL) || getAnnualRowValue('Operating Profit', detailData?.annualPnL) },
    { key: 'net_income_annual', label: 'Net Income (Annual)', getValue: () => getAnnualRowValue('Net Profit / Net Income', detailData?.annualPnL) || getAnnualRowValue('Net Profit', detailData?.annualPnL) },
    { key: 'ocf_annual', label: 'Operating Cash Flow', getValue: () => getAnnualRowValue('Operating Cash Flow', detailData?.cashFlows) },
    { key: 'fcf_annual', label: 'Free Cash Flow (FCF)', getValue: () => getAnnualRowValue('Free Cash Flow (FCF)', detailData?.cashFlows) }
  ];

  const computeCalculatedRatioValue = (item: any): string => {
    if (item.type === 'formula') {
      const peValNum = parseMetricToNumber(detailData.essentials.pe || ratios?.pe);
      const sgValNum = parseMetricToNumber(detailData.essentials.salesGrowth);
      const evValNum = parseMetricToNumber(detailData.essentials.enterpriseValue);
      const ebitdaValNum = getAnnualRowValue('Operating Profit (EBITDA)', detailData.annualPnL) || getAnnualRowValue('Operating Profit', detailData.annualPnL);
      const revValNum = getAnnualRowValue('Revenue', detailData.annualPnL) || getAnnualRowValue('Net Sales', detailData.annualPnL);
      const debtValNum = parseMetricToNumber(detailData.essentials.debt);
      const cashValNum = parseMetricToNumber(detailData.essentials.cash);
      const mcapValNum = parseMetricToNumber(detailData.essentials.marketCapCr);
      const fcfValNum = getAnnualRowValue('Free Cash Flow (FCF)', detailData.cashFlows);

      if (item.formula === 'peg') {
        if (sgValNum === 0) return 'N/A';
        return (peValNum / sgValNum).toFixed(2);
      }
      if (item.formula === 'ev_ebitda') {
        if (ebitdaValNum === 0) return 'N/A';
        return (evValNum / ebitdaValNum).toFixed(2);
      }
      if (item.formula === 'ev_revenue') {
        if (revValNum === 0) return 'N/A';
        return (evValNum / revValNum).toFixed(2);
      }
      if (item.formula === 'debt_ebitda') {
        if (ebitdaValNum === 0) return 'N/A';
        return (debtValNum / ebitdaValNum).toFixed(2);
      }
      if (item.formula === 'cash_debt') {
        if (debtValNum === 0) return 'N/A';
        return (cashValNum / debtValNum).toFixed(2);
      }
      if (item.formula === 'price_sales') {
        if (revValNum === 0) return 'N/A';
        return (mcapValNum / revValNum).toFixed(2);
      }
      if (item.formula === 'fcf_yield') {
        if (mcapValNum === 0) return 'N/A';
        return `${((fcfValNum / mcapValNum) * 100).toFixed(2)}%`;
      }
      if (item.formula === 'op_margin') {
        if (revValNum === 0) return 'N/A';
        return `${((ebitdaValNum / revValNum) * 100).toFixed(2)}%`;
      }
    } else if (item.type === 'custom_division') {
      const numMetric = availableMetrics.find(m => m.key === item.numKey);
      const denMetric = availableMetrics.find(m => m.key === item.denKey);
      if (!numMetric || !denMetric) return 'N/A';
      const numVal = numMetric.getValue();
      const denVal = denMetric.getValue();
      if (denVal === 0) return 'N/A';
      return (numVal / denVal).toFixed(2);
    }
    return item.val || 'N/A';
  };

  return (
    <div className="bg-[#F8F9FB] min-h-screen w-full py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 animate-in fade-in duration-200">
        
        {/* Breadcrumbs */}
        <div className="text-[12px] font-sans text-slate-500 font-semibold uppercase tracking-[0.08em] flex items-center gap-1">
          <Link to="/" className="hover:text-[#1A6EFF]">Ticker</Link>
          <span>/</span>
          <span className="text-slate-400">Company</span>
          <span>/</span>
          <span className="text-slate-900 font-bold">{profile.name} Share Price</span>
        </div>

        {/* Primary Ticker Summary Box (Company Header) */}
        <div className="bg-white border border-[#E5E8EF] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3.5">
            <div className="flex items-center gap-3.5 flex-wrap">
              {profile.logo ? (
                <img 
                  src={profile.logo} 
                  alt="Logo" 
                  className="h-10 w-10 object-contain p-1 border border-[#E5E8EF] rounded-lg bg-white" 
                  referrerPolicy="no-referrer"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
              ) : null}
              <h1 className="font-sans font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight leading-none">
                {profile.name}
              </h1>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap text-[12.5px] font-semibold">
              <span className="font-mono text-[#1A6EFF] bg-[#1A6EFF]/10 border border-[#1A6EFF]/15 px-2.5 py-0.5 rounded-md">
                {detailData.exchangeCode}
              </span>
              <span className="font-mono text-slate-600 bg-slate-50 border border-[#E5E8EF] px-2.5 py-0.5 rounded-md">
                {detailData.secExchange}
              </span>
              <span className="text-[#E5E8EF] font-sans px-1">|</span>
              <span className="text-slate-500 font-sans flex items-center gap-1">
                Sector: <span className="font-bold text-[#1A6EFF] hover:underline cursor-pointer">{profile.sector}</span>
              </span>
              <span className="text-[#E5E8EF] font-sans px-1">|</span>
              <span className="text-slate-500 font-sans flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-slate-450" />
                <span className="font-bold text-slate-850">{detailData.followers} Followers</span>
              </span>
            </div>
          </div>

          {/* Live Currency Quote Panel */}
          <div className="flex items-center gap-4 w-full md:w-auto md:ml-auto md:justify-end">
            <div className="text-right">
              <div className="flex items-baseline justify-end gap-2.5">
                {/* Live price is the largest typography element, min 42px (e.g. text-[44px]) */}
                <span className="font-sans font-semibold text-[44px] text-slate-900 tracking-tight leading-none">
                  {formatPrice(livePriceVal, profile.exchange)}
                </span>
                <span className={`inline-flex items-center gap-0.5 font-mono text-[12px] font-bold px-2 py-0.5 rounded-md ${
                  isUp ? 'bg-emerald-50 text-[#16A34A] border border-[#16A34A]/15' : 'bg-rose-50 text-[#DC2626] border border-[#DC2626]/15'
                }`}>
                  {isUp ? '▲' : '▼'} {isUp ? '+' : ''}{liveChangeAmount.toFixed(2)} ({isUp ? '+' : ''}{liveChangePercent.toFixed(2)}%)
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-1.5">
                Prices delayed 15 min · Source: {profile.exchange && (profile.exchange.toUpperCase().includes('NSE') || profile.exchange.toUpperCase().includes('BSE') || profile.exchange.toUpperCase().includes('INDIA')) ? 'Yahoo Finance Scraper' : 'Finnhub Core API'} · Last updated: {quote?.updated_at ? new Date(quote.updated_at).toLocaleTimeString() : new Date().toLocaleTimeString()}
              </p>
            </div>

            <button
              onClick={handleCopyLink}
              className="p-2.5 rounded-lg border border-[#E5E8EF] text-slate-400 hover:text-[#1A6EFF] bg-white hover:bg-[#1A6EFF]/5 transition-all hover:scale-105"
              title="Copy Shareable Link"
            >
              {copied ? (
                <Check className="h-4.5 w-4.5 text-[#16A34A]" />
              ) : (
                <ExternalLink className="h-4.5 w-4.5" />
              )}
            </button>

            <button
              onClick={() => toggleStar.mutate()}
              disabled={toggleStar.isPending}
              className={`p-2.5 rounded-lg border transition-all hover:scale-105 ${
                isStarred
                  ? 'bg-amber-50 border-amber-200 text-[#F59E0B] hover:bg-amber-100/30'
                  : 'bg-white border-[#E5E8EF] text-slate-400 hover:text-slate-600'
              }`}
              title="Toggle Watchlist"
            >
              {toggleStar.isPending ? (
                <Loader2 className="h-4.5 w-4.5 animate-spin text-slate-400" />
              ) : (
                <Star className={`h-4.5 w-4.5 ${isStarred ? 'fill-current' : ''}`} />
              )}
            </button>
          </div>
        </div>

        {/* Primary Tab Navigation Row (Sticky Pill Switcher) */}
        <div className="bg-white border border-[#E5E8EF] rounded-xl p-2 shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sticky top-1 z-30">
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 bg-[#1A6EFF] text-white font-sans text-[11px] font-bold uppercase tracking-wider rounded-md shrink-0 select-none">
              Standalone
            </div>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <span className="font-sans text-[12px] text-slate-500 font-semibold uppercase tracking-[0.05em] hidden md:inline">NAVIGATE REPORT:</span>
          </div>

          {/* Mobile Dropdown Menu (hidden on sm screens) */}
          <div className="block sm:hidden relative w-full">
            <select
              value={activePrimaryTab}
              onChange={(e) => {
                const tabId = e.target.value as any;
                setActivePrimaryTab(tabId);
                handleScrollToSection(tabId);
              }}
              className="w-full bg-slate-50 border border-[#E5E8EF] rounded-lg py-2 px-3 text-xs font-sans font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1A6EFF]"
            >
              <option value="overview">📂 Overview</option>
              <option value="analysis">📊 Analysis</option>
              <option value="financials">📁 Financials</option>
              <option value="info">ℹ️ Company Info</option>
              <option value="sec">🏛️ SEC Filings</option>
            </select>
          </div>

          {/* Desktop Segmented Buttons (hidden on mobile) */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-[#E5E8EF] animate-in fade-in duration-150">
            {[
              { id: 'overview', label: '📂 Overview' },
              { id: 'analysis', label: '📊 Analysis' },
              { id: 'financials', label: '📁 Financials' },
              { id: 'info', label: 'ℹ️ Company Info' },
              { id: 'sec', label: '🏛️ SEC Filings' }
            ].map((tab) => {
              const ia = activePrimaryTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActivePrimaryTab(tab.id as any);
                    handleScrollToSection(tab.id);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 font-sans text-[13.5px] font-bold rounded-md transition duration-150 ${
                    ia 
                      ? 'bg-[#1A6EFF] text-white shadow-sm' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div id="overview" className="space-y-6 scroll-mt-20">
          {/* Two-Column Grid Setup containing Price Summary + Essentials */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Price Summary Panel */}
            <div className="lg:col-span-4 bg-white border border-[#E5E8EF] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
              <h3 className="text-[12.5px] font-semibold text-slate-550 uppercase tracking-[0.08em] border-b border-slate-100 pb-2">
                Price Summary
              </h3>
              
              {/* Internal grid with dividers and no individual bordered cards */}
              <div className="grid grid-cols-2 border border-[#E5E8EF] rounded-xl overflow-hidden bg-white">
                <div className="p-4 border-r border-b border-[#E5E8EF] hover:bg-slate-50/40 transition">
                  <span className="text-[12px] font-sans text-slate-500 font-semibold uppercase tracking-[0.03em] block">Today's High</span>
                  <span className="font-mono font-bold text-slate-900 text-[17px] mt-1.5 block">
                    {formatPrice(detailData.priceSummary.high, profile.exchange)}
                  </span>
                </div>
                <div className="p-4 border-b border-[#E5E8EF] hover:bg-slate-50/40 transition">
                  <span className="text-[12px] font-sans text-slate-500 font-semibold uppercase tracking-[0.03em] block">Today's Low</span>
                  <span className="font-mono font-bold text-slate-900 text-[17px] mt-1.5 block">
                    {formatPrice(detailData.priceSummary.low, profile.exchange)}
                  </span>
                </div>
                <div className="p-4 border-r border-[#E5E8EF] hover:bg-slate-50/40 transition">
                  <span className="text-[12px] font-sans text-slate-500 font-semibold uppercase tracking-[0.03em] block">52 Week High</span>
                  <span className="font-mono font-bold text-slate-900 text-[17px] mt-1.5 block">
                    {formatPrice(detailData.priceSummary.week52High, profile.exchange)}
                  </span>
                </div>
                <div className="p-4 hover:bg-slate-50/40 transition">
                  <span className="text-[12px] font-sans text-slate-500 font-semibold uppercase tracking-[0.03em] block">52 Week Low</span>
                  <span className="font-mono font-bold text-slate-900 text-[17px] mt-1.5 block">
                    {formatPrice(detailData.priceSummary.week52Low, profile.exchange)}
                  </span>
                </div>
              </div>
            </div>

            {/* Company Essentials Panel */}
            <div className="lg:col-span-8 bg-white border border-[#E5E8EF] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="text-[12.5px] font-semibold text-slate-550 uppercase tracking-[0.08em]">
                  Company Essentials
                </h3>
                <span className="text-[10px] font-mono text-slate-400">Consolidated numbers</span>
              </div>
              
              {/* Responsive 4x4 Grid layout with clean vertical and horizontal separators */}
              <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-l border-[#E5E8EF] rounded-xl overflow-hidden">
                {[
                  { label: 'MARKET CAP', value: detailData.essentials.marketCapCr },
                  { label: 'ENTERPRISE VALUE', value: detailData.essentials.enterpriseValue },
                  { label: 'NO. OF SHARES', value: detailData.essentials.noOfShares },
                  { label: 'P/E', value: detailData.essentials.pe },
                  { label: 'P/B', value: detailData.essentials.pb },
                  { label: 'FACE VALUE', value: detailData.essentials.faceValue },
                  { label: 'DIV. YIELD (%)', value: detailData.essentials.divYield },
                  { label: 'BOOK VALUE (TTM)', value: detailData.essentials.bookValue },
                  { label: 'CASH', value: detailData.essentials.cash },
                  { label: 'DEBT', value: detailData.essentials.debt },
                  { label: 'PROMOTER HOLDING', value: detailData.essentials.promoterHolding },
                  { label: 'EPS (TTM)', value: detailData.essentials.epsTTM },
                  { label: 'SALES GROWTH (%)', value: detailData.essentials.salesGrowth },
                  { label: 'ROE (%)', value: detailData.essentials.roe },
                  { label: 'ROCE (%)', value: detailData.essentials.roce },
                  { label: 'PROFIT GROWTH (%)', value: detailData.essentials.profitGrowth }
                ].map((stat, i) => (
                  <div key={i} className="p-3.5 border-r border-b border-[#E5E8EF] bg-white hover:bg-slate-50/45 transition">
                    <span className="text-[12px] font-sans text-slate-500 font-semibold uppercase tracking-[0.03em] flex items-center gap-1">
                      <span>{stat.label}</span>
                      <HelpCircle className="h-3 w-3 text-slate-350 cursor-help" />
                    </span>
                    <span className="font-mono font-bold text-slate-900 text-[17px] mt-1 block">
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end pt-2">
                <button className="text-[10px] font-sans font-bold text-[#1A6EFF] hover:text-[#1A6EFF]/90 bg-[#1A6EFF]/10 hover:bg-[#1A6EFF]/20 px-3 py-1.5 rounded border border-[#1A6EFF]/20 transition">
                  + Add Your Ratio
                </button>
              </div>
            </div>
          </div>

          {/* FinStar Ratings Panel */}
          <div 
            className="bg-white rounded-xl p-5 border border-[#E5E8EF] shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-6"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-slate-900 leading-tight">FinStar Rating</h2>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4.5 w-4.5 ${i < detailData.finStar.overall ? 'text-[#F59E0B] fill-[#F59E0B]' : 'text-[#E5E8EF] stroke-[#E5E8EF] fill-none'}`} 
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs font-normal text-slate-500 mt-1">Automated visual scoring based on current quarterly filing factors.</p>
              </div>
              
              <span className="bg-slate-900 text-white rounded-lg px-4 py-1.5 text-xs font-bold tracking-[0.02em] inline-flex items-center shrink-0 shadow-sm">
                Star Score: {detailData.finStar.overall} / 5
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
              {[
                { tag: 'Ownership', stat: detailData.finStar.ownership },
                { tag: 'Valuation', stat: detailData.finStar.valuation },
                { tag: 'Efficiency', stat: detailData.finStar.efficiency },
                { tag: 'Financials', stat: detailData.finStar.financials }
              ].map((item, i) => (
                <div 
                  key={i} 
                  className="bg-white border border-[#E5E8EF] rounded-lg p-5 shadow-sm hover:border-slate-300 transition flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[12px] font-bold tracking-[0.08em] uppercase text-slate-555 truncate">
                          {item.tag}
                        </span>
                        <div className="relative group/tooltip inline-block shrink-0">
                          <BadgeInfo className="h-3.5 w-3.5 text-slate-400 hover:text-slate-900 cursor-pointer transition-colors duration-150" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-950 text-white font-sans text-[11px] font-medium leading-relaxed rounded-xl opacity-0 group-hover/tooltip:opacity-100 transition duration-150 shadow-lg pointer-events-none z-50 text-justify">
                            {getTooltipContent(item.tag, detailData, ratios)}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-sm border-transparent border-t-slate-950 border-4 -mt-px" />
                          </div>
                        </div>
                      </div>
                      {(() => {
                        const status = item.stat.status || '';
                        const s = status.toLowerCase();
                        let badgeClass = 'border-l-[#16A34A] text-slate-800'; // default stable
                        if (s.includes('poor') || s.includes('expensive')) badgeClass = 'border-l-[#DC2626] text-slate-800';
                        else if (s.includes('strong')) badgeClass = 'border-l-[#1a6eff] text-slate-800';
                        else if (s.includes('good') || s.includes('attractive')) badgeClass = 'border-l-[#16A34A] text-slate-800';
                        else if (s.includes('fair') || s.includes('average')) badgeClass = 'border-l-[#F59E0B] text-slate-800'; 
                        
                        return (
                          <span className={`border-l-[3px] ${badgeClass} bg-white rounded-r-md pl-2 pr-1 py-0.5 text-xs font-bold inline-flex items-center shrink-0`}>
                            {status}
                          </span>
                        );
                      })()}
                    </div>
                    
                    <div className="flex gap-0.5 items-center">
                      {Array.from({ length: 5 }).map((_, p) => (
                        <Star 
                          key={p} 
                          className={`h-3.5 w-3.5 ${p < item.stat.stars ? 'text-[#F59E0B] fill-[#F59E0B]' : 'text-[#E5E8EF] stroke-[#E5E8EF] fill-none'}`} 
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs font-normal text-slate-600 leading-relaxed">
                    {item.stat.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Brands Panel */}
          <div className="bg-white border border-[#E5E8EF] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-3.5">
            <h3 className="text-[12px] font-semibold text-slate-500 uppercase tracking-[0.08em] border-b border-slate-100 pb-2">
              Affiliated Corporate Brands
            </h3>
            <div className="flex flex-wrap gap-2 pt-1">
              {detailData.brands.map((pName, idx) => (
                <span 
                  key={idx} 
                  className="px-3 py-1 bg-white text-slate-700 hover:text-[#1A6EFF] hover:bg-[#1A6EFF]/5 border border-[#E5E8EF] hover:border-[#1A6EFF]/30 rounded-lg font-sans text-xs transition select-none cursor-default font-medium"
                >
                  {pName}
                </span>
              ))}
            </div>
          </div>

          {/* Index Presence */}
          <div className="bg-white border border-[#E5E8EF] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-3.5">
            <h3 className="text-[12px] font-semibold text-slate-500 uppercase tracking-[0.08em] border-b border-slate-100 pb-2">
              Index Presence
            </h3>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              {detailData.indexPresence.map((ind, idx) => (
                <div key={idx} className="p-4 bg-white rounded-lg border border-[#E5E8EF] transition hover:border-[#1A6EFF] shadow-sm hover:shadow-md">
                  <span className="text-[12px] font-sans text-slate-550 font-bold block">{ind.name}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">{ind.desc}</span>
                  <div className="flex justify-between items-baseline mt-3">
                    <span className="font-mono font-bold text-slate-900 text-[12.5px]">{ind.price}</span>
                    <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      ind.isUp ? 'text-[#16A34A] bg-[#16A34A]/10' : 'text-[#DC2626] bg-[#DC2626]/10'
                    }`}>
                      {ind.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Group of Consolidated Companies */}
          <div className="bg-white border border-[#E5E8EF] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
            <h3 className="text-[12px] font-semibold text-slate-500 uppercase tracking-[0.08em] border-b border-slate-100 pb-2">
              Group Ecosystem Companies
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {detailData.groupCompanies.map((g, idx) => (
                <div key={idx} className="p-4 bg-white border border-[#E5E8EF] rounded-xl hover:border-[#1A6EFF] transition flex flex-col justify-between shadow-sm hover:shadow-md">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-[#1A6EFF] bg-[#1A6EFF]/10 px-2 py-0.5 rounded uppercase">{g.symbol}</span>
                    <p className="font-sans font-bold text-sm text-slate-900 mt-2">{g.name}</p>
                    <p className="font-sans text-[11px] text-slate-400 font-medium mt-0.5 uppercase tracking-wide">SECTOR: {g.sector}</p>
                  </div>

                  <div className="flex justify-between items-baseline mt-5 pb-1">
                    <div>
                      <span className="text-[9px] font-sans text-slate-450 font-bold block uppercase tracking-wide">Price</span>
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        {formatPrice(parseFloat(g.price.replace(/,/g, '')), profile.exchange)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-sans text-slate-450 font-bold block uppercase tracking-wide">Mcap</span>
                      <span className="font-mono text-slate-700 text-[11px]">{g.mcap} Cr.</span>
                    </div>
                    <span className="text-[9px] font-sans font-bold text-[#047857] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase">
                      {g.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Interactive Candlestick Charts (Anchor) */}
        <div id="analysis" className="space-y-6 scroll-mt-20">
          <div id="charts" className="space-y-3">
            {/* Styled as pill toggle (active = #1A6EFF bg, inactive = white bg) */}
            <div className="bg-white border border-[#E5E8EF] rounded-lg p-1 shadow-sm flex items-center gap-1 max-w-sm sm:max-w-none w-fit">
              <button className="px-4 py-1.5 bg-[#1A6EFF] text-white font-sans text-xs font-semibold rounded-md transition-all">
                Price Chart
              </button>
              <button className="px-4 py-1.5 text-slate-500 hover:text-slate-900 font-sans text-xs font-semibold rounded-md transition-all">
                PE Chart
              </button>
              <button className="px-4 py-1.5 text-slate-500 hover:text-slate-900 font-sans text-xs font-semibold rounded-md transition-all">
                PB Chart
              </button>
            </div>
            
            {/* Dynamic reference line value sourced from the same livePriceVal */}
            <ChartPreview symbol={upperSymbol} exchange={profile.exchange} livePrice={livePriceVal} />
          </div>

          {/* Peer Comparison Section */}
          <div id="peers" className="bg-white border border-[#E5E8EF] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-[12.5px] font-semibold text-slate-555 uppercase tracking-[0.08em]">
                Peer Comparison
              </h3>
              {/* Dynamic sector label pulled from profile.sector */}
              <span className="text-[11.5px] font-mono text-slate-500 uppercase tracking-wide font-semibold">
                {profile.sector} sector peers
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E5E8EF] text-[14.5px] font-sans">
                <thead>
                  <tr className="bg-[#F4F7FE] text-[#1A6EFF] border-b border-[#E5E8EF] text-left text-[12.5px] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-bold text-left">Company</th>
                    <th className="text-right py-3.5 px-4 font-bold">
                      Price <span className="text-[#94A3B8] text-[10.5px] font-normal lowercase normal-case ml-0.5">{currencySuffixLabel}</span>
                    </th>
                    <th className="text-right py-3.5 px-4 font-bold">
                      MCAP <span className="text-[#94A3B8] text-[10.5px] font-normal lowercase normal-case ml-0.5">{mcapSuffixLabel}</span>
                    </th>
                    <th className="text-right py-3.5 px-4 font-bold">P/B</th>
                    <th className="text-right py-3.5 px-4 font-bold">P/E</th>
                    <th className="text-right py-3.5 px-4 font-bold">
                      EPS <span className="text-[#94A3B8] text-[10.5px] font-normal lowercase normal-case ml-0.5">{currencySuffixLabel}</span>
                    </th>
                    <th className="text-right py-3.5 px-4 font-bold">ROE %</th>
                    <th className="text-right py-3.5 px-4 font-bold">ROCE %</th>
                    <th className="text-right py-3.5 px-4 font-bold">P/S</th>
                    <th className="text-right py-3.5 px-4 font-bold">EV/EBITDA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E8EF] text-slate-700">
                  {/* Highlight current ticker row (AAPL) with a solid contiguous border and bg-[#F0F5FF]/50 */}
                  <tr className="bg-[#F0F5FF]/40 text-slate-900 font-bold">
                    <td className="py-3.5 px-4 text-[#1A6EFF] border-y-2 border-l-2 border-slate-900 font-bold">{profile.name} (This Ticker)</td>
                    <td className="text-right py-3.5 px-4 border-y-2 border-slate-900 font-bold">{formatPrice(livePriceVal, profile.exchange)}</td>
                    <td className="text-right py-3.5 px-4 border-y-2 border-slate-900 font-bold">{detailData.essentials.marketCapCr}</td>
                    <td className="text-right py-3.5 px-4 border-y-2 border-slate-900 font-bold">{detailData.essentials.pb}</td>
                    <td className="text-right py-3.5 px-4 border-y-2 border-slate-900 font-bold">{detailData.essentials.pe}</td>
                    <td className="text-right py-3.5 px-4 border-y-2 border-slate-900 font-bold">{detailData.essentials.epsTTM}</td>
                    <td className="text-right py-3.5 px-4 border-y-2 border-slate-900 font-bold text-[#16A34A]">{detailData.essentials.roe}</td>
                    <td className="text-right py-3.5 px-4 border-y-2 border-slate-900 font-bold text-[#16A34A]">{detailData.essentials.roce}</td>
                    <td className="text-right py-3.5 px-4 border-y-2 border-slate-900 font-bold">3.56</td>
                    <td className="text-right py-3.5 px-4 border-y-2 border-r-2 border-slate-900 font-bold">24.63</td>
                  </tr>
                  {isPeersPending ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400 animate-pulse">Loading competitors...</td>
                    </tr>
                  ) : peers && peers.length > 0 ? (
                    peers.filter(p => p.symbol !== upperSymbol).slice(0, 5).map((p, pIdx) => {
                      // Alternating row shading (#F8F9FB on even rows)
                      const isEven = pIdx % 2 === 1;
                      return (
                        <tr 
                          key={pIdx} 
                          className={`${isEven ? 'bg-[#F8F9FB]' : 'bg-white'} hover:bg-slate-50/70 transition cursor-pointer text-slate-700`} 
                          onClick={() => handlePeerClick(p.symbol)}
                        >
                          <td className="py-3.5 px-4 font-sans font-semibold text-[#1A6EFF]">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="hover:underline">{p.name}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setComparePeer(p);
                                }}
                                className="px-2 py-0.75 bg-[#1A6EFF]/10 hover:bg-[#1A6EFF]/20 text-[#1A6EFF] border border-[#1A6EFF]/15 rounded font-sans text-[10px] font-bold uppercase tracking-wider transition shrink-0 cursor-pointer"
                              >
                                Compare
                              </button>
                            </div>
                          </td>
                          <td className="text-right py-3.5 px-4 font-medium">{formatPrice(p.price, p.exchange)}</td>
                          <td className="text-right py-3.5 px-4">{formatMarketCap(p.mcap, p.exchange)}</td>
                          <td className="text-right py-3.5 px-4">{p.pb}</td>
                          <td className="text-right py-3.5 px-4">{p.pe}</td>
                          <td className="text-right py-3.5 px-4">{formatPrice(p.price * 0.08, p.exchange)}</td>
                          <td className="text-right py-3.5 px-4 text-[#16A34A] font-semibold">{p.roe}</td>
                          <td className="text-right py-3.5 px-4 text-[#16A34A] font-semibold">{(p.pe * 0.18).toFixed(2)}%</td>
                          <td className="text-right py-3.5 px-4">0.25</td>
                          <td className="text-right py-3.5 px-4">4.10</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={10} className="py-4 text-center text-slate-400">No peers loaded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Deep Side-by-Side Comparison Panel */}
            {comparePeer && (
              <div className="mt-6 p-5 bg-[#F8F9FB] border border-[#E5E8EF] rounded-xl space-y-4 animate-in slide-in-from-bottom-2 duration-200 relative shadow-sm">
                <button 
                  onClick={() => setComparePeer(null)} 
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-200/50 transition"
                  title="Close Comparison"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-2">
                  <Sparkles className="h-4.5 w-4.5 text-[#1A6EFF]" />
                  <h4 className="font-sans font-bold text-xs text-slate-800 uppercase tracking-wider">
                    Interactive Side-by-Side Analysis
                  </h4>
                </div>

                <div className="grid grid-cols-3 gap-4 text-xs font-sans">
                  <div className="font-bold text-slate-450 uppercase tracking-wider text-[10px] self-end pb-1 border-b border-slate-200">Metric</div>
                  <div className="font-bold text-[#1A6EFF] pb-1 border-b border-[#1A6EFF]/20 text-center uppercase tracking-wider truncate">{profile.name}</div>
                  <div className="font-bold text-[#6366F1] pb-1 border-b border-[#6366F1]/20 text-center uppercase tracking-wider truncate">{comparePeer.name}</div>

                  <div className="font-semibold text-slate-500 py-1.5 border-b border-slate-100">Last Price</div>
                  <div className="font-mono font-bold text-slate-900 py-1.5 border-b border-slate-100 text-center">{formatPrice(livePriceVal, profile.exchange)}</div>
                  <div className="font-mono font-bold text-slate-950 py-1.5 border-b border-slate-100 text-center">{formatPrice(comparePeer.price, comparePeer.exchange)}</div>

                  <div className="font-semibold text-slate-500 py-1.5 border-b border-slate-100">Market Cap</div>
                  <div className="font-mono text-slate-700 py-1.5 border-b border-slate-100 text-center">{detailData.essentials.marketCapCr}</div>
                  <div className="font-mono text-slate-700 py-1.5 border-b border-slate-100 text-center">{formatMarketCap(comparePeer.mcap, comparePeer.exchange)}</div>

                  <div className="font-semibold text-slate-500 py-1.5 border-b border-slate-100">Price to Earnings (P/E)</div>
                  <div className="font-mono text-slate-700 py-1.5 border-b border-slate-100 text-center">{detailData.essentials.pe || ratios?.pe || '41.04'}</div>
                  <div className="font-mono text-slate-700 py-1.5 border-b border-slate-100 text-center">{comparePeer.pe || 'N/A'}</div>

                  <div className="font-semibold text-slate-500 py-1.5 border-b border-slate-100">Price to Book (P/B)</div>
                  <div className="font-mono text-slate-700 py-1.5 border-b border-slate-100 text-center">{detailData.essentials.pb || ratios?.pb || '3.18'}</div>
                  <div className="font-mono text-slate-700 py-1.5 border-b border-slate-100 text-center">{comparePeer.pb || 'N/A'}</div>

                  <div className="font-semibold text-slate-500 py-1.5 border-b border-slate-100">Return on Equity (ROE)</div>
                  <div className="font-mono text-[#16A34A] font-bold py-1.5 border-b border-slate-100 text-center">{detailData.essentials.roe || ratios?.roe || '7.91%'}</div>
                  <div className="font-mono text-[#16A34A] font-bold py-1.5 border-b border-slate-100 text-center">{comparePeer.roe || 'N/A'}</div>

                  <div className="font-semibold text-slate-500 py-1.5 border-b border-slate-100">Return on Capital (ROCE)</div>
                  <div className="font-mono text-[#16A34A] font-bold py-1.5 border-b border-slate-100 text-center">{detailData.essentials.roce || ratios?.roce || '7.92%'}</div>
                  <div className="font-mono text-[#16A34A] font-bold py-1.5 border-b border-slate-100 text-center">{(comparePeer.pe * 0.18).toFixed(2)}%</div>
                </div>
              </div>
            )}
            
            <div className="flex justify-center pt-2 border-t border-slate-100">
              <button className="text-[11px] font-sans font-bold text-[#1A6EFF] hover:underline">
                View Full Industry Peer Comparison →
              </button>
            </div>
          </div>

          {/* Ratios Comprehensive Sparklines Section */}
          <div id="ratios" className="bg-white border border-[#E5E8EF] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em]">
                Detailed Ratios Table
              </h3>
              <span className="text-[10px] font-mono text-slate-400">CAGR return intervals</span>
            </div>

            {/* Structured Grid layout with clean vertical/horizontal separators */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-white border border-[#E5E8EF] rounded-xl space-y-3 shadow-sm">
                <span className="text-[11px] font-sans text-slate-500 font-bold uppercase tracking-wider block">Sales Growth</span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-[9px] text-slate-400 font-sans font-bold block uppercase">1 Yr</span>
                    <span className={`font-mono font-bold text-xs mt-1 block ${getGrowthColorClass(detailData.ratiosHistorical.salesGrowth.yr1)}`}>{detailData.ratiosHistorical.salesGrowth.yr1}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-sans font-bold block uppercase">3 Yr</span>
                    <span className={`font-mono font-bold text-xs mt-1 block ${getGrowthColorClass(detailData.ratiosHistorical.salesGrowth.yr3)}`}>{detailData.ratiosHistorical.salesGrowth.yr3}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-sans font-bold block uppercase">5 Yr</span>
                    <span className={`font-mono font-bold text-xs mt-1 block ${getGrowthColorClass(detailData.ratiosHistorical.salesGrowth.yr5)}`}>{detailData.ratiosHistorical.salesGrowth.yr5}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-white border border-[#E5E8EF] rounded-xl space-y-3 shadow-sm">
                <span className="text-[11px] font-sans text-slate-500 font-bold uppercase tracking-wider block">Profit Growth</span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-[9px] text-slate-400 font-sans font-bold block uppercase">1 Yr</span>
                    <span className={`font-mono font-bold text-xs mt-1 block ${getGrowthColorClass(detailData.ratiosHistorical.profitGrowth.yr1)}`}>{detailData.ratiosHistorical.profitGrowth.yr1}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-sans font-bold block uppercase">3 Yr</span>
                    <span className={`font-mono font-bold text-xs mt-1 block ${getGrowthColorClass(detailData.ratiosHistorical.profitGrowth.yr3)}`}>{detailData.ratiosHistorical.profitGrowth.yr3}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-sans font-bold block uppercase">5 Yr</span>
                    <span className={`font-mono font-bold text-xs mt-1 block ${getGrowthColorClass(detailData.ratiosHistorical.profitGrowth.yr5)}`}>{detailData.ratiosHistorical.profitGrowth.yr5}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white border border-[#E5E8EF] rounded-xl space-y-3 shadow-sm">
                <span className="text-[11px] font-sans text-slate-500 font-bold uppercase tracking-wider block">ROE %</span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-[9px] text-slate-400 font-sans font-bold block uppercase">1 Yr</span>
                    <span className="font-mono font-bold text-slate-800 text-xs mt-1 block">{detailData.ratiosHistorical.roe.yr1}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-sans font-bold block uppercase">3 Yr</span>
                    <span className="font-mono font-bold text-slate-800 text-xs mt-1 block">{detailData.ratiosHistorical.roe.yr3}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-sans font-bold block uppercase">5 Yr</span>
                    <span className="font-mono font-bold text-slate-800 text-xs mt-1 block">{detailData.ratiosHistorical.roe.yr5}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white border border-[#E5E8EF] rounded-xl space-y-3 shadow-sm">
                <span className="text-[12.5px] font-sans text-slate-550 font-bold uppercase tracking-wider block">ROCE %</span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 font-sans font-semibold block uppercase">1 Yr</span>
                    <span className="font-mono font-bold text-slate-800 text-sm mt-1 block">{detailData.ratiosHistorical.roce.yr1}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-sans font-semibold block uppercase">3 Yr</span>
                    <span className="font-mono font-bold text-slate-800 text-sm mt-1 block">{detailData.ratiosHistorical.roce.yr3}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-sans font-semibold block uppercase">5 Yr</span>
                    <span className="font-mono font-bold text-slate-800 text-sm mt-1 block">{detailData.ratiosHistorical.roce.yr5}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Small single ratios cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              {[
                { tag: 'Debt/Equity', val: detailData.ratiosHistorical.debtEquity, isCustom: false, id: 'de', type: 'manual' },
                { tag: 'Price to Cash Flow', val: detailData.ratiosHistorical.priceToCashFlow, isCustom: false, id: 'pcf', type: 'manual' },
                { tag: 'Interest Cover Ratio', val: detailData.ratiosHistorical.interestCoverage, isCustom: false, id: 'icr', type: 'manual' },
                { tag: 'CFO/PAT (5 Yr. Avg.)', val: detailData.ratiosHistorical.cfoPatRatio, isCustom: false, id: 'cfopat', type: 'manual' },
                ...customRatios.map(r => ({ 
                  tag: r.tag, 
                  val: computeCalculatedRatioValue(r), 
                  isCustom: true, 
                  id: r.id, 
                  type: r.type 
                }))
              ].map((item, idx) => (
                <div key={idx} className="p-3.5 bg-white border border-[#E5E8EF] rounded-xl flex justify-between items-center shadow-sm group hover:border-[#1A6EFF]/50 transition relative overflow-hidden">
                  <div className="flex flex-col gap-0.5">
                    {item.isCustom && (
                      <span className="text-[9px] bg-blue-50 text-[#1A6EFF] px-1.5 py-0.2 rounded font-sans font-bold w-fit uppercase tracking-wider scale-90 -ml-1">
                        {item.type === 'manual' ? 'Custom' : 'Calculated'}
                      </span>
                    )}
                    <span className="text-[11.5px] font-sans text-slate-555 font-bold uppercase tracking-wider">{item.tag}</span>
                  </div>
                  <div className="flex items-center gap-1.5 z-10">
                    <span className="font-mono font-bold text-slate-900 text-base">{item.val}</span>
                    {item.isCustom && (
                      <button
                        onClick={() => handleDeleteCustomRatio(item.id)}
                        className="text-slate-400 hover:text-red-500 transition p-0.5 cursor-pointer"
                        title="Delete custom ratio"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Dynamic Add Ratio form card */}
              {!showAddRatioForm ? (
                <button
                  onClick={() => setShowAddRatioForm(true)}
                  className="p-3.5 bg-slate-50 border border-dashed border-[#E5E8EF] rounded-xl flex items-center justify-center gap-2 hover:bg-slate-100/50 hover:border-slate-300 transition shadow-sm text-xs font-semibold text-[#1A6EFF] cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Custom Ratio</span>
                </button>
              ) : (
                <div className="p-4 bg-slate-50 border border-[#E5E8EF] rounded-xl flex flex-col gap-3.5 shadow-sm col-span-2 text-xs">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[9px]">Custom Ratio Builder</span>
                    {/* Tab Switcher */}
                    <div className="flex bg-slate-200/60 p-0.5 rounded-lg border border-slate-200 shrink-0 gap-0.5 text-[10px]">
                      {[
                        { id: 'formula', label: 'Formula' },
                        { id: 'custom_division', label: 'Division' },
                        { id: 'manual', label: 'Manual' }
                      ].map((tab) => (
                        <button
                          type="button"
                          key={tab.id}
                          onClick={() => setRatioBuilderMode(tab.id as any)}
                          className={`px-2 py-0.5 font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                            ratioBuilderMode === tab.id 
                              ? 'bg-[#1A6EFF] text-white font-bold shadow-xs' 
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {ratioBuilderMode === 'formula' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Select Financial Formula</label>
                      <select
                        value={selectedFormula}
                        onChange={(e) => setSelectedFormula(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#E5E8EF] rounded-lg focus:outline-none focus:border-[#1A6EFF] text-xs font-sans cursor-pointer"
                      >
                        <option value="peg">PEG Ratio (PE / Sales Growth)</option>
                        <option value="ev_ebitda">EV / EBITDA (Enterprise Value / EBITDA)</option>
                        <option value="ev_revenue">EV / Revenue (Enterprise Value / Revenue)</option>
                        <option value="debt_ebitda">Debt / EBITDA (Total Debt / EBITDA)</option>
                        <option value="cash_debt">Cash / Debt Ratio (Total Cash / Total Debt)</option>
                        <option value="price_sales">Price to Sales (Market Cap / Revenue)</option>
                        <option value="fcf_yield">Free Cash Flow Yield % (FCF / Market Cap)</option>
                        <option value="op_margin">Operating Margin % (EBITDA / Revenue)</option>
                      </select>
                      <span className="text-[9px] text-slate-400 font-mono block italic">
                        Calculated dynamically using current live price and financial reports.
                      </span>
                    </div>
                  )}

                  {ratioBuilderMode === 'custom_division' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Numerator</label>
                          <select
                            value={numKey}
                            onChange={(e) => setNumKey(e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-[#E5E8EF] rounded-lg focus:outline-none focus:border-[#1A6EFF] text-xs font-sans cursor-pointer"
                          >
                            {availableMetrics.map(m => (
                              <option key={m.key} value={m.key}>{m.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Denominator</label>
                          <select
                            value={denKey}
                            onChange={(e) => setDenKey(e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-[#E5E8EF] rounded-lg focus:outline-none focus:border-[#1A6EFF] text-xs font-sans cursor-pointer"
                          >
                            {availableMetrics.map(m => (
                              <option key={m.key} value={m.key}>{m.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Custom Ratio Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Cash to Assets Ratio"
                          value={newRatioName}
                          onChange={(e) => setNewRatioName(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#E5E8EF] rounded-lg focus:outline-none focus:border-[#1A6EFF] font-sans"
                        />
                      </div>
                    </div>
                  )}

                  {ratioBuilderMode === 'manual' && (
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Ratio Name</label>
                        <input
                          type="text"
                          placeholder="e.g. NPM %"
                          value={newRatioName}
                          onChange={(e) => setNewRatioName(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#E5E8EF] rounded-lg focus:outline-none focus:border-[#1A6EFF]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Static Value</label>
                        <input
                          type="text"
                          placeholder="e.g. 24.5%"
                          value={newRatioValue}
                          onChange={(e) => setNewRatioValue(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#E5E8EF] rounded-lg focus:outline-none focus:border-[#1A6EFF]"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 text-[10px] border-t border-slate-200/60 pt-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddRatioForm(false);
                        setNewRatioName('');
                        setNewRatioValue('');
                      }}
                      className="px-2.5 py-1 text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddCustomRatio}
                      className="px-3.5 py-1.5 bg-[#1A6EFF] text-white rounded-md font-bold hover:bg-[#1A6EFF]/90 transition cursor-pointer"
                    >
                      Add Custom Ratio
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Shareholding Pattern & Promoter pledging */}
        <div id="shareholding" className="space-y-6 scroll-mt-20">
          <div className="bg-white border border-[#E5E8EF] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em]">
                Shareholding Pattern
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Equity capital split</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Redesigned Donut: increased thickness (inner radius to 55%), legend moved to the right in a vertical list */}
              <div className="flex flex-row items-center gap-8 pl-4">
                <div className="relative h-32 w-32 shrink-0 flex items-center justify-center">
                  <ShareholdingDonut 
                    promoters={detailData.shareholding.promoters}
                    dii={detailData.shareholding.dii}
                    fii={detailData.shareholding.fii}
                    publicPct={detailData.shareholding.public}
                  />
                </div>
                
                <div className="flex flex-col gap-3 font-sans text-[13.5px] w-full max-w-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-[#1A6EFF] rounded-sm shrink-0" />
                      <span className="text-slate-600 font-semibold">Promoters</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">{detailData.shareholding.promoters}%</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-[#6366F1] rounded-sm shrink-0" />
                      <span className="text-slate-600 font-semibold">FII</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">{detailData.shareholding.fii}%</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-[#0EA5E9] rounded-sm shrink-0" />
                      <span className="text-slate-600 font-semibold">DII</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">{detailData.shareholding.dii}%</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-[#CBD5E1] rounded-sm shrink-0" />
                      <span className="text-slate-600 font-semibold">Public</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">{detailData.shareholding.public}%</span>
                  </div>
                </div>
              </div>

              {/* Promoters pledging history table */}
              <div className="space-y-3.5">
                <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em]">
                  Promoter Pledging %
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[#E5E8EF] text-[13px] font-sans">
                    <thead>
                      <tr className="text-slate-500 text-left border-b border-[#E5E8EF]">
                        <th className="py-2 font-bold uppercase tracking-wider text-[11.5px]">Date</th>
                        <th className="py-2 font-bold text-center uppercase tracking-wider text-[11.5px]">Promoter %</th>
                        <th className="py-2 font-bold text-right uppercase tracking-wider text-[11.5px]">Pledge %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {detailData.shareholding.pledgedList.map((row, i) => (
                        <tr key={i}>
                          <td className="py-2.5 font-semibold text-slate-800">{row.date}</td>
                          <td className="py-2.5 text-center font-mono">{row.promoterPct}</td>
                          <td className="py-2.5 text-right font-mono font-bold text-[#16A34A]">{row.pledgePct}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Strengths and limitations: Combined into a single card split vertically by a 1px divider */}
          <div className="bg-white border border-[#E5E8EF] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-[#E5E8EF]">
              
              {/* Strengths Card */}
              <div className="space-y-4 pb-6 md:pb-0">
                <h4 className="text-[12.5px] font-semibold text-slate-555 uppercase tracking-[0.08em] flex items-center gap-1.5">
                  <span className="text-[#16A34A] font-bold text-sm">✓</span>
                  <span>Company Strengths</span>
                </h4>
                <ul className="text-[13.5px] text-slate-700 space-y-2.5 leading-relaxed">
                  {detailData.strengths.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#16A34A] font-bold shrink-0 mt-0.5">✓</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Limitations Card */}
              <div className="space-y-4 pt-6 md:pt-0 md:pl-8">
                <h4 className="text-[12.5px] font-semibold text-slate-555 uppercase tracking-[0.08em] flex items-center gap-1.5">
                  <span className="text-[#DC2626] font-bold text-sm">⚠</span>
                  <span>Company Limitations</span>
                </h4>
                <ul className="text-[13.5px] text-slate-700 space-y-2.5 leading-relaxed">
                  {detailData.limitations.map((lim, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#DC2626] font-bold shrink-0 mt-0.5">⚠</span>
                      <span>{lim}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Financial Statement tables (Anchor) */}
        <div id="financials" className="space-y-6 scroll-mt-20">
          <div id="statements-sect" className="bg-white border border-[#E5E8EF] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-5">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em]">
                  Financial Results & Statements
                </h3>
                <p className="text-[10px] font-mono text-slate-400 mt-1">All historical variables and details are formatted in consolidated cr.</p>
              </div>

              {/* Tab buttons switcher - styled as pill toggles */}
              <div className="flex bg-slate-50 p-1 rounded-lg border border-[#E5E8EF] overflow-x-auto scrollbar-none w-full lg:w-auto shrink-0 gap-1">
                {[
                  { id: 'quarterly', label: 'Quarterly Result' },
                  { id: 'pnl', label: 'Profit & Loss' },
                  { id: 'balance', label: 'Balance Sheet' },
                  { id: 'cash', label: 'Cash Flows' },
                  { id: 'corpAction', label: 'Corp. Actions' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveStatementTab(tab.id as any)}
                    className={`flex-1 lg:flex-none px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                      activeStatementTab === tab.id 
                        ? 'bg-[#1A6EFF] text-white shadow-sm font-bold' 
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table Render Zone with alternating rows and no vertical borders */}
            {activeStatementTab === 'quarterly' && (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[#E5E8EF] text-[14.5px] font-sans">
                    <thead>
                      <tr className="bg-[#F4F7FE] text-[#1A6EFF] border-b border-[#E5E8EF] text-left text-[12.5px] font-bold uppercase tracking-wider">
                        <th className="py-3.5 px-4 font-bold text-left">Particulars</th>
                        {detailData.quarterlyResults[0]?.periods.map((period, i) => (
                          <th key={i} className="text-right py-3.5 px-4 font-bold pl-4">{period}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {detailData.quarterlyResults.map((row, rIdx) => {
                        const isBoldRow = ['Net Sales', 'Revenue', 'Gross Profit', 'Operating Profit', 'Operating Profit (EBITDA)', 'Profit After Tax', 'Net Profit / Net Income', 'Total Income'].includes(row.particulars);
                        const isEven = rIdx % 2 === 1;
                        return (
                          <tr key={rIdx} className={`${isBoldRow ? 'font-bold text-slate-900 bg-[#F4F7FE]/30' : isEven ? 'bg-slate-50/20' : 'bg-white'} hover:bg-slate-50/50 transition`}>
                            <td className="py-3.5 px-4 font-sans font-medium text-slate-800 flex items-center gap-1.5">
                              <span>{row.particulars}</span>
                              <HelpCircle className="h-3.5 w-3.5 text-slate-400 hover:text-slate-650 cursor-pointer shrink-0" />
                            </td>
                            {row.values[0]?.map((value, vIdx) => (
                              <td key={vIdx} className="text-right py-3.5 px-4 pl-4 font-sans font-medium">{value}</td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeStatementTab === 'pnl' && (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[#E5E8EF] text-[14.5px] font-sans">
                    <thead>
                      <tr className="bg-[#F4F7FE] text-[#1A6EFF] border-b border-[#E5E8EF] text-left text-[12.5px] font-bold uppercase tracking-wider">
                        <th className="py-3.5 px-4 font-bold text-left">Particulars</th>
                        {detailData.annualPnL[0]?.periods.map((period, i) => (
                          <th key={i} className="text-right py-3.5 px-4 font-bold pl-4">{period}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {detailData.annualPnL.map((row, rIdx) => {
                        const isBoldRow = ['Net Sales', 'Revenue', 'Gross Profit', 'Operating Profit', 'Operating Profit (EBITDA)', 'Net Profit', 'Net Profit / Net Income', 'Total Revenue'].includes(row.particulars);
                        const isEven = rIdx % 2 === 1;
                        return (
                          <tr key={rIdx} className={`${isBoldRow ? 'font-bold text-slate-900 bg-[#F4F7FE]/30' : isEven ? 'bg-slate-50/20' : 'bg-white'} hover:bg-slate-50/50 transition`}>
                            <td className="py-3.5 px-4 font-sans font-medium text-slate-800 flex items-center gap-1.5">
                              <span>{row.particulars}</span>
                              <HelpCircle className="h-3.5 w-3.5 text-slate-400 hover:text-slate-650 cursor-pointer shrink-0" />
                            </td>
                            {row.values[0]?.map((value, vIdx) => (
                              <td key={vIdx} className="text-right py-3.5 px-4 pl-4 font-sans font-medium">{value}</td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeStatementTab === 'balance' && (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[#E5E8EF] text-[14.5px] font-sans">
                    <thead>
                      <tr className="bg-[#F4F7FE] text-[#1A6EFF] border-b border-[#E5E8EF] text-left text-[12.5px] font-bold uppercase tracking-wider">
                        <th className="py-3.5 px-4 font-bold text-left">Particulars</th>
                        {detailData.balanceSheet[0]?.periods.map((period, i) => (
                          <th key={i} className="text-right py-3.5 px-4 font-bold pl-4">{period}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {detailData.balanceSheet.map((row, rIdx) => {
                        const isBoldRow = ['Total Reserves', 'Total Shareholders\' Equity', 'Total Debt (Borrowings)', 'Total Liabilities', 'Total Assets'].includes(row.particulars);
                        const isEven = rIdx % 2 === 1;
                        return (
                          <tr key={rIdx} className={`${isBoldRow ? 'font-bold text-slate-900 bg-[#F4F7FE]/30' : isEven ? 'bg-slate-50/20' : 'bg-white'} hover:bg-slate-50/50 transition`}>
                            <td className="py-3.5 px-4 font-sans font-medium text-slate-800 flex items-center gap-1.5">
                              <span>{row.particulars}</span>
                              <HelpCircle className="h-3.5 w-3.5 text-slate-400 hover:text-slate-650 cursor-pointer shrink-0" />
                            </td>
                            {row.values[0]?.map((value, vIdx) => (
                              <td key={vIdx} className="text-right py-3.5 px-4 pl-4 font-sans font-medium">{value}</td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeStatementTab === 'cash' && (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[#E5E8EF] text-[14.5px] font-sans">
                    <thead>
                      <tr className="bg-[#F4F7FE] text-[#1A6EFF] border-b border-[#E5E8EF] text-left text-[12.5px] font-bold uppercase tracking-wider">
                        <th className="py-3.5 px-4 font-bold text-left">Particulars</th>
                        {detailData.cashFlows[0]?.periods.map((period, i) => (
                          <th key={i} className="text-right py-3.5 px-4 font-bold pl-4">{period}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {detailData.cashFlows.map((row, rIdx) => {
                        const isBoldRow = ['Operating Cash Flow', 'Net Cash Flow', 'Free Cash Flow (FCF)'].includes(row.particulars);
                        const isEven = rIdx % 2 === 1;
                        return (
                          <tr key={rIdx} className={`${isBoldRow ? 'font-bold text-slate-900 bg-[#F4F7FE]/30' : isEven ? 'bg-slate-50/20' : 'bg-white'} hover:bg-slate-50/50 transition`}>
                            <td className="py-3.5 px-4 font-sans font-medium text-slate-800 flex items-center gap-1.5">
                              <span>{row.particulars}</span>
                              <HelpCircle className="h-3.5 w-3.5 text-slate-400 hover:text-slate-650 cursor-pointer shrink-0" />
                            </td>
                            {row.values[0]?.map((value, vIdx) => (
                              <td key={vIdx} className="text-right py-3.5 px-4 pl-4 font-sans font-medium">{value}</td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeStatementTab === 'corpAction' && (
              <div className="space-y-5">
                {/* Sub-tabs switchers */}
                <div className="flex bg-slate-50 p-1 rounded-lg border border-[#E5E8EF] max-w-sm gap-1">
                  {[
                    { id: 'dividend', label: 'Dividend' },
                    { id: 'bonus', label: 'Bonus' },
                    { id: 'rights', label: 'Rights' },
                    { id: 'splits', label: 'Splits' }
                  ].map((subTab) => (
                    <button
                      key={subTab.id}
                      onClick={() => setActiveCorpActionSubTab(subTab.id as any)}
                      className={`flex-1 px-3 py-1.5 font-sans text-xs font-semibold rounded-md transition-all ${
                        activeCorpActionSubTab === subTab.id 
                          ? 'bg-[#1A6EFF] text-white shadow-sm font-bold' 
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {subTab.label}
                    </button>
                  ))}
                </div>

                {activeCorpActionSubTab === 'dividend' && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-[#E5E8EF] text-[13.5px] font-sans">
                      <thead>
                        <tr className="text-slate-500 font-bold text-left border-b border-[#E5E8EF] text-[11.5px] uppercase tracking-wider">
                          <th className="py-2 font-bold text-left">EX DATE</th>
                          <th className="py-2 font-bold">RECORD DATE</th>
                          <th className="py-2 text-center font-bold">DIVIDEND %</th>
                          <th className="py-2 text-right font-bold">
                            AMOUNT <span className="text-[#94A3B8] text-[9.5px] font-normal lowercase normal-case ml-0.5">{currencySuffixLabel}</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {detailData.corporateActions.dividend.length > 0 ? (
                          detailData.corporateActions.dividend.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition">
                              <td className="py-2.5 font-bold text-slate-950">{row.exDate}</td>
                              <td className="py-2.5 text-slate-600">{row.recordDate}</td>
                              <td className="py-2.5 text-center font-semibold text-slate-800">{row.divPct}%</td>
                              <td className="py-2.5 text-right font-bold text-[#16A34A] font-mono">{row.amount}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-slate-400">No recent dividends reported.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeCorpActionSubTab === 'bonus' && (
                  <div className="overflow-x-auto animate-in fade-in duration-100">
                    <table className="min-w-full divide-y divide-[#E5E8EF] text-[13.5px] font-sans">
                      <thead>
                        <tr className="text-slate-500 font-bold text-left border-b border-[#E5E8EF] text-[11.5px] uppercase tracking-wider">
                          <th className="py-2 font-bold text-left">EX DATE</th>
                          <th className="py-2 text-right font-bold">RATIO</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {detailData.corporateActions.bonus.length > 0 ? (
                          detailData.corporateActions.bonus.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition">
                              <td className="py-2.5 font-bold text-slate-950">{row.exDate}</td>
                              <td className="py-2.5 text-right font-bold text-[#16A34A]">{row.ratio}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={2} className="py-4 text-center text-slate-400">No recent bonus declarations.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeCorpActionSubTab === 'rights' && (
                  <div className="overflow-x-auto animate-in fade-in duration-100">
                    <table className="min-w-full divide-y divide-[#E5E8EF] text-[13.5px] font-sans">
                      <thead>
                        <tr className="text-slate-500 font-bold text-left border-b border-[#E5E8EF] text-[11.5px] uppercase tracking-wider">
                          <th className="py-2 font-bold text-left">EX DATE</th>
                          <th className="py-2 text-center font-bold">RATIO</th>
                          <th className="py-2 text-right font-bold">PRICE</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {detailData.corporateActions.rights.length > 0 ? (
                          detailData.corporateActions.rights.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition">
                              <td className="py-2.5 font-semibold text-slate-950">{row.exDate}</td>
                              <td className="py-2.5 text-center font-bold text-slate-800">{row.ratio}</td>
                              <td className="py-2.5 text-right font-bold text-[#1A6EFF] font-mono">₹ {row.price}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="py-4 text-center text-slate-400">No active rights operations.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeCorpActionSubTab === 'splits' && (
                  <div className="py-4 text-center text-slate-400 text-xs font-mono animate-in fade-in duration-100">
                    No stock split data reported for this asset.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Super Investors widget group */}
        <div id="info" className="space-y-6 scroll-mt-20">
          <div id="investors" className="bg-white border border-[#E5E8EF] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em]">
                Institutional Investors Details
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Substantial portfolios holding</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {detailData.superInvestors.map((inv, idx) => (
                <div key={idx} className="p-4 bg-white border border-[#E5E8EF] rounded-xl flex items-center gap-4 transition hover:border-[#1A6EFF] shadow-sm hover:shadow-md">
                  <div className="h-10 w-10 rounded-full bg-[#1A6EFF] text-white font-sans font-bold flex items-center justify-center text-sm shadow-xs">
                    {inv.avatar}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-sans font-bold text-slate-800 text-xs truncate uppercase tracking-tight">{inv.name}</p>
                    <p className="font-mono text-[11.5px] font-bold text-[#1A6EFF]">{inv.holdingVal}</p>
                    <p className="text-[9px] font-mono text-slate-400 uppercase tracking-wide">{inv.period}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive FAQ list accordion */}
          <div id="faqs" className="bg-white border border-[#E5E8EF] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
            <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] border-b border-slate-100 pb-3">
              Frequently Asked Questions (FAQs)
            </h3>

            <div className="divide-y divide-slate-100">
              {detailData.faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div key={idx} className="py-3.5">
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full flex justify-between items-center text-left py-1 group focus:outline-none"
                    >
                      <span className="font-sans font-semibold text-xs text-slate-800 group-hover:text-[#1A6EFF] transition">
                        {faq.q}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-[#1A6EFF] shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-[#1A6EFF] shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <p className="font-sans text-xs text-slate-600 bg-slate-50 p-3.5 rounded-lg border border-slate-100 mt-2.5 leading-relaxed text-justify animate-in slide-in-from-top-1 duration-150">
                        {faq.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Equity news bulletins block card list */}
          <div className="bg-white border border-[#E5E8EF] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
            <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] border-b border-slate-100 pb-2">
              Corporate Actions & Bulletins Feed
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-1">
              {[
                {
                  title: `${profile.name} Analyzed: Key Profit Dip triggers`,
                  summary: "A brief breakdown of how consolidated energy metrics affected capital structures in recent filings.",
                  pubDate: "05 Jun 2026",
                },
                {
                  title: "Refinery and Infrastructure: New Energy Venture",
                  summary: "Major operational review regarding international strategic energy integration plans.",
                  pubDate: "28 May 2026",
                },
                {
                  title: `${upperSymbol} Rally: Why institutional advisors are bullish`,
                  summary: "Exploration into technical valuation flags with ROE multiple reviews.",
                  pubDate: "14 May 2026",
                },
                {
                  title: `Future Prospect: Initial IPO stakes and spin-off details`,
                  summary: "A holistic deep-dive into corporate spinoff matrices and debt-equity restructuring actions.",
                  pubDate: "10 Apr 2026",
                }
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-[#E5E8EF] bg-white flex flex-col justify-between hover:border-[#1A6EFF]/30 hover:shadow-md transition">
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider block">
                      {item.pubDate}
                    </span>
                    <h4 className="font-sans font-bold text-xs text-slate-900 line-clamp-2 hover:text-[#1A6EFF]">
                      {item.title}
                    </h4>
                    <p className="font-sans text-[11px] text-slate-500 line-clamp-3 leading-relaxed">
                      {item.summary}
                    </p>
                  </div>
                  <button className="text-[10px] font-mono font-bold text-[#1A6EFF] hover:underline text-left mt-4 uppercase">
                    Continue Reading →
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Redesigned Slim Upsell Banner - 1 row, white background, blue left border (4px) */}
          <div className="bg-white border border-[#E5E8EF] border-l-4 border-l-[#1A6EFF] p-5 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col md:flex-row justify-between items-center gap-4 mt-6">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="bg-[#1A6EFF]/10 text-[#1A6EFF] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 select-none">PRO</div>
              <p className="text-sm font-medium text-slate-800 text-center md:text-left">
                Get DuPont Analysis, historic 10-year filings, and 50 premium stock templates on <span className="font-bold text-[#1A6EFF]">StockLens PRO & TickerPlus</span>.
              </p>
            </div>
            <button className="px-4 py-2 bg-[#1A6EFF] text-white font-sans text-xs font-bold rounded-lg hover:bg-[#1A6EFF]/90 transition duration-150 shrink-0 shadow-xs">
              CLAIM 7-DAY FREE TRIAL
            </button>
          </div>

        </div>

        {/* SEC EDGAR Integration Section */}
        <div id="sec" className="space-y-6 scroll-mt-20">
          <div className="bg-white border border-[#E5E8EF] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-5">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-[14px] font-bold text-slate-900 uppercase tracking-[0.08em] flex items-center gap-1.5">
                  <span>🏛️ SEC EDGAR Filings Integration</span>
                  <span className="bg-blue-50 text-[#1A6EFF] text-[10px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider font-semibold">Live Integration</span>
                </h3>
                <p className="text-[11px] font-medium text-slate-400 mt-1">
                  Access standardized financial statements, form 4 insider transactions, institutional 13F portfolios, and AI-powered 10-K section diffing.
                </p>
              </div>

              {/* Interactive sub-tabs switcher */}
              <div className="flex bg-slate-50 p-1 rounded-lg border border-[#E5E8EF] overflow-x-auto scrollbar-none w-full lg:w-auto shrink-0 gap-1">
                {[
                  { id: 'standardized', label: '📊 Standardized Statements' },
                  { id: 'insiders', label: '👥 Insider Activities' },
                  { id: 'holdings', label: '🏢 Institutional Holdings' },
                  { id: 'tenk', label: '📄 10-K Analysis' }
                ].map((subTab) => (
                  <button
                    key={subTab.id}
                    onClick={() => {
                      setActiveSecSubTab(subTab.id as any);
                    }}
                    className={`flex-1 lg:flex-none px-4 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                      activeSecSubTab === subTab.id 
                        ? 'bg-[#1A6EFF] text-white shadow-sm font-bold' 
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
                    }`}
                  >
                    {subTab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-tab: Standardized Statements */}
            {activeSecSubTab === 'standardized' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="bg-slate-50 rounded-xl p-4 border border-[#E5E8EF] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'income', label: 'Income Statement' },
                      { id: 'balance', label: 'Balance Sheet' },
                      { id: 'cash', label: 'Cash Flow' }
                    ].map((stmt) => (
                      <button
                        key={stmt.id}
                        onClick={() => setActiveSecStatement(stmt.id as any)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                          activeSecStatement === stmt.id
                            ? 'bg-white border-[#1A6EFF] text-[#1A6EFF] shadow-xs font-bold'
                            : 'bg-white border-[#E5E8EF] text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {stmt.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2.5 w-full md:w-auto">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide shrink-0">Compare with Peer:</span>
                    <div className="relative flex-1 md:flex-none">
                      <select
                        value={secComparePeer}
                        onChange={(e) => setSecComparePeer(e.target.value)}
                        className="w-full md:w-48 bg-white border border-[#E5E8EF] rounded-lg py-1.5 px-3 text-xs font-sans font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1A6EFF]"
                      >
                        <option value="">None (Select Ticker)</option>
                        {peers && peers.filter(p => p.symbol !== upperSymbol).map(peer => (
                          <option key={peer.symbol} value={peer.symbol}>
                            {peer.symbol} - {peer.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {secComparePeer && (
                      <button
                        onClick={() => setSecComparePeer('')}
                        className="px-2.5 py-1.5 text-[10px] text-red-500 hover:bg-red-50 border border-red-200 rounded-lg font-bold uppercase transition"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {isEdgarFinancialsPending ? (
                  <div className="py-10 text-center space-y-2">
                    <div className="text-slate-400 animate-pulse text-sm font-medium">Fetching SEC EDGAR XBRL data…</div>
                    <div className="text-slate-300 text-xs">This can take 30–60 seconds on first load</div>
                  </div>
                ) : isEdgarFinancialsError ? (
                  <div className="py-8 text-center text-red-400 text-sm">⚠️ Could not load SEC financials for {upperSymbol}. The company may not be SEC-registered or EDGAR data is unavailable right now.</div>
                ) : edgarFinancials ? (
                  <div className="overflow-x-auto border border-[#E5E8EF] rounded-xl">
                    <table className="min-w-full divide-y divide-[#E5E8EF] text-[13.5px] font-sans">
                      <thead>
                        <tr className="bg-[#F4F7FE] text-[#1A6EFF] border-b border-[#E5E8EF] text-left text-[11px] font-bold uppercase tracking-wider">
                          <th className="py-3 px-4 font-bold">Standardized Item (USD in Millions)</th>
                          {secComparePeer ? (
                            <>
                              <th className="py-3 px-4 text-right font-bold bg-[#E6F0FF]/30">{upperSymbol} (2025)</th>
                              <th className="py-3 px-4 text-right font-bold bg-[#EEF2FF]/40">{secComparePeer} (2025)</th>
                              <th className="py-3 px-4 text-right font-bold bg-[#E6F0FF]/30">{upperSymbol} (2024)</th>
                              <th className="py-3 px-4 text-right font-bold bg-[#EEF2FF]/40">{secComparePeer} (2024)</th>
                              <th className="py-3 px-4 text-right font-bold bg-[#E6F0FF]/30">{upperSymbol} (2023)</th>
                              <th className="py-3 px-4 text-right font-bold bg-[#EEF2FF]/40">{secComparePeer} (2023)</th>
                            </>
                          ) : (
                            <>
                              <th className="py-3 px-4 text-right font-bold">FY 2025</th>
                              <th className="py-3 px-4 text-right font-bold">FY 2024</th>
                              <th className="py-3 px-4 text-right font-bold">FY 2023</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                        {(() => {
                          const statementKey = activeSecStatement === 'income'
                            ? 'incomeStatement'
                            : activeSecStatement === 'balance'
                              ? 'balanceSheet'
                              : 'cashFlow';

                          const activeRows = edgarFinancials[statementKey] || [];
                          const peerRows = edgarCompareFinancials ? edgarCompareFinancials[statementKey] || [] : [];

                          return activeRows.map((row: any, rIdx: number) => {
                            const peerRow = peerRows.find((pr: any) => pr.label === row.label);
                            const isBoldRow = ['Total Revenue', 'Gross Profit', 'Operating Income', 'Net Income', 'Total Assets', 'Total Liabilities', 'Total Stockholders Equity', 'Operating Cash Flow', 'Free Cash Flow'].includes(row.label);
                            
                            const formatVal = (val: any) => {
                              if (val === undefined || val === null) return '—';
                              if (typeof val === 'number') {
                                if (row.label.includes('EPS')) {
                                  return `$${val.toFixed(2)}`;
                                }
                                return `$${val.toLocaleString()}M`;
                              }
                              return val;
                            };

                            return (
                              <tr
                                key={rIdx}
                                className={`${
                                  isBoldRow 
                                    ? 'font-bold text-slate-900 bg-[#F4F7FE]/20' 
                                    : rIdx % 2 === 1 
                                      ? 'bg-slate-50/10' 
                                      : 'bg-white'
                                } hover:bg-slate-50/40 transition`}
                              >
                                <td className="py-3 px-4 font-sans font-medium text-slate-800">{row.label}</td>
                                {secComparePeer ? (
                                  <>
                                    <td className="py-3 px-4 text-right font-semibold bg-[#E6F0FF]/15 text-slate-900">{formatVal(row.values['2025'])}</td>
                                    <td className="py-3 px-4 text-right text-slate-650 bg-[#EEF2FF]/20">{formatVal(peerRow?.values['2025'])}</td>
                                    <td className="py-3 px-4 text-right font-semibold bg-[#E6F0FF]/15 text-slate-900">{formatVal(row.values['2024'])}</td>
                                    <td className="py-3 px-4 text-right text-slate-650 bg-[#EEF2FF]/20">{formatVal(peerRow?.values['2024'])}</td>
                                    <td className="py-3 px-4 text-right font-semibold bg-[#E6F0FF]/15 text-slate-900">{formatVal(row.values['2023'])}</td>
                                    <td className="py-3 px-4 text-right text-slate-650 bg-[#EEF2FF]/20">{formatVal(peerRow?.values['2023'])}</td>
                                  </>
                                ) : (
                                  <>
                                    <td className="py-3 px-4 text-right font-semibold text-slate-900">{formatVal(row.values['2025'])}</td>
                                    <td className="py-3 px-4 text-right text-slate-600">{formatVal(row.values['2024'])}</td>
                                    <td className="py-3 px-4 text-right text-slate-600">{formatVal(row.values['2023'])}</td>
                                  </>
                                )}
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-4 text-center text-slate-400">Failed to load statements.</div>
                )}
              </div>
            )}

            {/* Sub-tab: Insider Activities (Form 4) */}
            {activeSecSubTab === 'insiders' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Recent Form 4 Insider Filings ({upperSymbol})
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">Last 12 Months</span>
                </div>

                {isEdgarInsidersPending ? (
                  <div className="py-10 text-center space-y-2">
                    <div className="text-slate-400 animate-pulse text-sm font-medium">Fetching Form 4 insider filings…</div>
                    <div className="text-slate-300 text-xs">SEC EDGAR data may take 30–60 seconds</div>
                  </div>
                ) : isEdgarInsidersError ? (
                  <div className="py-8 text-center text-red-400 text-sm">⚠️ Could not load insider activities for {upperSymbol}. The company may not be SEC-registered.</div>
                ) : edgarInsiders && edgarInsiders.transactions ? (
                  <div className="overflow-x-auto border border-[#E5E8EF] rounded-xl">
                    <table className="min-w-full divide-y divide-[#E5E8EF] text-[13.5px] font-sans">
                      <thead>
                        <tr className="bg-[#F4F7FE] text-[#1A6EFF] border-b border-[#E5E8EF] text-left text-[11px] font-bold uppercase tracking-wider">
                          <th className="py-3 px-4 font-bold">Insider Name</th>
                          <th className="py-3 px-4 font-bold">Relationship / Role</th>
                          <th className="py-3 px-4 font-bold">Filing Date</th>
                          <th className="py-3 px-4 font-bold text-center">Action</th>
                          <th className="py-3 px-4 text-right font-bold">Shares</th>
                          <th className="py-3 px-4 text-right font-bold">Price</th>
                          <th className="py-3 px-4 text-right font-bold">Total Value</th>
                          <th className="py-3 px-4 text-center font-bold">Source</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                        {edgarInsiders.transactions.map((tx: any, tIdx: number) => {
                          let badgeClass = '';
                          if (tx.action === 'Buy') badgeClass = 'bg-emerald-50 text-[#16A34A] border border-[#16A34A]/15';
                          else if (tx.action === 'Sell') badgeClass = 'bg-rose-50 text-[#DC2626] border border-[#DC2626]/15';
                          else badgeClass = 'bg-blue-50 text-blue-600 border border-blue-150';

                          return (
                            <tr key={tIdx} className="hover:bg-slate-50/50 transition">
                              <td className="py-3 px-4 font-semibold text-slate-900">{tx.name}</td>
                              <td className="py-3 px-4 text-slate-600">{tx.relationship}</td>
                              <td className="py-3 px-4 font-mono font-medium text-slate-500">{formatDate(tx.date)}</td>
                              <td className="py-3 px-4 text-center">
                                <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}>
                                  {tx.action} ({tx.code})
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">{tx.shares.toLocaleString()}</td>
                              <td className="py-3 px-4 text-right font-mono text-slate-600">${tx.price.toFixed(2)}</td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">${tx.value.toLocaleString()}</td>
                              <td className="py-3 px-4 text-center">
                                <a
                                  href={tx.secLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex p-1.5 rounded-lg border border-[#E5E8EF] text-slate-400 hover:text-[#1A6EFF] hover:bg-[#1A6EFF]/5 transition"
                                  title="View SEC Source Form 4"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-4 text-center text-slate-400">No insider transactions found.</div>
                )}
              </div>
            )}

            {/* Sub-tab: Institutional Holdings (13F) */}
            {activeSecSubTab === 'holdings' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="bg-slate-50 rounded-xl p-4 border border-[#E5E8EF] space-y-3">
                  {/* Search bar */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (holdingsSearchInput.trim()) {
                        setHoldingsQuery(holdingsSearchInput.trim());
                      }
                    }}
                    className="flex flex-col sm:flex-row gap-2.5"
                  >
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search manager name, 10-digit SEC CIK, or ticker..."
                        value={holdingsSearchInput}
                        onChange={(e) => setHoldingsSearchInput(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-[#E5E8EF] rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1A6EFF] focus:border-[#1A6EFF]"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#1A6EFF] text-white font-sans text-xs font-bold rounded-xl hover:bg-[#1A6EFF]/90 transition shadow-3xs cursor-pointer"
                    >
                      Pull 13F Portfolio
                    </button>
                  </form>

                  {/* Quick access buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    <span className="font-bold text-slate-500 uppercase tracking-wide text-[10px]">Quick Access:</span>
                    {[
                      { label: 'Berkshire Hathaway', cik: '0001067983' },
                      { label: 'Bill Gates Fund', cik: '0001166559' },
                      { label: 'Soros Fund', cik: '0001029160' }
                    ].map((fund) => (
                      <button
                        key={fund.cik}
                        type="button"
                        onClick={() => {
                          setHoldingsSearchInput(fund.cik);
                          setHoldingsQuery(fund.cik);
                        }}
                        className={`px-3 py-1 bg-white border rounded-lg hover:border-[#1A6EFF] hover:text-[#1A6EFF] transition font-medium text-[11px] cursor-pointer ${
                          holdingsQuery === fund.cik
                            ? 'border-[#1A6EFF] text-[#1A6EFF] bg-blue-50/10 font-bold'
                            : 'border-[#E5E8EF] text-slate-600'
                        }`}
                      >
                        {fund.label}
                      </button>
                    ))}
                  </div>
                </div>

                {isEdgarHoldingsPending ? (
                  <div className="py-10 text-center space-y-2">
                    <div className="text-slate-400 animate-pulse text-sm font-medium">Fetching 13F institutional holdings…</div>
                    <div className="text-slate-300 text-xs">SEC EDGAR data may take 30–60 seconds</div>
                  </div>
                ) : isEdgarHoldingsError ? (
                  <div className="py-8 text-center text-red-400 text-sm">⚠️ Could not load 13F holdings data. This fund may not have filed 13F reports with the SEC.</div>
                ) : edgarHoldings ? (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1">
                        <Building className="h-4 w-4 text-[#1A6EFF]" />
                        <span>{edgarHoldings.managerName}</span>
                      </h4>
                      <div className="flex gap-2 text-[10px] font-mono text-slate-400 uppercase">
                        <span>Reporting Period: <strong>{edgarHoldings.portfolioDate}</strong></span>
                        <span>·</span>
                        <span>Source: <strong>SEC Form 13F-HR</strong></span>
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-[#E5E8EF] rounded-xl bg-white">
                      <table className="min-w-full divide-y divide-[#E5E8EF] text-[13.5px] font-sans">
                        <thead>
                          <tr className="bg-[#F4F7FE] text-[#1A6EFF] border-b border-[#E5E8EF] text-left text-[11px] font-bold uppercase tracking-wider">
                            <th className="py-3 px-4 font-bold">Ticker</th>
                            <th className="py-3 px-4 font-bold">Issuer Company Name</th>
                            <th className="py-3 px-4 text-right font-bold">Value (USD in Thousands)</th>
                            <th className="py-3 px-4 text-right font-bold">Shares Held</th>
                            <th className="py-3 px-4 text-center font-bold">Option Status</th>
                            <th className="py-3 px-4 text-right font-bold">QoQ Change</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {edgarHoldings.holdings && edgarHoldings.holdings.length > 0 ? (
                            edgarHoldings.holdings.map((hold: any, hIdx: number) => {
                              const isCall = hold.option === 'Call';
                              const isPut = hold.option === 'Put';
                              
                              let changeColor = 'text-slate-500';
                              if (hold.qoqChange.startsWith('+') || hold.qoqChange === 'New') {
                                changeColor = 'text-[#16A34A] font-bold';
                              } else if (hold.qoqChange.startsWith('-')) {
                                changeColor = 'text-[#DC2626] font-bold';
                              }

                              return (
                                <tr key={hIdx} className="hover:bg-slate-50/50 transition">
                                  <td className="py-3 px-4 font-mono font-bold text-[#1A6EFF]">{hold.ticker}</td>
                                  <td className="py-3 px-4 font-semibold text-slate-800">{hold.name}</td>
                                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">${hold.value.toLocaleString()}</td>
                                  <td className="py-3 px-4 text-right font-mono text-slate-650">{hold.shares.toLocaleString()}</td>
                                  <td className="py-3 px-4 text-center">
                                    {isCall ? (
                                      <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-650 border border-teal-150 text-[10px] font-bold uppercase tracking-wide">Call</span>
                                    ) : isPut ? (
                                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-650 border border-amber-150 text-[10px] font-bold uppercase tracking-wide">Put</span>
                                    ) : (
                                      <span className="text-slate-350">—</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono">
                                    <span className={changeColor}>
                                      {hold.qoqChange === 'New' ? (
                                        <span className="px-1.5 py-0.5 rounded bg-blue-50 text-[#1A6EFF] border border-blue-150 text-[9px] font-bold uppercase tracking-wide">NEW</span>
                                      ) : hold.qoqChange}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-slate-400">No portfolio assets returned.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-slate-400">Failed to load holdings report.</div>
                )}
              </div>
            )}

            {/* Sub-tab: 10-K Filings Analysis */}
            {activeSecSubTab === 'tenk' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="bg-slate-50 rounded-xl p-4 border border-[#E5E8EF] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex bg-white p-0.5 rounded-lg border border-[#E5E8EF] max-w-sm gap-0.5">
                    {[
                      { id: 'risk', label: 'Item 1A. Risk Factors' },
                      { id: 'mda', label: 'Item 7. MD&A Analysis' }
                    ].map((sectionTab) => (
                      <button
                        key={sectionTab.id}
                        onClick={() => setActiveTenKTab(sectionTab.id as any)}
                        className={`px-3 py-1.5 font-sans text-xs font-semibold rounded-md transition-all cursor-pointer ${
                          activeTenKTab === sectionTab.id 
                            ? 'bg-[#1A6EFF] text-white shadow-sm font-bold' 
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {sectionTab.label}
                      </button>
                    ))}
                  </div>

                  {activeTenKTab === 'risk' && (
                    <div className="flex items-center gap-2 select-none">
                      <span className="text-xs font-bold text-slate-650 uppercase tracking-wide">YoY Risk Factors Diff:</span>
                      <button
                        type="button"
                        onClick={() => setShowRiskDiff(!showRiskDiff)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          showRiskDiff ? 'bg-[#1A6EFF]' : 'bg-slate-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            showRiskDiff ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  )}
                </div>

                {/* Text Content Rendering Area */}
                <div className="bg-white border border-[#E5E8EF] rounded-xl p-5 shadow-sm space-y-4">
                  {activeTenKTab === 'risk' ? (
                    showRiskDiff ? (
                      isRiskDiffPending ? (
                        <div className="py-8 text-center text-slate-400 animate-pulse">Computing YoY difference analysis...</div>
                      ) : edgarRiskDiff && edgarRiskDiff.paragraphs ? (
                        <div className="space-y-4">
                          <div className="flex gap-4 text-[10px] font-mono border-b border-slate-100 pb-2.5 mb-1.5 uppercase">
                            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-50 border border-emerald-150 inline-block" /> Added Paragraphs</span>
                            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-rose-50 border border-rose-150 inline-block" /> Removed Paragraphs</span>
                            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-white border border-[#E5E8EF] inline-block" /> Unchanged</span>
                          </div>
                          
                          <div className="space-y-4 text-justify font-sans text-xs leading-relaxed text-slate-700">
                            {edgarRiskDiff.paragraphs.map((p: any, pIdx: number) => {
                              let styleClass = 'p-3 rounded-xl border border-[#E5E8EF] bg-white';
                              if (p.status === 'added') {
                                styleClass = 'p-3 rounded-xl border border-emerald-150 bg-emerald-50/30 text-emerald-955 font-medium';
                              } else if (p.status === 'removed') {
                                styleClass = 'p-3 rounded-xl border border-rose-150 bg-rose-50/30 text-rose-955 line-through decoration-rose-400 font-medium';
                              }
                              
                              return (
                                <p key={pIdx} className={styleClass}>
                                  {p.text}
                                </p>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="py-4 text-center text-slate-400">Failed to load risk factor difference report.</div>
                      )
                    ) : (
                      isSection1APending ? (
                        <div className="py-8 text-center text-slate-400 animate-pulse">Loading Risk Factors section...</div>
                      ) : edgarSection1A && edgarSection1A.paragraphs ? (
                        <div className="space-y-4">
                          <h4 className="font-sans font-bold text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-[#1A6EFF]" />
                            <span>{edgarSection1A.title}</span>
                          </h4>
                          <div className="space-y-4 text-justify font-sans text-xs leading-relaxed text-slate-700">
                            {edgarSection1A.paragraphs.map((p: string, pIdx: number) => (
                              <p key={pIdx} className="bg-slate-50/20 p-3 rounded-xl border border-slate-100/50">
                                {p}
                              </p>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="py-4 text-center text-slate-400">Failed to load Risk Factors.</div>
                      )
                    )
                  ) : (
                    isSection7Pending ? (
                      <div className="py-8 text-center text-slate-400 animate-pulse">Loading MD&A section...</div>
                    ) : edgarSection7 && edgarSection7.paragraphs ? (
                      <div className="space-y-4">
                        <h4 className="font-sans font-bold text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                          <FileText className="h-4 w-4 text-[#1A6EFF]" />
                          <span>{edgarSection7.title}</span>
                        </h4>
                        <div className="space-y-4 text-justify font-sans text-xs leading-relaxed text-slate-700">
                          {edgarSection7.paragraphs.map((p: string, pIdx: number) => (
                            <p key={pIdx} className="bg-slate-50/20 p-3 rounded-xl border border-slate-100/50">
                              {p}
                            </p>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 text-center text-slate-400">Failed to load MD&A analysis.</div>
                    )
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

