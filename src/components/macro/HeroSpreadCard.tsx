import React, { useState } from "react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import { Observation, TimeRange, filterByRange, formatSpreadValue } from "../../utils/macroHelpers";
import { TimeRangeTabs } from "./TimeRangeTabs";

interface HeroSpreadCardProps {
  spreadData: Observation[];
}

export const HeroSpreadCard: React.FC<HeroSpreadCardProps> = ({ spreadData }) => {
  const [activeRange, setActiveRange] = useState<TimeRange>("1Y");

  if (!spreadData || spreadData.length === 0) return null;

  const filteredData = filterByRange(spreadData, activeRange);
  const latestValue = spreadData[spreadData.length - 1].value;
  const isNormal = latestValue >= 0;

  const strokeColor = isNormal ? "#22c55e" : "#ef4444";
  const fillColor = isNormal ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)";

  return (
    <div 
      className="border border-white/50 bg-white/95 backdrop-blur-xl rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[300px] shadow-xl shadow-blue-500/5 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-2"
      style={{ borderLeftWidth: "4px", borderLeftColor: strokeColor }}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Yield Curve Spread (10Y − 2Y)</h2>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-4xl font-bold text-gray-900 tracking-tight">
              {formatSpreadValue(latestValue)}
            </span>
            <div 
              className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center ${
                isNormal ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
              }`}
            >
              {isNormal ? "● Normal" : "⚠ Inverted — Recession Signal"}
            </div>
          </div>
        </div>
        
        <div className="mt-4 sm:mt-0 z-10">
          <TimeRangeTabs
            ranges={["1M", "6M", "1Y", "5Y", "10Y", "Max"]}
            activeRange={activeRange}
            onChange={setActiveRange}
          />
        </div>
      </div>

      <div className="h-[160px] w-full -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <Tooltip
              contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
              formatter={(val: any) => [formatSpreadValue(Number(val)), "Spread"]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={strokeColor}
              strokeWidth={2}
              fill={fillColor}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
