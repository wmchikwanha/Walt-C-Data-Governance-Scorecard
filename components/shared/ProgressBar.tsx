
import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total }) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-base font-medium text-brand-primary">Progress</span>
        <span className="text-sm font-medium text-brand-primary">{current} of {total} questions answered ({percentage.toFixed(0)}%)</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
            className="bg-brand-secondary h-2.5 rounded-full transition-all duration-500" 
            style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
