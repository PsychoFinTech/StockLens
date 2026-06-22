import React, { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Observation, TimeRange, filterByRange } from "../../utils/macroHelpers";
import { TimeRangeTabs } from "./TimeRangeTabs";

interface ExpandedChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  currentValue: string;
  observations: Observation[];
  interpretation?: string;
}

export const ExpandedChartModal: React.FC<ExpandedChartModalProps> = ({
  isOpen,
  onClose,
  title,
  currentValue,
  observations,
  interpretation,
}) => {
  const [activeRange, setActiveRange] = useState<TimeRange>("1Y");

  if (!isOpen) return null;

  const filteredData = filterByRange(observations, activeRange);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-[800px] bg-white rounded-xl shadow-xl p-8"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <div className="flex justify-between items-start mb-6">
          <div className="max-w-[75%]">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <div className="text-3xl font-bold text-gray-900 mt-2">{currentValue}</div>
            {interpretation && (
              <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-indigo-900 leading-relaxed font-medium">
                {interpretation}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex justify-end mb-4">
          <TimeRangeTabs
            ranges={["1M", "6M", "1Y", "5Y", "10Y", "Max"]}
            activeRange={activeRange}
            onChange={setActiveRange}
          />
        </div>

        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickFormatter={(val) => {
                  const d = new Date(val);
                  return `${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`;
                }}
                tickMargin={10}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickFormatter={(val) => val.toString()}
              />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#22c55e"
                strokeWidth={2}
                fill="rgba(34,197,94,0.08)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
