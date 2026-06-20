import React from 'react';
import { HelpCircle, BadgeInfo, Loader2 } from 'lucide-react';
import { formatPrice, formatMarketCap, formatShares, formatDate, formatLargeNumber, getCurrencySymbol } from '../../utils/formatters.js';
import { FinStarRating } from './components/FinStarRating.jsx';

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
  enterprise_value?: number | null;
  shares_outstanding?: number | null;
  book_value?: number | null;
  total_cash?: number | null;
  total_debt?: number | null;
  sales_growth?: string | null;
  profit_growth?: string | null;
}

interface OverviewTabProps {
  detailData: any;
  profile: CompanyProfile;
  ratios: Ratios | undefined;
  quote: any;
  handleScrollToSection: (id: string) => void;
  shareholding: any;
  isShareholdingPending: boolean;
}

const getTooltipContent = (tag: string, ratios: Ratios | undefined): string => {
  if (!ratios || ratios.pe === '—') return 'Data unavailable for this metric.';
  const peNum = parseFloat(ratios.pe) || 0;
  const roeNum = parseFloat(ratios.roe.replace('%', '')) || 0;
  const deNum = parseFloat(ratios.debt_equity) || 0;

  if (tag === 'Valuation') {
    const isExpensive = peNum > 30;
    return `P/E ratio is ${ratios.pe} vs sector median of ~24 — stock is ${isExpensive ? 'trading at a premium compared to peer group averages.' : 'optimally priced and positioned for attractive entries.'}`;
  }
  if (tag === 'Efficiency') {
    const isEfficient = roeNum > 15;
    return `ROE represents efficiency at ${ratios.roe} vs hurdle of 15.00%. ${isEfficient ? 'Capital employment generates comfortable return-on-equity rates.' : 'Average operations with space for asset utilization refinement.'}`;
  }
  if (tag === 'Financials') {
    const isHealthy = deNum < 1.5;
    return `Debt/Equity leverage represents ${ratios.debt_equity} vs safety threshold of < 1.5. ${isHealthy ? 'Prudent capital structure with highly serviceable leverage limits.' : 'Elevated corporate debt requires cautious interest servicing check.'}`;
  }
  return '';
};

