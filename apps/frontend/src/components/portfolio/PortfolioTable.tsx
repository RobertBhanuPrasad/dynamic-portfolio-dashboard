import React from 'react';
import type { Holding } from '../../types/portfolio.types';
import { formatCurrency, formatPercentage } from '../../lib/formatters';
import { GainLoss } from './GainLoss';

interface PortfolioTableProps {
  holdings: Holding[];
}

export function PortfolioTable({ holdings }: PortfolioTableProps) {
  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-sm text-left text-slate-600 whitespace-nowrap">
        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 sticky top-0">
          <tr>
            <th className="px-4 py-3 font-semibold sticky left-0 bg-slate-50 z-10 shadow-[1px_0_0_0_#e2e8f0]">Company</th>
            <th className="px-4 py-3 font-semibold">Ticker</th>
            <th className="px-4 py-3 font-semibold text-right">Qty</th>
            <th className="px-4 py-3 font-semibold text-right">Avg Price</th>
            <th className="px-4 py-3 font-semibold text-right">Investment</th>
            <th className="px-4 py-3 font-semibold text-right">Port %</th>
            <th className="px-4 py-3 font-semibold text-right">CMP</th>
            <th className="px-4 py-3 font-semibold text-right">Present Value</th>
            <th className="px-4 py-3 font-semibold text-right">Gain/Loss</th>
            <th className="px-4 py-3 font-semibold text-right">P/E</th>
            <th className="px-4 py-3 font-semibold text-right">Earnings</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((holding) => (
            <tr key={holding.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 font-medium text-slate-900 sticky left-0 bg-white shadow-[1px_0_0_0_#e2e8f0]">
                {holding.companyName}
              </td>
              <td className="px-4 py-3 text-slate-500">{holding.ticker}</td>
              <td className="px-4 py-3 text-right">{holding.quantity}</td>
              <td className="px-4 py-3 text-right">{formatCurrency(holding.purchasePrice)}</td>
              <td className="px-4 py-3 text-right font-medium">{formatCurrency(holding.investment)}</td>
              <td className="px-4 py-3 text-right">{formatPercentage(holding.portfolioPercentage)}</td>
              
              <td className="px-4 py-3 text-right bg-slate-50/50">{formatCurrency(holding.currentMarketPrice)}</td>
              <td className="px-4 py-3 text-right bg-slate-50/50 font-medium">{formatCurrency(holding.presentValue)}</td>
              <td className="px-4 py-3 text-right bg-slate-50/50">
                <div className="flex justify-end">
                  <GainLoss value={holding.gainLoss} percentage={holding.gainLossPercentage} />
                </div>
              </td>
              
              <td className="px-4 py-3 text-right text-slate-500">
                {holding.peRatio !== null ? holding.peRatio.toFixed(2) : '—'}
              </td>
              <td className="px-4 py-3 text-right text-slate-500">
                {holding.latestEarnings !== null ? holding.latestEarnings : '—'}
              </td>
            </tr>
          ))}
          {holdings.length === 0 && (
            <tr>
              <td colSpan={11} className="px-4 py-8 text-center text-slate-500">
                No holdings found in this sector.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
