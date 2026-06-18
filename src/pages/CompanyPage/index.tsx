import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCompanyData } from './hooks/useCompanyData.js';
import { formatPrice } from '../../utils/formatters.js';
import { getStockDetailedData } from '../../utils/stockDetailsRegistry.js';
import { 
  Star, ArrowLeft, ExternalLink, Check, Loader2, RefreshCw, 
  SearchX, ShieldAlert, LayoutDashboard, TrendingUp, DollarSign, Building2, FileText, Users
} from 'lucide-react';
import { CompanyPageSkeleton } from '../../components/Skeleton.jsx';

import { OverviewTab } from './OverviewTab.jsx';
import { AnalysisTab } from './AnalysisTab.jsx';
import { FinancialsTab } from './FinancialsTab.jsx';
import { InfoTab } from './InfoTab.jsx';
import { SECTab } from './SECTab.jsx';

export const CompanyPage: React.FC = () => {
  const { symbol = '' } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const upperSymbol = symbol.toUpperCase();

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
  const [activeTenKTab, setActiveTenKTab] = useState<'business' | 'risk' | 'mda'>('business');
  const [showRiskDiff, setShowRiskDiff] = useState<boolean>(false);

  // Sharing copy link states
  const [copied, setCopied] = useState(false);

  const {
    watchlist,
    isStarred,
    toggleStar,
    profile,
    isProfilePending,
    profileErr,
    ratios,
    peers,
    isPeersPending,
    quote,
    companyNews,
    isCompanyNewsPending,
    isUSStock,
    edgarFinancials,
    isEdgarFinancialsPending,
    isEdgarFinancialsError,
    edgarCompareFinancials,
    edgarInsiders,
    isEdgarInsidersPending,
    isEdgarInsidersError,
    edgarHoldings,
    isEdgarHoldingsPending,
    isEdgarHoldingsError,
    edgarSection1,
    isSection1Pending,
    isSection1Error,
    edgarSection1A,
    isSection1APending,
    isSection1AError,
    edgarSection7,
    isSection7Pending,
    isSection7Error,
    edgarRiskDiff,
    isRiskDiffPending,
    isRiskDiffError
  } = useCompanyData({
    upperSymbol,
    secComparePeer,
    holdingsQuery,
    showRiskDiff
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

  const handleCopyLink = () => {
    const url = `${window.location.origin}/company/${upperSymbol}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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
            className="flex items-center gap-1.5 px-5 py-2.5 bg-[#059669] font-sans text-xs font-bold text-white rounded-xl hover:bg-[#059669]/90 transition shadow-3xs cursor-pointer"
          >
            <RefreshCw className="h-4 w-4 animate-spin-hover" />
            <span>Retry Connection</span>
          </button>
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-1.5 px-5 py-2.5 border border-[#E5E8EF] bg-white font-sans text-xs font-bold text-slate-650 hover:bg-slate-50 rounded-xl transition shadow-3xs cursor-pointer"
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
          className="flex items-center gap-1.5 px-5 py-2.5 bg-[#059669] font-sans text-xs font-bold text-white rounded-xl hover:bg-[#059669]/90 transition mx-auto shadow-3xs cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Search Another Ticker</span>
        </button>
      </div>
    );
  }

  // Live prices and change percent
  const livePriceVal = quote?.price || 0;
  const liveChangePercent = quote?.changePercent || 0;
  const liveChangeAmount = quote?.change || 0;
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

  return (
    <div className="bg-[#F8F9FB] min-h-screen w-full py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 animate-in fade-in duration-200">
        
        {/* Breadcrumbs */}
        <div className="text-[12px] font-sans text-slate-500 font-semibold uppercase tracking-[0.08em] flex items-center gap-1">
          <Link to="/" className="hover:text-[#059669]">Ticker</Link>
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
              <span className="font-mono text-[#059669] bg-[#059669]/10 border border-[#059669]/15 px-2.5 py-0.5 rounded-md">
                {detailData.exchangeCode}
              </span>
              <span className="font-mono text-slate-650 bg-slate-50 border border-[#E5E8EF] px-2.5 py-0.5 rounded-md">
                {detailData.secExchange}
              </span>
              <span className="text-[#E5E8EF] font-sans px-1">|</span>
              <span className="text-slate-500 font-sans flex items-center gap-1">
                Sector: <span className="font-bold text-[#059669] hover:underline cursor-pointer">{profile.sector}</span>
              </span>
              <span className="text-[#E5E8EF] font-sans px-1">|</span>
              <span className="text-slate-500 font-sans flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-slate-450" />
                <span className="font-bold text-slate-855">{detailData.followers} Followers</span>
              </span>
            </div>
          </div>

          {/* Live Currency Quote Panel */}
          <div className="flex items-center gap-4 w-full md:w-auto md:ml-auto md:justify-end">
            <div className="text-right">
              <div className="flex items-baseline justify-end gap-2.5">
                {!quote ? (
                  <>
                    <div className="h-9 w-32 bg-slate-100 animate-pulse rounded-md"></div>
                    <div className="h-6 w-20 bg-slate-100 animate-pulse rounded-md"></div>
                  </>
                ) : (
                  <>
                    <span className="font-sans font-semibold text-[44px] text-slate-900 tracking-tight leading-none">
                      {formatPrice(livePriceVal, profile.exchange)}
                    </span>
                    <span className={`inline-flex items-center gap-0.5 font-mono text-[12px] font-bold px-2 py-0.5 rounded-md ${
                      isUp ? 'bg-emerald-50 text-[#16A34A] border border-[#16A34A]/15' : 'bg-rose-50 text-[#DC2626] border border-[#DC2626]/15'
                    }`}>
                      {isUp ? '▲' : '▼'} {isUp ? '+' : ''}{liveChangeAmount.toFixed(2)} ({isUp ? '+' : ''}{liveChangePercent.toFixed(2)}%)
                    </span>
                  </>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-1.5">
                Prices delayed 15 min · Source: {profile.exchange && (profile.exchange.toUpperCase().includes('NSE') || profile.exchange.toUpperCase().includes('BSE') || profile.exchange.toUpperCase().includes('INDIA')) ? 'Yahoo Finance Scraper' : 'Finnhub Core API'} · Last updated: {quote?.updated_at ? new Date(quote.updated_at).toLocaleTimeString() : new Date().toLocaleTimeString()}
              </p>
            </div>

            <button
              onClick={handleCopyLink}
              className="p-2.5 rounded-lg border border-[#E5E8EF] text-slate-400 hover:text-[#059669] bg-white hover:bg-[#059669]/5 transition-all hover:scale-105 cursor-pointer"
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
              className={`p-2.5 rounded-lg border transition-all hover:scale-105 cursor-pointer ${
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
            <div className="px-2.5 py-1 bg-[#059669] text-white font-sans text-[11px] font-bold uppercase tracking-wider rounded-md shrink-0 select-none">
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
              className="w-full bg-slate-50 border border-[#E5E8EF] rounded-lg py-2 px-3 text-xs font-sans font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#059669]"
            >
              <option value="overview">Overview</option>
              <option value="analysis">Analysis</option>
              <option value="financials">Financials</option>
              <option value="info">Company Info</option>
              {isUSStock && <option value="sec">SEC Filings</option>}
            </select>
          </div>

          {/* Desktop Segmented Buttons (hidden on mobile) */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-[#E5E8EF] animate-in fade-in duration-150">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'analysis', label: 'Analysis', icon: TrendingUp },
              { id: 'financials', label: 'Financials', icon: DollarSign },
              { id: 'info', label: 'Company Info', icon: Building2 },
              ...(isUSStock ? [{ id: 'sec', label: 'SEC Filings', icon: FileText }] : [])
            ].map((tab) => {
              const Icon = tab.icon;
              const ia = activePrimaryTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActivePrimaryTab(tab.id as any);
                    handleScrollToSection(tab.id);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 font-sans text-[13.5px] font-bold rounded-md transition duration-155 cursor-pointer ${
                    ia 
                      ? 'bg-[#059669] text-white shadow-sm font-bold' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Render modular tab panels sequentially to match original layout scroll-anchoring */}
        <OverviewTab
          detailData={detailData}
          profile={profile}
          ratios={ratios}
          handleScrollToSection={handleScrollToSection}
        />
        
        <AnalysisTab
          upperSymbol={upperSymbol}
          profile={profile}
          livePriceVal={livePriceVal}
          detailData={detailData}
          currencySuffixLabel={currencySuffixLabel}
          mcapSuffixLabel={mcapSuffixLabel}
          isPeersPending={isPeersPending}
          peers={peers || []}
          handlePeerClick={handlePeerClick}
          ratios={ratios}
          isNasdaq={isNasdaq}
        />

        <FinancialsTab
          detailData={detailData}
          currencySuffixLabel={currencySuffixLabel}
        />

        <InfoTab
          detailData={detailData}
          companyNews={companyNews}
          isCompanyNewsPending={isCompanyNewsPending}
        />

        {isUSStock && (
          <SECTab
            upperSymbol={upperSymbol}
            peers={peers || []}
            activeSecSubTab={activeSecSubTab}
            setActiveSecSubTab={setActiveSecSubTab}
            secComparePeer={secComparePeer}
            setSecComparePeer={setSecComparePeer}
            activeSecStatement={activeSecStatement}
            setActiveSecStatement={setActiveSecStatement}
            holdingsSearchInput={holdingsSearchInput}
            setHoldingsSearchInput={setHoldingsSearchInput}
            holdingsQuery={holdingsQuery}
            setHoldingsQuery={setHoldingsQuery}
            activeTenKTab={activeTenKTab}
            setActiveTenKTab={setActiveTenKTab}
            showRiskDiff={showRiskDiff}
            setShowRiskDiff={setShowRiskDiff}
            
            edgarFinancials={edgarFinancials}
            isEdgarFinancialsPending={isEdgarFinancialsPending}
            isEdgarFinancialsError={isEdgarFinancialsError}
            edgarCompareFinancials={edgarCompareFinancials}
            edgarInsiders={edgarInsiders}
            isEdgarInsidersPending={isEdgarInsidersPending}
            isEdgarInsidersError={isEdgarInsidersError}
            edgarHoldings={edgarHoldings}
            isEdgarHoldingsPending={isEdgarHoldingsPending}
            isEdgarHoldingsError={isEdgarHoldingsError}
            edgarSection1={edgarSection1}
            isSection1Pending={isSection1Pending}
            isSection1Error={isSection1Error}
            edgarSection1A={edgarSection1A}
            isSection1APending={isSection1APending}
            isSection1AError={isSection1AError}
            edgarSection7={edgarSection7}
            isSection7Pending={isSection7Pending}
            isSection7Error={isSection7Error}
            edgarRiskDiff={edgarRiskDiff}
            isRiskDiffPending={isRiskDiffPending}
            isRiskDiffError={isRiskDiffError}
          />
        )}

      </div>
    </div>
  );
};
