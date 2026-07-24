import React from 'react';
import type { PortfolioSummary } from '../../types/portfolio.types';
import { formatCurrency, formatNumber } from '../../lib/formatters';
import { GainLoss } from './GainLoss';

interface PortfolioSummaryCardsProps {
  summary: PortfolioSummary;
}

export function PortfolioSummaryCards({ summary }: PortfolioSummaryCardsProps) {
  const { marketDataCoverage } = summary;

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
        <h3 className="text-sm font-medium text-slate-500 mb-1">Total Investment</h3>
        <p className="text-2xl font-bold text-slate-900">{formatCurrency(summary.totalInvestment)}</p>
      </div>
      
      <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
        <h3 className="text-sm font-medium text-slate-500 mb-1">Present Value</h3>
        <p className="text-2xl font-bold text-slate-900">
          {formatCurrency(summary.totalPresentValue)}
        </p>
      </div>

      <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
        <h3 className="text-sm font-medium text-slate-500 mb-1">Total Gain/Loss</h3>
        <div className="text-2xl">
          <GainLoss value={summary.totalGainLoss} percentage={summary.totalGainLossPercentage} />
        </div>
      </div>
      
      <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
        <h3 className="text-sm font-medium text-slate-500 mb-1">Active Holdings</h3>
        <p className="text-2xl font-bold text-slate-900">{formatNumber(marketDataCoverage.totalHoldings)}</p>
      </div>
      
      <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
        <h3 className="text-sm font-medium text-slate-500 mb-1">Market Data</h3>
        <p className="text-2xl font-bold text-slate-900">
          {marketDataCoverage.pricedHoldings} / {marketDataCoverage.totalHoldings}
        </p>
        <p className="text-xs text-slate-400 mt-1">prices available</p>
      </div>
    </section>
  );
}
