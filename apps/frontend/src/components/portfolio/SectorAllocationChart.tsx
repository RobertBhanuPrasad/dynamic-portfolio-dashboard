"use client";

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { SectorGroup } from '../../types/portfolio.types';
import { formatCurrency, formatPercentage } from '../../lib/formatters';

interface SectorAllocationChartProps {
  sectors: SectorGroup[];
}

const COLORS = ['#0284c7', '#059669', '#d97706', '#dc2626', '#7c3aed', '#475569', '#0891b2', '#be123c'];

export function SectorAllocationChart({ sectors }: SectorAllocationChartProps) {
  // Transform data for the chart
  const data = sectors
    .map((group) => ({
      name: group.sector.name,
      value: group.summary.totalInvestment,
    }))
    // Sort by largest allocation first
    .sort((a, b) => b.value - a.value);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = (data.value / total) * 100;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-lg text-sm border border-slate-700">
          <p className="font-semibold mb-1">{data.name}</p>
          <p>{formatCurrency(data.value)}</p>
          <p className="text-slate-300 opacity-80">{formatPercentage(percentage)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      className="h-[300px] w-full"
      role="region" 
      aria-label="Sector Allocation Chart"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconType="circle"
            wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
