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
        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 sticky top-0 z-20">
          <tr>
            <th colSpan={2} className="px-4 py-2 border-b border-slate-200 bg-slate-100 text-center sticky left-0 z-30 shadow-[1px_0_0_0_#e2e8f0]">Company info</th>
            <th colSpan={4} className="px-4 py-2 border-b border-r border-slate-200 bg-slate-100 text-center">Portfolio</th>
            <th colSpan={3} className="px-4 py-2 border-b border-r border-slate-200 bg-slate-100 text-center">Market</th>
            <th colSpan={2} className="px-4 py-2 border-b border-slate-200 bg-slate-100 text-center">Fundamentals</th>
          </tr>
          <tr>
            <th className="px-4 py-3 font-semibold sticky left-0 bg-slate-50 z-20 shadow-[1px_0_0_0_#e2e8f0]">Company</th>
            <th className="px-4 py-3 font-semibold border-r border-slate-200">Ticker</th>
            <th className="px-4 py-3 font-semibold text-right">Qty</th>
            <th className="px-4 py-3 font-semibold text-right">Avg Price</th>
            <th className="px-4 py-3 font-semibold text-right">Investment</th>
            <th className="px-4 py-3 font-semibold text-right border-r border-slate-200">Port %</th>
            <th className="px-4 py-3 font-semibold text-right">CMP</th>
            <th className="px-4 py-3 font-semibold text-right">Present Value</th>
            <th className="px-4 py-3 font-semibold text-right border-r border-slate-200">Gain/Loss</th>
            <th className="px-4 py-3 font-semibold text-right">P/E</th>
            <th className="px-4 py-3 font-semibold text-right">Earnings</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((holding) => (
            <tr key={holding.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 font-medium text-slate-900 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_#e2e8f0]">
                {holding.companyName}
              </td>
              <td className="px-4 py-3 text-slate-500 border-r border-slate-200">{holding.ticker}</td>
              <td className="px-4 py-3 text-right">{holding.quantity}</td>
              <td className="px-4 py-3 text-right">{formatCurrency(holding.purchasePrice)}</td>
              <td className="px-4 py-3 text-right font-medium">{formatCurrency(holding.investment)}</td>
              <td className="px-4 py-3 text-right border-r border-slate-200">{formatPercentage(holding.portfolioPercentage)}</td>
              
              <td className="px-4 py-3 text-right bg-slate-50/50">{formatCurrency(holding.currentMarketPrice)}</td>
              <td className="px-4 py-3 text-right bg-slate-50/50 font-medium">{formatCurrency(holding.presentValue)}</td>
              <td className="px-4 py-3 text-right bg-slate-50/50 border-r border-slate-200">
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
