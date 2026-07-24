import React from 'react';
import type { SectorGroup } from '../../types/portfolio.types';
import { formatCurrency, formatPercentage } from '../../lib/formatters';
import { PortfolioTable } from './PortfolioTable';
import { GainLoss } from './GainLoss';

interface SectorSectionProps {
  sectorGroup: SectorGroup;
}

export function SectorSection({ sectorGroup }: SectorSectionProps) {
  const { sector, summary, holdings } = sectorGroup;
  
  // Calculate portfolio % of this sector (using investment)
  // Wait, the assignment says: "Do NOT calculate financial metrics again in React... Sector totals, Portfolio totals. Those calculations belong to the backend PortfolioCalculator."
  // Since the backend doesn't seem to return `portfolioPercentage` at the sector summary level in `SectorSummary`, we'll only display the ones provided in `summary` (totalInvestment, totalPresentValue, gainLoss, gainLossPercentage).

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-6">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">{sector.name}</h3>
          <p className="text-sm text-slate-500">{holdings.length} holdings</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">Investment</p>
            <p className="font-medium text-slate-900">{formatCurrency(summary.totalInvestment)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">Present Value</p>
            <p className="font-medium text-slate-900">{formatCurrency(summary.totalPresentValue)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">Gain/Loss</p>
            <GainLoss value={summary.gainLoss} percentage={summary.gainLossPercentage} />
          </div>
        </div>
      </div>
      
      <PortfolioTable holdings={holdings} />
    </div>
  );
}
