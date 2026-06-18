import React from "react";
import { TimeRange } from "../../utils/macroHelpers";

interface TimeRangeTabsProps {
  ranges: TimeRange[];
  activeRange: TimeRange;
  onChange: (range: TimeRange) => void;
}

export const TimeRangeTabs: React.FC<TimeRangeTabsProps> = ({ ranges, activeRange, onChange }) => {
  return (
    <div className="flex space-x-2">
      {ranges.map((range) => {
        const isActive = activeRange === range;
        return (
          <button
            key={range}
            onClick={() => onChange(range)}
            className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
              isActive
                ? "text-emerald-700 font-bold border-b-2 border-emerald-500"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {range}
          </button>
        );
      })}
    </div>
  );
};
