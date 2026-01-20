import React from 'react';

interface ProgressBarProps {
  progress: number;
  status?: 'normal' | 'risk' | 'delayed' | 'completed';
  height?: string;
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  status = 'normal', 
  height = 'h-4',
  showLabel = true
}) => {
  let colorClass = 'bg-primary';
  if (status === 'risk') colorClass = 'bg-warning';
  if (status === 'delayed') colorClass = 'bg-danger';
  if (status === 'completed') colorClass = 'bg-success';

  return (
    <div className="w-full">
      <div className="flex justify-between mb-1">
        {showLabel && <span className="text-xs font-medium text-slate-700">进度</span>}
        {showLabel && <span className="text-xs font-medium text-slate-700">{progress}%</span>}
      </div>
      <div className={`w-full bg-slate-200 rounded-full ${height} overflow-hidden`}>
        <div
          className={`${colorClass} ${height} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};