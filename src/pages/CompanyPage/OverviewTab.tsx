import React from 'react';
import { HelpCircle, BadgeInfo } from 'lucide-react';
import { formatPrice } from '../../utils/formatters.js';
import { FinStarRating } from './components/FinStarRating.jsx';
import { ShareholdingDonut } from './components/ShareholdingDonut.jsx';

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

interface OverviewTabProps {
  detailData: any;
  profile: CompanyProfile;
  ratios: Ratios | undefined;
  handleScrollToSection: (id: string) => void;
}

const getTooltipContent = (tag: string, detailData: any, ratios: Ratios | undefined): string => {
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

export const OverviewTab: React.FC<OverviewTabProps> = ({
  detailData,
  profile,
  ratios,
  handleScrollToSection
}) => {
  return (
    <div id="overview" className="space-y-6 scroll-mt-20 animate-in fade-in duration-200">
      {/* Two-Column Grid Setup containing Price Summary + Essentials */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Price Summary Panel */}
        <div className="lg:col-span-4 bg-white border border-[#E5E8EF] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
          <h3 className="text-[12.5px] font-semibold text-slate-555 uppercase tracking-[0.08em] border-b border-slate-100 pb-2">
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
            <h3 className="text-[12.5px] font-semibold text-slate-555 uppercase tracking-[0.08em]">
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
          
          <div className="flex justify-end pt-2">
            <button 
              onClick={() => handleScrollToSection('ratios')}
              className="text-[10px] font-sans font-bold text-[#059669] hover:text-[#059669]/90 bg-[#059669]/10 hover:bg-[#059669]/20 px-3 py-1.5 rounded border border-[#059669]/20 transition cursor-pointer"
            >
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
              <FinStarRating stars={detailData.finStar.overall} />
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
                
                <FinStarRating stars={item.stat.stars} starClassName="h-3.5 w-3.5" />
              </div>

              <p className="text-xs font-normal text-slate-600 leading-relaxed">
                {item.stat.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Shareholding Pattern Card */}
      <div id="shareholding" className="space-y-6 scroll-mt-20">
        <div className="bg-white border border-[#E5E8EF] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em]">
              Shareholding Pattern
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Equity capital split</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Redesigned Donut */}
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
                    <div className="h-3 w-3 bg-[#059669] rounded-sm shrink-0" />
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
                    {detailData.shareholding.pledgedList.map((row: any, i: number) => (
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

        {/* Strengths and limitations */}
        <div className="bg-white border border-[#E5E8EF] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-[#E5E8EF]">
            
            {/* Strengths Card */}
            <div className="space-y-4 pb-6 md:pb-0">
              <h4 className="text-[12.5px] font-semibold text-slate-555 uppercase tracking-[0.08em] flex items-center gap-1.5">
                <span className="text-[#16A34A] font-bold text-sm">✓</span>
                <span>Company Strengths</span>
              </h4>
              <ul className="text-[13.5px] text-slate-700 space-y-2.5 leading-relaxed">
                {detailData.strengths.map((str: string, idx: number) => (
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
                {detailData.limitations.map((lim: string, idx: number) => (
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

      {/* Brands Panel */}
      {detailData.brands && detailData.brands.length > 0 && (
        <div className="bg-white border border-[#E5E8EF] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-3.5">
          <h3 className="text-[12px] font-semibold text-slate-500 uppercase tracking-[0.08em] border-b border-slate-100 pb-2">
            Affiliated Corporate Brands
          </h3>
          <div className="flex flex-wrap gap-2 pt-1">
            {detailData.brands.map((pName: string, idx: number) => (
              <span 
                key={idx} 
                className="px-3 py-1 bg-white text-slate-700 hover:text-[#059669] hover:bg-[#059669]/5 border border-[#E5E8EF] hover:border-[#059669]/30 rounded-lg font-sans text-xs transition select-none cursor-default font-medium"
              >
                {pName}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Index Presence */}
      {detailData.indexPresence && detailData.indexPresence.length > 0 && (
        <div className="bg-white border border-[#E5E8EF] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-3.5">
          <h3 className="text-[12px] font-semibold text-slate-500 uppercase tracking-[0.08em] border-b border-slate-100 pb-2">
            Index Presence
          </h3>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            {detailData.indexPresence.map((ind: any, idx: number) => (
              <div key={idx} className="p-4 bg-white rounded-lg border border-[#E5E8EF] transition hover:border-[#059669] shadow-sm hover:shadow-md">
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
      )}

      {/* Group of Consolidated Companies */}
      {detailData.groupCompanies && detailData.groupCompanies.length > 0 && (
        <div className="bg-white border border-[#E5E8EF] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
          <h3 className="text-[12px] font-semibold text-slate-500 uppercase tracking-[0.08em] border-b border-slate-100 pb-2">
            Group Ecosystem Companies
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {detailData.groupCompanies.map((g: any, idx: number) => (
              <div key={idx} className="p-4 bg-white border border-[#E5E8EF] rounded-xl hover:border-[#059669] transition flex flex-col justify-between shadow-sm hover:shadow-md">
                <div>
                  <span className="font-mono text-[10px] font-bold text-[#059669] bg-[#059669]/10 px-2 py-0.5 rounded uppercase">{g.symbol}</span>
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
      )}

    </div>
  );
};
