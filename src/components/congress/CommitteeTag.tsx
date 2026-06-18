import React from 'react';

interface CommitteeTagProps {
  label: string;
}

export const CommitteeTag: React.FC<CommitteeTagProps> = ({ label }) => {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-500 text-[11px] font-sans font-medium whitespace-nowrap">
      {label}
    </span>
  );
};