export const OverviewTab: React.FC<OverviewTabProps> = ({
  detailData,
  profile,
  ratios,
  quote,
  handleScrollToSection,
  shareholding,
  isShareholdingPending
}) => {
  // Simple dynamic FinStar rating calculation based on real ratios
  const hasRatios = !!ratios && ratios.pe !== '—';
  const peNum = hasRatios ? parseFloat(ratios.pe) : 0;
  const roeNum = hasRatios ? parseFloat(ratios.roe.replace('%', '')) : 0;
  const deNum = hasRatios ? parseFloat(ratios.debt_equity) : 0;

  const getValuationStars = (pe: number) => {
    if (pe === 0) return 0;
    if (pe < 15) return 4;
    if (pe < 30) return 3;
    return 1;
  };
  const getValuationStatus = (pe: number) => {
    if (pe === 0) return '—';
    if (pe < 15) return 'Attractive';
    if (pe < 30) return 'Fair';
    return 'Expensive';
  };

  const getEfficiencyStars = (roe: number) => {
    if (roe === 0) return 0;
    if (roe > 15) return 4;
    return 2;
  };

  const getFinancialsStars = (de: number) => {
    if (de === 0) return 0;
    if (de < 1.0) return 4;
    if (de < 2.0) return 3;
    return 1;
  };

  const valuationStars = getValuationStars(peNum);
  const efficiencyStars = getEfficiencyStars(roeNum);
  const financialsStars = getFinancialsStars(deNum);

  const overallStars = hasRatios ? Math.round((valuationStars + efficiencyStars + financialsStars) / 3) : 0;

  return (
    <div id="overview" className="space-y-6 scroll-mt-20 animate-in fade-in duration-200">
      {/* Two-Column Grid Setup containing Price Summary + Essentials */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Price Summary Panel */}
        <div className="lg:col-span-4 bg-white border border-[#E5E8EF] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
          <h3 className="text-[12.5px] font-semibold text-slate-555 uppercase tracking-[0.08em] border-b border-slate-100 pb-2">
            Price Summary
          </h3>
          
          <div className="grid grid-cols-2 border border-[#E5E8EF] rounded-xl overflow-hidden bg-white">
            <div className="p-4 border-r border-b border-[#E5E8EF] hover:bg-slate-50/40 transition">
              <span className="text-[12px] font-sans text-slate-500 font-semibold uppercase tracking-[0.03em] block">Today's High</span>
              <span className="font-mono font-bold text-slate-900 text-[17px] mt-1.5 block">
                {quote?.high ? formatPrice(quote.high, profile.exchange) : '—'}
              </span>
            </div>
            <div className="p-4 border-b border-[#E5E8EF] hover:bg-slate-50/40 transition">
              <span className="text-[12px] font-sans text-slate-500 font-semibold uppercase tracking-[0.03em] block">Today's Low</span>
              <span className="font-mono font-bold text-slate-900 text-[17px] mt-1.5 block">
                {quote?.low ? formatPrice(quote.low, profile.exchange) : '—'}
              </span>
            </div>
            <div className="p-4 border-r border-[#E5E8EF] hover:bg-slate-50/40 transition">
              <span className="text-[12px] font-sans text-slate-500 font-semibold uppercase tracking-[0.03em] block">52 Week High</span>
              <span className="font-mono font-bold text-slate-900 text-[17px] mt-1.5 block">
                {quote?.high_52w ? formatPrice(quote.high_52w, profile.exchange) : '—'}
              </span>
            </div>
            <div className="p-4 hover:bg-slate-50/40 transition">
              <span className="text-[12px] font-sans text-slate-500 font-semibold uppercase tracking-[0.03em] block">52 Week Low</span>
              <span className="font-mono font-bold text-slate-900 text-[17px] mt-1.5 block">
                {quote?.low_52w ? formatPrice(quote.low_52w, profile.exchange) : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Company Essentials Panel */}
        <div className="lg:col-span-8 bg-white border border-[#E5E8EF] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h3 className="text-[12.5px] font-semibold text-slate-555 uppercase tracking-[0.08em]">
              Company Essentials
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Consolidated numbers</span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-l border-[#E5E8EF] rounded-xl overflow-hidden">
            {[
              { label: 'MARKET CAP', value: ratios?.market_cap ? formatMarketCap(ratios.market_cap, profile.exchange) : '—' },
              { label: 'ENTERPRISE VALUE', value: ratios?.enterprise_value ? formatMarketCap(ratios.enterprise_value, profile.exchange) : '—' },
              { label: 'NO. OF SHARES', value: ratios?.shares_outstanding ? formatShares(ratios.shares_outstanding, profile.exchange, profile.symbol) : '—' },
              { label: 'P/E', value: ratios?.pe || '—' },
              { label: 'P/B', value: ratios?.pb || '—' },
              { label: 'DIV. YIELD (%)', value: ratios?.dividend_yield || '—' },
              { label: 'BOOK VALUE (TTM)', value: ratios?.book_value ? formatPrice(ratios.book_value, profile.exchange) : '—' },
              { label: 'CASH', value: ratios?.total_cash ? formatMarketCap(ratios.total_cash, profile.exchange) : '—' },
              { label: 'DEBT', value: ratios?.total_debt ? formatMarketCap(ratios.total_debt, profile.exchange) : '—' },
              { label: 'EPS (TTM)', value: ratios?.eps || '—' },
              { label: 'SALES GROWTH (%)', value: ratios?.sales_growth || '—' },
              { label: 'ROE (%)', value: ratios?.roe || '—' },
              { label: 'ROCE (%)', value: ratios?.roce || '—' },
              { label: 'PROFIT GROWTH (%)', value: ratios?.profit_growth || '—' }
            ].map((stat, statIdx) => (
              <div key={statIdx} className="p-3.5 border-r border-b border-[#E5E8EF] bg-white hover:bg-slate-50/45 transition">
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
              <FinStarRating stars={overallStars} />
            </div>
            <p className="text-xs font-normal text-slate-500 mt-1">Automated visual scoring based on current quarterly filing factors.</p>
          </div>
          
          <span className="bg-slate-900 text-white rounded-lg px-4 py-1.5 text-xs font-bold tracking-[0.02em] inline-flex items-center shrink-0 shadow-sm">
            Star Score: {overallStars} / 5
          </span>
        </div>

        {hasRatios ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
            {[
              { 
                tag: 'Ownership', 
                stat: { status: '—', stars: 0, desc: 'Promoter ownership details unavailable.' } 
              },
              { 
                tag: 'Valuation', 
                stat: { 
                  status: getValuationStatus(peNum), 
                  stars: valuationStars, 
                  desc: peNum > 0 ? `P/E ratio is ${ratios.pe} vs sector median of ~24.` : 'Valuation details unavailable.' 
                } 
              },
              { 
                tag: 'Efficiency', 
                stat: { 
                  status: roeNum > 15 ? 'Strong' : roeNum > 0 ? 'Average' : '—', 
                  stars: efficiencyStars, 
                  desc: roeNum > 0 ? `ROE represents efficiency at ${ratios.roe}.` : 'Efficiency details unavailable.' 
                } 
              },
              { 
                tag: 'Financials', 
                stat: { 
                  status: deNum < 1.5 ? 'Good' : deNum > 0 ? 'Poor' : '—', 
                  stars: financialsStars, 
                  desc: deNum > 0 ? `Debt/Equity leverage represents ${ratios.debt_equity}.` : 'Financial leverage details unavailable.' 
                } 
              }
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
                          {getTooltipContent(item.tag, ratios)}
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
                  
                  <FinStarRating stars={item.stat.stars} starClassName="h-3.5 w-3.5" />
                </div>

                <p className="text-xs font-normal text-slate-600 leading-relaxed">
                  {item.stat.desc}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center font-mono text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
            Rating data unavailable for this company
          </div>
        )}
      </div>

      {/* Shareholding Pattern Card */}
      <div id="shareholding" className="space-y-6 scroll-mt-20">
        <div className="bg-white border border-[#E5E8EF] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-[11.5px] font-semibold text-slate-500 uppercase tracking-[0.08em]">
              Shareholding Pattern
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Equity capital split</span>
          </div>

          {isShareholdingPending ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 font-mono text-xs space-y-3">
              <Loader2 className="h-6 w-6 animate-spin text-[#059669]" />
              <span>Loading shareholding pattern data...</span>
            </div>
          ) : shareholding && (
            (shareholding.majorHolders && shareholding.majorHolders.insidersPercentHeld !== null) ||
            (shareholding.institutionalHolders && shareholding.institutionalHolders.length > 0) ||
            (shareholding.mutualFundHolders && shareholding.mutualFundHolders.length > 0)
          ) ? (
            <div className="space-y-6">
              {/* Major Holders Breakdown */}
              {shareholding.majorHolders && shareholding.majorHolders.insidersPercentHeld !== null && (
                <div className="space-y-3">
                  <h4 className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.08em]">Major Holders</h4>
                  <div className="border border-[#E5E8EF] rounded-xl overflow-hidden bg-white">
                    <table className="w-full text-left font-sans text-xs">
                      <tbody className="divide-y divide-[#E5E8EF]">
                        {[
                          {
                            label: '% of Shares Held by All Insiders',
                            value: shareholding.majorHolders.insidersPercentHeld !== null 
                              ? `${(shareholding.majorHolders.insidersPercentHeld * 100).toFixed(2)}%` 
                              : '—'
                          },
                          {
                            label: '% of Shares Held by Institutions',
                            value: shareholding.majorHolders.institutionsPercentHeld !== null 
                              ? `${(shareholding.majorHolders.institutionsPercentHeld * 100).toFixed(2)}%` 
                              : '—'
                          },
                          {
                            label: '% of Float Held by Institutions',
                            value: shareholding.majorHolders.institutionsFloatPercentHeld !== null 
                              ? `${(shareholding.majorHolders.institutionsFloatPercentHeld * 100).toFixed(2)}%` 
                              : '—'
                          },
                          {
                            label: 'Number of Institutions Holding Shares',
                            value: shareholding.majorHolders.institutionsCount !== null 
                              ? formatLargeNumber(shareholding.majorHolders.institutionsCount) 
                              : '—'
                          }
                        ].map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition">
                            <td className="px-4 py-3 font-mono font-bold text-slate-900 w-1/4 border-r border-[#E5E8EF] text-right bg-slate-50/10 whitespace-nowrap">
                              {row.value}
                            </td>
                            <td className="px-4 py-3 text-slate-650 font-medium">
                              {row.label}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Top Institutional Holders */}
              {shareholding.institutionalHolders && shareholding.institutionalHolders.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.08em]">Top Institutional Holders</h4>
                  <div className="border border-[#E5E8EF] rounded-xl overflow-hidden bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-[#E5E8EF] text-xs font-sans text-left">
                        <thead>
                          <tr className="bg-[rgba(5,150,105,0.04)] text-[#059669] border-b border-[#E5E8EF] text-[10.5px] font-bold uppercase tracking-wider whitespace-nowrap">
                            <th className="py-3 px-4 font-bold text-left whitespace-nowrap">Holder</th>
                            <th className="py-3 px-4 font-bold text-right whitespace-nowrap">Shares</th>
                            <th className="py-3 px-4 font-bold text-center whitespace-nowrap">Date Reported</th>
                            <th className="py-3 px-4 font-bold text-right whitespace-nowrap">% Out</th>
                            <th className="py-3 px-4 font-bold text-right whitespace-nowrap">Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E8EF] text-slate-700 bg-white">
                          {shareholding.institutionalHolders.map((item: any, idx: number) => {
                            const isEven = idx % 2 === 1;
                            const currency = getCurrencySymbol(profile.exchange, profile.symbol);
                            const valFormatted = item.value 
                              ? `${currency}${Math.round(item.value).toLocaleString()}` 
                              : '—';
                            return (
                              <tr key={idx} className={`${isEven ? 'bg-[#F8F9FB]/40' : 'bg-white'} hover:bg-slate-50/50 transition`}>
                                <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">{item.organization}</td>
                                <td className="py-3 px-4 text-right font-mono font-medium whitespace-nowrap">{item.position ? formatShares(item.position, profile.exchange, profile.symbol) : '—'}</td>
                                <td className="py-3 px-4 text-center font-mono text-slate-600 whitespace-nowrap">{item.reportDate ? formatDate(item.reportDate) : '—'}</td>
                                <td className="py-3 px-4 text-right font-mono text-slate-600 whitespace-nowrap">
                                  {item.pctHeld !== null ? `${(item.pctHeld * 100).toFixed(2)}%` : '—'}
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-medium whitespace-nowrap">{valFormatted}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Top Mutual Fund Holders */}
              {shareholding.mutualFundHolders && shareholding.mutualFundHolders.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.08em]">Top Mutual Fund Holders</h4>
                  <div className="border border-[#E5E8EF] rounded-xl overflow-hidden bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-[#E5E8EF] text-xs font-sans text-left">
                        <thead>
                          <tr className="bg-[rgba(5,150,105,0.04)] text-[#059669] border-b border-[#E5E8EF] text-[10.5px] font-bold uppercase tracking-wider whitespace-nowrap">
                            <th className="py-3 px-4 font-bold text-left whitespace-nowrap">Holder</th>
                            <th className="py-3 px-4 font-bold text-right whitespace-nowrap">Shares</th>
                            <th className="py-3 px-4 font-bold text-center whitespace-nowrap">Date Reported</th>
                            <th className="py-3 px-4 font-bold text-right whitespace-nowrap">% Out</th>
                            <th className="py-3 px-4 font-bold text-right whitespace-nowrap">Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E8EF] text-slate-700 bg-white">
                          {shareholding.mutualFundHolders.map((item: any, idx: number) => {
                            const isEven = idx % 2 === 1;
                            const currency = getCurrencySymbol(profile.exchange, profile.symbol);
                            const valFormatted = item.value 
                              ? `${currency}${Math.round(item.value).toLocaleString()}` 
                              : '—';
                            return (
                              <tr key={idx} className={`${isEven ? 'bg-[#F8F9FB]/40' : 'bg-white'} hover:bg-slate-50/50 transition`}>
                                <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">{item.organization}</td>
                                <td className="py-3 px-4 text-right font-mono font-medium whitespace-nowrap">{item.position ? formatShares(item.position, profile.exchange, profile.symbol) : '—'}</td>
                                <td className="py-3 px-4 text-center font-mono text-slate-600 whitespace-nowrap">{item.reportDate ? formatDate(item.reportDate) : '—'}</td>
                                <td className="py-3 px-4 text-right font-mono text-slate-600 whitespace-nowrap">
                                  {item.pctHeld !== null ? `${(item.pctHeld * 100).toFixed(2)}%` : '—'}
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-medium whitespace-nowrap">{valFormatted}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center font-mono text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
              Shareholding pattern data unavailable for this company
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
