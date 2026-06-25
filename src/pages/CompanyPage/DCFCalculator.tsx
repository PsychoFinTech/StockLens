import React, { useState, useEffect } from 'react';
import { HelpCircle, RefreshCw, AlertTriangle, ChevronDown, ChevronUp, Calculator, Sliders } from 'lucide-react';
import { useDCFData } from './hooks/useDCFData.js';
import { computeDCF, computeSensitivityTable } from '../../utils/dcfCalculator.js';
import { formatPrice, formatMarketCap, formatPercentChange, formatShares } from '../../utils/formatters.js';

interface DCFCalculatorProps {
  symbol: string;
  exchange: string;
  profile: {
    sector?: string;
    industry?: string;
    name?: string;
  };
}

export const DCFCalculator: React.FC<DCFCalculatorProps> = ({ symbol, exchange, profile }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data, isLoading, isError, error } = useDCFData(symbol);

  // Growth & Projections assumptions
  const [revenueGrowth, setRevenueGrowth] = useState<number>(0.08);
  const [fcfMargin, setFcfMargin] = useState<number>(0.15);
  const [projectionYears, setProjectionYears] = useState<number>(5);
  const [terminalGrowth, setTerminalGrowth] = useState<number>(0.025);

  // WACC assumptions
  const [riskFreeRate, setRiskFreeRate] = useState<number>(0.0425);
  const [equityRiskPremium, setEquityRiskPremium] = useState<number>(0.055);
  const [beta, setBeta] = useState<number>(1.0);
  const [costOfDebt, setCostOfDebt] = useState<number>(0.05);
  const [taxRate, setTaxRate] = useState<number>(0.21);

  // Financial inputs assumptions
  const [sharesOutstanding, setSharesOutstanding] = useState<number>(0);
  const [totalDebt, setTotalDebt] = useState<number>(0);
  const [cashAndEquivalents, setCashAndEquivalents] = useState<number>(0);
  const [latestRevenue, setLatestRevenue] = useState<number>(0);
  const [marketCap, setMarketCap] = useState<number>(0);

  // Initialize values when query data arrives
  const resetToDefaults = () => {
    if (!data) return;

    // 1. Calculate revenue CAGR (last 3-5 years)
    let revCAGR = 0.08;
    const revs = data.historicalRevenue || [];
    if (revs.length >= 2) {
      const oldest = revs[0].value;
      const newest = revs[revs.length - 1].value;
      const n = revs.length - 1;
      if (oldest > 0 && newest > 0) {
        const cagr = Math.pow(newest / oldest, 1 / n) - 1;
        revCAGR = Math.min(Math.max(cagr, -0.10), 0.30); // clamp between -10% and +30%
      }
    } else if (data.analystGrowthEstimate5yr !== null && data.analystGrowthEstimate5yr !== undefined) {
      revCAGR = data.analystGrowthEstimate5yr;
    }

    // 2. Calculate average FCF margin (historical average)
    let avgMargin = 0.15;
    const fcf = data.historicalFCF || [];
    const revsList = data.historicalRevenue || [];
    const margins = [];
    for (const fcfItem of fcf) {
      const matchingRev = revsList.find(r => r.year === fcfItem.year);
      if (matchingRev && matchingRev.value > 0) {
        margins.push(fcfItem.value / matchingRev.value);
      }
    }
    if (margins.length > 0) {
      avgMargin = margins.reduce((sum, val) => sum + val, 0) / margins.length;
      avgMargin = Math.max(avgMargin, 0); // floor at 0%
    }

    // 3. Cost of Debt default calculation
    let debtCost = (data.riskFreeRate || 0.0425) + 0.015;
    if (data.totalDebt && data.totalDebt > 0 && data.interestExpense && data.interestExpense > 0) {
      debtCost = data.interestExpense / data.totalDebt;
    }

    setRevenueGrowth(revCAGR);
    setFcfMargin(avgMargin);
    setProjectionYears(5);
    setTerminalGrowth(Math.min(data.riskFreeRate || 0.025, 0.03)); // GDP growth proxy capped at 3%
    setRiskFreeRate(data.riskFreeRate || 0.0425);
    setEquityRiskPremium(0.055);
    setBeta(data.beta || 1.0);
    setCostOfDebt(debtCost);
    setTaxRate(data.taxRate !== null && data.taxRate !== undefined ? data.taxRate : 0.21);
    setSharesOutstanding(data.sharesOutstanding || 0);
    setTotalDebt(data.totalDebt || 0);
    setCashAndEquivalents(data.cashAndEquivalents || 0);

    const lastRev = revsList.length > 0 ? revsList[revsList.length - 1].value : 0;
    setLatestRevenue(lastRev);
    setMarketCap(data.marketCap || 0);
  };

  useEffect(() => {
    if (data) {
      resetToDefaults();
    }
  }, [data]);

  // Recalculate DCF Model dynamically
  let dcfResult = null;
  let dcfError = null;

  if (data) {
    try {
      dcfResult = computeDCF(
        {
          revenueGrowthRate: revenueGrowth,
          fcfMargin,
          projectionYears,
          terminalGrowthRate: terminalGrowth,
          riskFreeRate,
          equityRiskPremium,
          beta,
          costOfDebt,
          taxRate,
          marketCap: marketCap || (sharesOutstanding * data.currentPrice),
          totalDebt,
          latestRevenue,
          cashAndEquivalents,
          sharesOutstanding,
        },
        data.currentPrice
      );
    } catch (err: any) {
      dcfError = err.message;
    }
  }

  // Sensitivity Analysis calculations
  const waccSteps = dcfResult ? [
    dcfResult.wacc - 0.02,
    dcfResult.wacc - 0.01,
    dcfResult.wacc,
    dcfResult.wacc + 0.01,
    dcfResult.wacc + 0.02
  ] : [];

  const growthSteps = [
    terminalGrowth - 0.01,
    terminalGrowth - 0.005,
    terminalGrowth,
    terminalGrowth + 0.005,
    terminalGrowth + 0.01
  ];

  const sensitivityTable = (dcfResult && data) ? computeSensitivityTable(
    {
      revenueGrowthRate: revenueGrowth,
      fcfMargin,
      projectionYears,
      terminalGrowthRate: terminalGrowth,
      riskFreeRate,
      equityRiskPremium,
      beta,
      costOfDebt,
      taxRate,
      marketCap: marketCap || (sharesOutstanding * data.currentPrice),
      totalDebt,
      latestRevenue,
      cashAndEquivalents,
      sharesOutstanding,
    },
    data.currentPrice,
    waccSteps,
    growthSteps
  ) : [];

  // Determine warnings
  const isNegativeFCF = data?.historicalFCF && data.historicalFCF.length > 0 && data.historicalFCF.every(f => f.value <= 0);
  const isFinancialSector = profile?.sector?.toLowerCase().includes('financial') || 
                            profile?.industry?.toLowerCase().includes('bank') || 
                            profile?.industry?.toLowerCase().includes('insurance');

  if (isLoading) {
    return (
      <div className="bg-white border border-[#E5E8EF] rounded-xl p-5 shadow-sm animate-pulse flex items-center justify-center min-h-[100px]">
        <div className="text-slate-400 font-sans text-sm">Loading intrinsic valuation data...</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-white border border-[#E5E8EF] rounded-xl p-5 shadow-sm flex items-center gap-3 text-red-500 font-sans text-sm">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <span>Failed to fetch DCF data: {error?.message || 'Data unavailable.'}</span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E5E8EF] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
      {/* Header Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50/50 transition cursor-pointer text-left"
      >
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-[#059669]" />
          <div>
            <h3 className="text-[14.5px] font-bold text-slate-800 uppercase tracking-wide">
              Discounted Cash Flow (DCF) Calculator
            </h3>
            <p className="text-[11.5px] text-slate-500 mt-0.5">
              Estimate intrinsic value of {data.companyName} dynamically
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {dcfResult && !dcfError && (
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="text-slate-500">Fair Value:</span>
              <span className={`font-mono font-bold ${dcfResult.upsidePercent > 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                {formatPrice(dcfResult.fairValuePerShare, exchange, symbol)}
              </span>
            </div>
          )}
          {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </button>

      {isExpanded && (
        <div className="p-5 border-t border-[#E5E8EF] space-y-6 text-slate-700 font-sans text-sm animate-in fade-in duration-200">
          {/* Warning Banners */}
          {isNegativeFCF && (
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex gap-2.5 text-xs text-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Negative Cash Flow: </span>
                This company has negative historical free cash flow. Intrinsic calculations may be unreliable or turn negative. Consider custom modeling below.
              </div>
            </div>
          )}

          {isFinancialSector && (
            <div className="p-3 bg-[#F0F5FF]/80 border border-[#E5E8EF] rounded-lg flex gap-2.5 text-xs text-slate-800">
              <HelpCircle className="h-4 w-4 text-[#1A6EFF] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Financial sector stock: </span>
                DCF calculations are less meaningful for financial institutions (banks, insurers). Standard cash flow does not account for interest income/capital rules. Consider dividend discount models.
              </div>
            </div>
          )}

          {/* Result Banner */}
          {dcfError ? (
            <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span className="font-bold">{dcfError}</span>
            </div>
          ) : dcfResult && (
            <div className={`p-5 rounded-xl border flex flex-col md:flex-row justify-between items-center gap-4 ${
              dcfResult.upsidePercent > 0 
                ? 'bg-emerald-50/50 border-emerald-100 text-emerald-950' 
                : 'bg-red-50/50 border-red-100 text-red-950'
            }`}>
              <div className="space-y-1 text-center md:text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">DCF Intrinsic Fair Value</span>
                <span className="text-3xl font-extrabold font-mono tracking-tight leading-none block">
                  {formatPrice(dcfResult.fairValuePerShare, exchange, symbol)}
                </span>
                <span className="text-[11.5px] text-slate-500 block">
                  Based on {projectionYears}-year projections and a {formatPercentChange(dcfResult.wacc * 100)} discount rate.
                </span>
              </div>

              <div className="flex items-center gap-5 shrink-0">
                <div className="text-center md:text-right border-slate-200/60 md:border-r pr-0 md:pr-5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Price</span>
                  <span className="text-lg font-bold font-mono text-slate-700 block">
                    {formatPrice(data.currentPrice, exchange, symbol)}
                  </span>
                </div>

                <div className="text-center md:text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Valuation Gap</span>
                  <span className={`text-xl font-black font-mono block ${
                    dcfResult.upsidePercent > 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
                  }`}>
                    {dcfResult.upsidePercent > 0 ? '▲' : '▼'} {Math.abs(dcfResult.upsidePercent).toFixed(1)}%
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 block">
                    {dcfResult.upsidePercent > 0 ? 'Undervalued' : 'Overvalued'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Assumptions Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Projections Card */}
            <div className="bg-[#F8F9FB] border border-[#E5E8EF] rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                <Sliders className="h-4.5 w-4.5 text-[#059669]" />
                <h4 className="font-sans font-bold text-[12.5px] text-slate-800 uppercase tracking-wider">
                  Growth & Projections
                </h4>
              </div>

              {/* Revenue Growth */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-600 flex items-center gap-1">
                    Revenue Growth Rate
                    <span className="text-slate-400 cursor-help" title="CAGR to project future revenues. Auto-populated from historical CAGR.">
                      <HelpCircle className="h-3.5 w-3.5" />
                    </span>
                  </span>
                  <span className="font-mono text-slate-500 text-[11px]">
                    Auto: {data.historicalRevenue && data.historicalRevenue.length >= 2 
                      ? ((Math.pow(data.historicalRevenue[data.historicalRevenue.length-1].value / data.historicalRevenue[0].value, 1/(data.historicalRevenue.length-1)) - 1)*100).toFixed(1)
                      : '8.0'}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="-0.20"
                    max="0.50"
                    step="0.005"
                    value={revenueGrowth}
                    onChange={(e) => setRevenueGrowth(parseFloat(e.target.value))}
                    className="flex-1 accent-[#059669] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <input
                    type="number"
                    value={Number((revenueGrowth * 100).toFixed(1))}
                    onChange={(e) => setRevenueGrowth(parseFloat(e.target.value) / 100)}
                    className="w-16 px-1.5 py-1 bg-white border border-[#E5E8EF] rounded text-right text-xs font-mono focus:outline-none focus:border-[#059669] text-slate-700"
                  />
                  <span className="text-xs text-slate-400 font-semibold">%</span>
                </div>
              </div>

              {/* FCF Margin */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-600 flex items-center gap-1">
                    Free Cash Flow Margin
                    <span className="text-slate-400 cursor-help" title="FCF as % of Revenue. Projected FCF = Projected Revenue * FCF Margin.">
                      <HelpCircle className="h-3.5 w-3.5" />
                    </span>
                  </span>
                  <span className="font-mono text-slate-500 text-[11px]">
                    Auto: {data.historicalFCF && data.historicalFCF.length > 0 ? 'historical avg' : '15%'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="0.60"
                    step="0.005"
                    value={fcfMargin}
                    onChange={(e) => setFcfMargin(parseFloat(e.target.value))}
                    className="flex-1 accent-[#059669] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <input
                    type="number"
                    value={Number((fcfMargin * 100).toFixed(1))}
                    onChange={(e) => setFcfMargin(parseFloat(e.target.value) / 100)}
                    className="w-16 px-1.5 py-1 bg-white border border-[#E5E8EF] rounded text-right text-xs font-mono focus:outline-none focus:border-[#059669] text-slate-700"
                  />
                  <span className="text-xs text-slate-400 font-semibold">%</span>
                </div>
              </div>

              {/* Projection Years */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  Projection Period
                  <span className="text-slate-400 cursor-help" title="Years of high-growth cash flows to project before terminal value.">
                    <HelpCircle className="h-3.5 w-3.5" />
                  </span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="3"
                    max="10"
                    step="1"
                    value={projectionYears}
                    onChange={(e) => setProjectionYears(parseInt(e.target.value))}
                    className="flex-1 accent-[#059669] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <input
                    type="number"
                    value={projectionYears}
                    onChange={(e) => setProjectionYears(parseInt(e.target.value))}
                    className="w-16 px-1.5 py-1 bg-white border border-[#E5E8EF] rounded text-right text-xs font-mono focus:outline-none focus:border-[#059669] text-slate-700"
                  />
                  <span className="text-xs text-slate-400 font-semibold w-4">Yrs</span>
                </div>
              </div>

              {/* Terminal Growth */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  Terminal Growth Rate (g)
                  <span className="text-slate-400 cursor-help" title="Long-term growth rate after projection period. Typically proxy for long-run GDP growth (2-3%).">
                    <HelpCircle className="h-3.5 w-3.5" />
                  </span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="0.05"
                    step="0.001"
                    value={terminalGrowth}
                    onChange={(e) => setTerminalGrowth(parseFloat(e.target.value))}
                    className="flex-1 accent-[#059669] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <input
                    type="number"
                    value={Number((terminalGrowth * 100).toFixed(1))}
                    onChange={(e) => setTerminalGrowth(parseFloat(e.target.value) / 100)}
                    className="w-16 px-1.5 py-1 bg-white border border-[#E5E8EF] rounded text-right text-xs font-mono focus:outline-none focus:border-[#059669] text-slate-700"
                  />
                  <span className="text-xs text-slate-400 font-semibold">%</span>
                </div>
              </div>
            </div>

            {/* Discount Rate (WACC) Card */}
            <div className="bg-[#F8F9FB] border border-[#E5E8EF] rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                <Sliders className="h-4.5 w-4.5 text-[#1A6EFF]" />
                <h4 className="font-sans font-bold text-[12.5px] text-slate-800 uppercase tracking-wider">
                  Discount Rate (WACC)
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Risk-Free Rate */}
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-0.5">
                    Risk-Free Rate
                    <span className="text-slate-400 cursor-help" title="10-Year Government Bond yield. Auto-populated from FRED DGS10 or RBI.">
                      <HelpCircle className="h-3.5 w-3.5" />
                    </span>
                  </span>
                  <input
                    type="number"
                    step="0.001"
                    value={Number((riskFreeRate * 100).toFixed(2))}
                    onChange={(e) => setRiskFreeRate(parseFloat(e.target.value) / 100)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E5E8EF] rounded-lg text-xs font-mono focus:outline-none focus:border-[#059669] text-slate-700"
                  />
                </div>

                {/* Beta */}
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-0.5">
                    Beta (Volatility)
                    <span className="text-slate-400 cursor-help" title="Stock price volatility vs. broader index. Auto-populated from Yahoo.">
                      <HelpCircle className="h-3.5 w-3.5" />
                    </span>
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={Number(beta.toFixed(2))}
                    onChange={(e) => setBeta(parseFloat(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E5E8EF] rounded-lg text-xs font-mono focus:outline-none focus:border-[#059669] text-slate-700"
                  />
                </div>

                {/* Equity Risk Premium */}
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-0.5">
                    Equity Risk Premium
                    <span className="text-slate-400 cursor-help" title="Excess return required over risk-free rate for stocks (long-term average ~5.5%).">
                      <HelpCircle className="h-3.5 w-3.5" />
                    </span>
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={Number((equityRiskPremium * 100).toFixed(2))}
                    onChange={(e) => setEquityRiskPremium(parseFloat(e.target.value) / 100)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E5E8EF] rounded-lg text-xs font-mono focus:outline-none focus:border-[#059669] text-slate-700"
                  />
                </div>

                {/* Cost of Debt */}
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-0.5">
                    Cost of Debt
                    <span className="text-slate-400 cursor-help" title="Average interest rate on debt. Derived from interestExpense/totalDebt.">
                      <HelpCircle className="h-3.5 w-3.5" />
                    </span>
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={Number((costOfDebt * 100).toFixed(2))}
                    onChange={(e) => setCostOfDebt(parseFloat(e.target.value) / 100)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E5E8EF] rounded-lg text-xs font-mono focus:outline-none focus:border-[#059669] text-slate-700"
                  />
                </div>

                {/* Tax Rate */}
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-0.5">
                    Effective Tax Rate
                    <span className="text-slate-400 cursor-help" title="Tax rate on corporate earnings. US standard Statutory is 21%.">
                      <HelpCircle className="h-3.5 w-3.5" />
                    </span>
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={Number((taxRate * 100).toFixed(2))}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) / 100)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E5E8EF] rounded-lg text-xs font-mono focus:outline-none focus:border-[#059669] text-slate-700"
                  />
                </div>

                {/* Calculated WACC */}
                <div className="p-3 bg-white border border-[#E5E8EF] rounded-lg flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Computed WACC</span>
                  <span className="font-mono font-extrabold text-slate-900 text-lg leading-none mt-1">
                    {dcfResult ? `${(dcfResult.wacc * 100).toFixed(2)}%` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Valuation Stats Collapsible Card */}
          <div className="border border-[#E5E8EF] rounded-xl p-4 space-y-4">
            <h4 className="font-sans font-bold text-[11.5px] text-slate-500 uppercase tracking-wider">
              Finances & Share Structure Assumptions
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Latest Revenue</label>
                <input
                  type="number"
                  value={latestRevenue}
                  onChange={(e) => setLatestRevenue(parseFloat(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-[#E5E8EF] rounded-lg text-xs font-mono focus:outline-none focus:bg-white text-slate-700"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Total Debt</label>
                <input
                  type="number"
                  value={totalDebt}
                  onChange={(e) => setTotalDebt(parseFloat(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-[#E5E8EF] rounded-lg text-xs font-mono focus:outline-none focus:bg-white text-slate-700"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Cash & Equivalents</label>
                <input
                  type="number"
                  value={cashAndEquivalents}
                  onChange={(e) => setCashAndEquivalents(parseFloat(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-[#E5E8EF] rounded-lg text-xs font-mono focus:outline-none focus:bg-white text-slate-700"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Shares Outstanding</label>
                <input
                  type="number"
                  value={sharesOutstanding}
                  onChange={(e) => setSharesOutstanding(parseFloat(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-[#E5E8EF] rounded-lg text-xs font-mono focus:outline-none focus:bg-white text-slate-700"
                />
              </div>
            </div>
          </div>

          {/* Projected Cash Flows Table */}
          {dcfResult && (
            <div className="space-y-3">
              <h4 className="font-sans font-bold text-[12.5px] text-slate-800 uppercase tracking-wider">
                Projected Free Cash Flows
              </h4>
              <div className="overflow-x-auto border border-[#E5E8EF] rounded-xl">
                <table className="min-w-full divide-y divide-[#E5E8EF] text-xs font-sans text-slate-700 bg-white">
                  <thead>
                    <tr className="bg-slate-50 border-b border-[#E5E8EF] text-[11.5px] font-bold text-slate-500 uppercase tracking-wider text-left">
                      <th className="py-2.5 px-4">Year</th>
                      <th className="text-right py-2.5 px-4">Revenue</th>
                      <th className="text-right py-2.5 px-4">Projected FCF</th>
                      <th className="text-right py-2.5 px-4">Discounted FCF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E8EF]">
                    {dcfResult.projectedYears.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-600">Year {idx + 1} ({item.year})</td>
                        <td className="text-right py-2.5 px-4 font-mono">{formatMarketCap(item.revenue, exchange, symbol)}</td>
                        <td className="text-right py-2.5 px-4 font-mono">{formatMarketCap(item.fcf, exchange, symbol)}</td>
                        <td className="text-right py-2.5 px-4 font-mono font-semibold text-[#1A6EFF]">
                          {formatMarketCap(item.discountedFcf, exchange, symbol)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50/60 font-bold border-t border-[#E5E8EF]">
                      <td className="py-2.5 px-4 text-slate-800">Terminal Value (TV)</td>
                      <td className="text-right py-2.5 px-4 font-mono text-slate-400">—</td>
                      <td className="text-right py-2.5 px-4 font-mono">{formatMarketCap(dcfResult.terminalValue, exchange, symbol)}</td>
                      <td className="text-right py-2.5 px-4 font-mono text-[#1A6EFF]">
                        {formatMarketCap(dcfResult.pvTerminalValue, exchange, symbol)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Valuation Bridge */}
          {dcfResult && (
            <div className="space-y-3">
              <h4 className="font-sans font-bold text-[12.5px] text-slate-800 uppercase tracking-wider">
                Valuation Bridge
              </h4>
              <div className="bg-[#F8F9FB] border border-[#E5E8EF] rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5 text-xs font-sans">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-200/50">
                  <span className="font-medium text-slate-600">PV of Projected Cash Flows</span>
                  <span className="font-mono font-bold text-slate-900">{formatMarketCap(dcfResult.pvFcfSum, exchange, symbol)}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-200/50">
                  <span className="font-medium text-slate-600">PV of Terminal Value</span>
                  <span className="font-mono font-bold text-slate-900">{formatMarketCap(dcfResult.pvTerminalValue, exchange, symbol)}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-200/50">
                  <span className="font-bold text-[#059669]">Enterprise Value (EV)</span>
                  <span className="font-mono font-extrabold text-[#059669]">{formatMarketCap(dcfResult.enterpriseValue, exchange, symbol)}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-200/50">
                  <span className="font-medium text-slate-600">Cash & Equivalents (+)</span>
                  <span className="font-mono font-bold text-slate-900">{formatMarketCap(cashAndEquivalents, exchange, symbol)}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-200/50">
                  <span className="font-medium text-slate-600">Total Debt (−)</span>
                  <span className="font-mono font-bold text-slate-900">{formatMarketCap(totalDebt, exchange, symbol)}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-200/50">
                  <span className="font-medium text-slate-600">Net Debt</span>
                  <span className="font-mono font-bold text-slate-900">{formatMarketCap(dcfResult.netDebt, exchange, symbol)}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-200/50">
                  <span className="font-bold text-slate-800">Equity Value</span>
                  <span className="font-mono font-extrabold text-slate-900">{formatMarketCap(dcfResult.equityValue, exchange, symbol)}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-200/50">
                  <span className="font-medium text-slate-600">Shares Outstanding</span>
                  <span className="font-mono font-bold text-slate-900">{formatShares(sharesOutstanding, exchange, symbol)}</span>
                </div>
                <div className="flex justify-between items-center py-2.5 col-span-1 md:col-span-2 border-t border-slate-200 mt-1">
                  <span className="font-black text-sm text-slate-900">Intrinsic Value / Share</span>
                  <span className="font-mono font-black text-lg text-[#059669]">
                    {formatPrice(dcfResult.fairValuePerShare, exchange, symbol)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Sensitivity Table */}
          {dcfResult && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-sans font-bold text-[12.5px] text-slate-800 uppercase tracking-wider">
                  Sensitivity Grid (Fair Value vs. WACC & Growth)
                </h4>
                <span className="text-[10px] text-slate-400 italic">calculated in real-time</span>
              </div>
              <div className="overflow-x-auto border border-[#E5E8EF] rounded-xl">
                <table className="min-w-full divide-y divide-[#E5E8EF] text-xs font-sans bg-white text-center">
                  <thead>
                    <tr className="bg-slate-50 border-b border-[#E5E8EF] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-4 border-r border-[#E5E8EF] text-left text-slate-500 font-bold whitespace-nowrap">
                        WACC \ Terminal Growth
                      </th>
                      {growthSteps.map((g, idx) => (
                        <th key={idx} className="py-2.5 px-4 font-mono font-bold">
                          {formatPercentChange(g * 100)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E8EF] font-mono text-slate-600">
                    {waccSteps.map((wVal, rIdx) => {
                      const isBaseWacc = Math.abs(wVal - dcfResult!.wacc) < 0.0001;
                      return (
                        <tr key={rIdx} className={`${isBaseWacc ? 'bg-[#F0F5FF]/40 font-bold' : 'hover:bg-slate-50/50'} transition`}>
                          <td className="py-2.5 px-4 font-bold border-r border-[#E5E8EF] text-left bg-slate-50/40 text-slate-700">
                            {formatPercentChange(wVal * 100)}
                          </td>
                          {growthSteps.map((gVal, cIdx) => {
                            const val = sensitivityTable[rIdx]?.[cIdx];
                            const isBaseGrowth = Math.abs(gVal - terminalGrowth) < 0.0001;
                            const isCenter = isBaseWacc && isBaseGrowth;
                            
                            return (
                              <td 
                                key={cIdx} 
                                className={`py-2.5 px-4 text-center ${
                                  isCenter 
                                    ? 'bg-[#059669]/10 text-[#059669] font-black border border-[#059669]/20' 
                                    : isNaN(val) || val <= 0 
                                      ? 'text-slate-350' 
                                      : 'text-slate-700'
                                }`}
                              >
                                {isNaN(val) || val <= 0 ? '—' : formatPrice(val, exchange, symbol)}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex justify-between items-center border-t border-slate-100 pt-4 text-xs">
            <span className="text-slate-400 font-mono text-[10.5px]">
              Data freshness: {new Date(data.dataFreshness).toLocaleString()}
            </span>
            <button
              onClick={resetToDefaults}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200/70 border border-[#E5E8EF] rounded-lg font-semibold text-slate-600 flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset to Defaults</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
