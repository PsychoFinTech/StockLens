import React, { useState } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { MacroSeriesConfig } from "../../constants/macroConfig";
import { Observation } from "../../utils/macroHelpers";
import { ExpandedChartModal } from "./ExpandedChartModal";

interface IndicatorCardProps {
  config: MacroSeriesConfig;
  observations: Observation[];
  error?: boolean;
  onRetry: () => void;
}

export const IndicatorCard: React.FC<IndicatorCardProps> = ({ config, observations, error, onRetry }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (error) {
    return (
      <div className="bg-white border border-gray-300 rounded-[10px] p-5 h-[160px] flex flex-col justify-center items-center">
        <div className="text-gray-900 font-bold mb-2">{config.name}</div>
        <div className="text-red-500 mb-4 text-sm flex items-center">
          <span className="mr-1">⚠</span> Failed to load
        </div>
        <button
          onClick={onRetry}
          className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!observations || observations.length === 0) return null;

  const latestObs = observations[observations.length - 1];
  const prevObs = observations.length > 1 ? observations[observations.length - 2] : null;

  const currentValueStr = config.formatter(latestObs.value);
  let changeStr = "—";
  let changeColor = "text-gray-500";
  let changeIcon = "";

  if (prevObs) {
    const diff = latestObs.value - prevObs.value;
    if (Math.abs(diff) > 0.0001) {
      const isPositive = diff > 0;
      changeIcon = isPositive ? "▲" : "▼";
      
      // Handle inverse logic for UNRATE and ICSA (lower is better, so red for up)
      const isInverse = config.id === "UNRATE" || config.id === "ICSA";
      if (isPositive) {
        changeColor = isInverse ? "text-red-500" : "text-emerald-500";
      } else {
        changeColor = isInverse ? "text-emerald-500" : "text-red-500";
      }

      // Format diff roughly
      const formattedDiff = config.id === "GDPC1" 
        ? `$${Math.abs(diff).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}B`
        : config.id === "ICSA"
        ? `${(Math.abs(diff) / 1000).toFixed(1)}K`
        : Math.abs(diff).toFixed(2);
        
      changeStr = `${changeIcon} ${formattedDiff}`;
    }
  }

  // Sparkline data (last 30 obs)
  const sparkData = observations.slice(-30);

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className="bg-white border border-gray-200 rounded-[10px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5 h-[160px] cursor-pointer hover:border-emerald-300 transition-colors flex flex-col justify-between group"
      >
        <div>
          <div className="font-mono text-xs text-gray-500 mb-1">{config.id}</div>
          <div className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
            {config.name}
          </div>
        </div>
        
        <div className="flex justify-between items-end mt-2">
          <div>
            <div className="text-2xl font-bold text-gray-900 leading-none">
              {currentValueStr}
            </div>
            <div className={`text-xs font-medium mt-1.5 ${changeColor}`}>
              {changeStr}
            </div>
          </div>
          
          <div className="h-[56px] w-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <ExpandedChartModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={config.name}
        currentValue={currentValueStr}
        observations={observations}
      />
    </>
  );
};
