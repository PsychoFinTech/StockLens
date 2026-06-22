import React from "react";
import { Observation } from "../../utils/macroHelpers";
import { AlertTriangle, TrendingUp, TrendingDown, Activity } from "lucide-react";

interface MacroRegimeCardProps {
  t10y2y: Observation[];
  unrate: Observation[];
  baml: Observation[];
}

export const MacroRegimeCard: React.FC<MacroRegimeCardProps> = ({ t10y2y, unrate, baml }) => {
  if (!t10y2y.length || !unrate.length || !baml.length) return null;

  const currentYieldSpread = t10y2y[t10y2y.length - 1].value;
  const currentUnemployment = unrate[unrate.length - 1].value;
  const unrate6moAgo = unrate.length > 6 ? unrate[unrate.length - 6].value : currentUnemployment;
  const currentSpread = baml[baml.length - 1].value;
  
  // Sahm rule proxy
  const sahmTriggered = (currentUnemployment - unrate6moAgo) >= 0.5;
  const yieldInverted = currentYieldSpread < 0;
  const highStress = currentSpread > 5.0;

  // Determine Regime
  let regime = "Expansion";
  let color = "text-emerald-600";
  let bg = "bg-emerald-50/90";
  let border = "border-emerald-200/50";
  let icon = <TrendingUp className="h-8 w-8 text-emerald-600" />;
  let description = "Growth is solid, financial stress is low, and the yield curve is normal. Broadly bullish for equities.";

  if (sahmTriggered && highStress) {
    regime = "Contraction / Recession";
    color = "text-rose-600";
    bg = "bg-rose-50/90";
    border = "border-rose-200/50";
    icon = <TrendingDown className="h-8 w-8 text-rose-600" />;
    description = "Unemployment is rising rapidly and credit markets are stressed. Defensive positioning recommended.";
  } else if (yieldInverted && !sahmTriggered) {
    regime = "Late Cycle / Slowdown Warning";
    color = "text-amber-600";
    bg = "bg-amber-50/90";
    border = "border-amber-200/50";
    icon = <AlertTriangle className="h-8 w-8 text-amber-600" />;
    description = "The yield curve is inverted, historically signaling an impending slowdown. Watch employment data closely.";
  } else if (!yieldInverted && sahmTriggered) {
    regime = "Early Recovery";
    color = "text-blue-600";
    bg = "bg-blue-50/90";
    border = "border-blue-200/50";
    icon = <Activity className="h-8 w-8 text-blue-600" />;
    description = "The yield curve has un-inverted but unemployment remains loose. Often precedes a new cycle of growth as the Fed cuts rates.";
  } else if (highStress && !sahmTriggered) {
    regime = "Financial Stress / Shock";
    color = "text-orange-600";
    bg = "bg-orange-50/90";
    border = "border-orange-200/50";
    icon = <AlertTriangle className="h-8 w-8 text-orange-600" />;
    description = "Credit spreads are blowing out despite a stable labor market. High risk of market volatility.";
  }

  return (
    <div className={`p-6 rounded-3xl border ${bg} ${border} mb-8 flex flex-col md:flex-row gap-6 items-start md:items-center shadow-xl shadow-blue-500/5 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/15 hover:-translate-y-1`}>
      <div className={`p-4 rounded-2xl bg-white shadow-sm border ${border} shrink-0`}>
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-500"></span>
          </span>
          AI Macro Regime Identifier
        </h3>
        <h2 className={`text-2xl font-black ${color} mb-2`}>
          Current Phase: {regime}
        </h2>
        <p className="text-gray-800 font-medium text-sm leading-relaxed">
          {description}
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full md:w-[260px] bg-white/60 p-4 rounded-xl border border-white/50 backdrop-blur-sm">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-gray-600">Yield Curve (10Y-2Y)</span>
          <span className={`text-sm font-black font-mono ${yieldInverted ? 'text-rose-600' : 'text-emerald-600'}`}>
            {currentYieldSpread > 0 ? '+' : ''}{currentYieldSpread.toFixed(2)}%
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-gray-600">Sahm Rule Risk (6M Δ)</span>
          <span className={`text-sm font-black font-mono ${sahmTriggered ? 'text-rose-600' : 'text-emerald-600'}`}>
            {((currentUnemployment - unrate6moAgo) > 0 ? '+' : '')}{(currentUnemployment - unrate6moAgo).toFixed(2)}%
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-gray-600">Credit Stress</span>
          <span className={`text-sm font-black font-mono ${highStress ? 'text-rose-600' : 'text-emerald-600'}`}>
            {currentSpread.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
};
