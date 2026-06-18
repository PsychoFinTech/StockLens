import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface SuperInvestor {
  avatar: string;
  name: string;
  holdingVal: string;
  period: string;
}

interface FAQItem {
  q: string;
  a: string;
}

interface InfoTabProps {
  detailData: any;
  companyNews: any[] | undefined;
  isCompanyNewsPending: boolean;
}

export const InfoTab: React.FC<InfoTabProps> = ({
  detailData,
  companyNews,
  isCompanyNewsPending,
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  return (
    <div id="info" className="space-y-6 scroll-mt-20 animate-in fade-in duration-200">
      
      {/* Super Investors widget group */}
      {detailData.superInvestors && detailData.superInvestors.length > 0 && (
        <div id="investors" className="bg-white border border-[#E5E8EF] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em]">
              Institutional Investors Details
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Substantial portfolios holding</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {detailData.superInvestors.map((inv: SuperInvestor, idx: number) => (
              <div key={idx} className="p-4 bg-white border border-[#E5E8EF] rounded-xl flex items-center gap-4 transition hover:border-[#059669] shadow-sm hover:shadow-md">
                <div className="h-10 w-10 rounded-full bg-[#059669] text-white font-sans font-bold flex items-center justify-center text-sm shadow-xs">
                  {inv.avatar}
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="font-sans font-bold text-slate-800 text-xs truncate uppercase tracking-tight">{inv.name}</p>
                  <p className="font-mono text-[11.5px] font-bold text-[#059669]">{inv.holdingVal}</p>
                  <p className="text-[9px] font-mono text-slate-400 uppercase tracking-wide">{inv.period}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive FAQ list accordion */}
      {detailData.faqs && detailData.faqs.length > 0 && (
        <div id="faqs" className="bg-white border border-[#E5E8EF] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
          <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] border-b border-slate-100 pb-3">
            Frequently Asked Questions (FAQs)
          </h3>

          <div className="divide-y divide-slate-100">
            {detailData.faqs.map((faq: FAQItem, idx: number) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="py-3.5">
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex justify-between items-center text-left py-1 group focus:outline-none cursor-pointer"
                  >
                    <span className="font-sans font-semibold text-xs text-slate-800 group-hover:text-[#059669] transition">
                      {faq.q}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-[#059669] shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-[#059669] shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <p className="font-sans text-xs text-slate-650 bg-slate-50 p-3.5 rounded-lg border border-slate-100 mt-2.5 leading-relaxed text-justify animate-in slide-in-from-top-1 duration-150">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Equity news bulletins block card list */}
      <div className="bg-white border border-[#E5E8EF] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
        <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] border-b border-slate-100 pb-2">
          Corporate Actions & Bulletins Feed
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-1 text-slate-700 bg-white">
          {isCompanyNewsPending ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-[#E5E8EF] bg-white space-y-4 animate-pulse">
                <div className="h-3 w-16 bg-slate-100 rounded"></div>
                <div className="h-4 w-full bg-slate-100 rounded"></div>
                <div className="h-3 w-5/6 bg-slate-100 rounded"></div>
                <div className="h-3 w-4/6 bg-slate-100 rounded"></div>
              </div>
            ))
          ) : companyNews && companyNews.length > 0 ? (
            companyNews.slice(0, 4).map((item: any, idx: number) => {
              const pubDate = new Date(item.datetime * 1000).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
              return (
                <div key={item.id || idx} className="p-4 rounded-xl border border-[#E5E8EF] bg-white flex flex-col justify-between hover:border-emerald-600/30 hover:shadow-md transition">
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider block">
                      {pubDate} · {item.source}
                    </span>
                    <h4 
                      onClick={() => item.url && item.url !== '#' && window.open(item.url, '_blank')}
                      className="font-sans font-bold text-xs text-slate-900 line-clamp-2 hover:text-emerald-650 cursor-pointer"
                    >
                      {item.headline}
                    </h4>
                    <p className="font-sans text-[11px] text-slate-500 line-clamp-3 leading-relaxed">
                      {item.summary}
                    </p>
                  </div>
                  <button 
                    onClick={() => item.url && item.url !== '#' && window.open(item.url, '_blank')}
                    className="text-[10px] font-mono font-bold text-emerald-600 hover:underline text-left mt-4 uppercase cursor-pointer"
                  >
                    Continue Reading →
                  </button>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-8 text-center text-xs text-slate-400">
              No corporate news bulletins available at this time.
            </div>
          )}
        </div>
      </div>

      {/* Redesigned Slim Upsell Banner - 1 row, white background, emerald left border (4px) */}
      <div className="bg-white border border-[#E5E8EF] border-l-4 border-l-emerald-600 p-5 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col md:flex-row justify-between items-center gap-4 mt-6">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="bg-emerald-50 text-emerald-650 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 select-none border border-emerald-100">PRO</div>
          <p className="text-sm font-medium text-slate-800 text-center md:text-left">
            Get DuPont Analysis, historic 10-year filings, and 50 premium stock templates on <span className="font-bold text-emerald-600">StockLens PRO & TickerPlus</span>.
          </p>
        </div>
        <div className="relative group">
          <button disabled className="px-4 py-2 bg-slate-100 text-slate-400 font-sans text-xs font-bold rounded-lg cursor-not-allowed shrink-0 border border-slate-200">
            CLAIM 7-DAY FREE TRIAL
          </button>
          <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-850 text-white text-[10px] px-2 py-1 rounded shadow-md whitespace-nowrap left-1/2 -translate-x-1/2 font-sans font-medium">
            Coming Soon
          </div>
        </div>
      </div>

    </div>
  );
};
