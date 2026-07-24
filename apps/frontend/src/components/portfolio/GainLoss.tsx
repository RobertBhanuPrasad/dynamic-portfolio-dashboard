import React from 'react';
import { formatCurrency, formatPercentage } from '../../lib/formatters';

interface GainLossProps {
  value: number | null;
  percentage: number | null;
}

export function GainLoss({ value, percentage }: GainLossProps) {
  if (value === null || percentage === null) {
    return <span className="text-slate-500">—</span>;
  }

  const isPositive = value > 0;
  const isNegative = value < 0;
  
  let colorClass = 'text-slate-700';
  if (isPositive) colorClass = 'text-green-600';
  if (isNegative) colorClass = 'text-red-600';

  const prefix = isPositive ? '+' : '';

  return (
    <div className={`flex items-center gap-1 ${colorClass}`}>
      <span className="font-medium">
        {prefix}{formatCurrency(value)}
      </span>
      <span className="text-xs opacity-80">
        ({prefix}{formatPercentage(percentage)})
      </span>
    </div>
  );
}
