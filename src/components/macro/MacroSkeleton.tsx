import React from "react";

export const MacroSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Hero Spread Card Skeleton */}
      <div className="w-full bg-white border border-gray-200 rounded-[10px] shadow-sm p-6 h-[300px]">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-gray-200 rounded"></div>
            <div className="h-10 w-32 bg-gray-200 rounded"></div>
          </div>
          <div className="h-8 w-24 bg-gray-200 rounded-full"></div>
        </div>
        <div className="mt-8 h-[160px] w-full bg-gray-100 rounded"></div>
      </div>

      {/* Grid Sections Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-[10px] shadow-sm p-5 h-[160px]">
            <div className="flex justify-between mb-4">
              <div className="space-y-2">
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
                <div className="h-5 w-40 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <div className="h-8 w-24 bg-gray-200 rounded"></div>
                <div className="h-4 w-16 bg-gray-100 rounded"></div>
              </div>
              <div className="h-[56px] w-24 bg-gray-100 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
