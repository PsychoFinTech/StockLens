import React from 'react';

export const RelevanceBadge: React.FC = () => {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#fef3c7] text-[#92400e] text-[11px] font-sans font-medium">
      <span>⚠</span>
      <span>Sits on relevant committee</span>
    </span>
  );
};
