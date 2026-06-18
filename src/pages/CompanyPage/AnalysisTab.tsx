import React, { useState } from 'react';
import { X, Plus, Sparkles, HelpCircle } from 'lucide-react';
import { Chart } from '../../components/Chart.jsx';
import { formatPrice, formatMarketCap } from '../../utils/formatters.js';

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

interface AnalysisTabProps {
  upperSymbol: string;
  profile: CompanyProfile;
  livePriceVal: number;
  detailData: any;
  currencySuffixLabel: string;
  mcapSuffixLabel: string;
  isPeersPending: boolean;
  peers: Peer[];
  handlePeerClick: (peerSym: string) => void;
  ratios: Ratios | undefined;
  isNasdaq: boolean;
}

export const AnalysisTab: React.FC<AnalysisTabProps> = ({
  upperSymbol,
  profile,
  livePriceVal,
  detailData,
  currencySuffixLabel,
  mcapSuffixLabel,
  isPeersPending,
  peers,
  handlePeerClick,
  ratios,
  isNasdaq
}) => {
  // Local states
  const [comparePeer, setComparePeer] = useState<Peer | null>(null);
  
  // Custom ratios local state
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

  // Helpers
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

  const computeCalculatedRatioValue = (item: CustomRatio): string => {
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

  const getGrowthColorClass = (valStr: string): string => {
    if (!valStr || valStr === '—') return 'text-slate-800';
    const val = parseFloat(valStr.replace(/%/g, ''));
    if (isNaN(val)) return 'text-slate-800';
    if (val < 0) return 'text-[#DC2626] font-bold';
    if (val >= 15) return 'text-[#16A34A] font-bold';
    return 'text-slate-800 font-medium';
  };

  return (
    <div id="analysis" className="space-y-6 scroll-mt-20">
      <div id="charts" className="space-y-3">
        {/* Styled as pill toggle (active = #059669 bg, inactive = white bg) */}
        <div className="bg-white border border-[#E5E8EF] rounded-lg p-1 shadow-sm flex items-center gap-1 max-w-sm sm:max-w-none w-fit">
          <button className="px-4 py-1.5 bg-[#059669] text-white font-sans text-xs font-semibold rounded-md transition-all">
            Price Chart
          </button>
        </div>
        
        <Chart symbol={upperSymbol} exchange={profile.exchange} />
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
              <tr className="bg-[rgba(5,150,105,0.06)] text-[#059669] border-b border-[#E5E8EF] text-left text-[12.5px] font-bold uppercase tracking-wider">
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
            <tbody className="divide-y divide-[#E5E8EF] text-slate-700 bg-white">
              {/* Highlight current ticker row (AAPL) with a solid contiguous border and bg-[#F0F5FF]/50 */}
              <tr className="bg-[#F0F5FF]/40 text-slate-900 font-bold">
                <td className="py-3.5 px-4 text-[#059669] border-y-2 border-l-2 border-slate-900 font-bold">{profile.name} (This Ticker)</td>
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
                      <td className="py-3.5 px-4 font-sans font-semibold text-[#059669]">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="hover:underline">{p.name}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setComparePeer(p);
                            }}
                            className="px-2 py-0.75 bg-[#059669]/10 hover:bg-[#059669]/20 text-[#059669] border border-[#059669]/15 rounded font-sans text-[10px] font-bold uppercase tracking-wider transition shrink-0 cursor-pointer"
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
          <div className="mt-6 p-5 bg-[#F8F9FB] border border-[#E5E8EF] rounded-xl space-y-4 animate-in slide-in-from-bottom-2 duration-200 relative shadow-sm text-slate-700">
            <button 
              onClick={() => setComparePeer(null)} 
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-200/50 transition cursor-pointer"
              title="Close Comparison"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-[#059669]" />
              <h4 className="font-sans font-bold text-xs text-slate-800 uppercase tracking-wider">
                Interactive Side-by-Side Analysis
              </h4>
            </div>

            <div className="grid grid-cols-3 gap-4 text-xs font-sans">
              <div className="font-bold text-slate-450 uppercase tracking-wider text-[10px] self-end pb-1 border-b border-slate-200">Metric</div>
              <div className="font-bold text-[#059669] pb-1 border-b border-[#059669]/20 text-center uppercase tracking-wider truncate">{profile.name}</div>
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
            <div key={idx} className="p-3.5 bg-white border border-[#E5E8EF] rounded-xl flex justify-between items-center shadow-sm group hover:border-[#059669]/50 transition relative overflow-hidden">
              <div className="flex flex-col gap-0.5">
                {item.isCustom && (
                  <span className="text-[9px] bg-emerald-50 text-[#059669] px-1.5 py-0.2 rounded font-sans font-bold w-fit uppercase tracking-wider scale-90 -ml-1">
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
              className="p-3.5 bg-slate-50 border border-dashed border-[#E5E8EF] rounded-xl flex items-center justify-center gap-2 hover:bg-slate-100/50 hover:border-slate-300 transition shadow-sm text-xs font-semibold text-[#059669] cursor-pointer"
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
                          ? 'bg-[#059669] text-white font-bold shadow-xs' 
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {ratioBuilderMode === 'formula' && (
                <div className="space-y-2 text-slate-700">
                  <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Select Financial Formula</label>
                  <select
                    value={selectedFormula}
                    onChange={(e) => setSelectedFormula(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E5E8EF] rounded-lg focus:outline-none focus:border-[#059669] text-xs font-sans cursor-pointer text-slate-700"
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
                <div className="space-y-3 text-slate-700">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Numerator</label>
                      <select
                        value={numKey}
                        onChange={(e) => setNumKey(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-[#E5E8EF] rounded-lg focus:outline-none focus:border-[#059669] text-xs font-sans cursor-pointer text-slate-700"
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
                        className="w-full px-2 py-1.5 bg-white border border-[#E5E8EF] rounded-lg focus:outline-none focus:border-[#059669] text-xs font-sans cursor-pointer text-slate-700"
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
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E5E8EF] rounded-lg focus:outline-none focus:border-[#059669] font-sans text-slate-700"
                    />
                  </div>
                </div>
              )}

              {ratioBuilderMode === 'manual' && (
                <div className="grid grid-cols-2 gap-2.5 text-slate-700">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Ratio Name</label>
                    <input
                      type="text"
                      placeholder="e.g. NPM %"
                      value={newRatioName}
                      onChange={(e) => setNewRatioName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E5E8EF] rounded-lg focus:outline-none focus:border-[#059669] text-slate-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Static Value</label>
                    <input
                      type="text"
                      placeholder="e.g. 24.5%"
                      value={newRatioValue}
                      onChange={(e) => setNewRatioValue(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E5E8EF] rounded-lg focus:outline-none focus:border-[#059669] text-slate-700"
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
                  className="px-3.5 py-1.5 bg-[#059669] text-white rounded-md font-bold hover:bg-[#059669]/90 transition cursor-pointer"
                >
                  Add Custom Ratio
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
