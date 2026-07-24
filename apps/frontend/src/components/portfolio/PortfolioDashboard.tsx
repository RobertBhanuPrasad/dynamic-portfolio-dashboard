"use client";

import React from 'react';
import type { Portfolio } from '../../types/portfolio.types';
import { usePortfolio } from '../../hooks/usePortfolio';
import { PortfolioSummaryCards } from './PortfolioSummaryCards';
import { SectorSection } from './SectorSection';
import { RefreshStatus } from './RefreshStatus';
import { SectorAllocationChart } from './SectorAllocationChart';

interface PortfolioDashboardProps {
  initialPortfolio?: Portfolio | null;
}

export function PortfolioDashboard({ initialPortfolio }: PortfolioDashboardProps) {
  const { 
    data: portfolio, 
    isLoading, 
    isRefreshing, 
    error, 
    lastUpdated, 
    refresh 
  } = usePortfolio(initialPortfolio);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-600 font-medium animate-pulse">Loading portfolio data...</p>
      </div>
    );
  }

  // Initial fetch error (no data yet)
  if (error && !portfolio) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-red-50 rounded-lg border border-red-100">
        <h2 className="text-xl font-bold text-red-800 mb-2">Unable to load portfolio</h2>
        <p className="text-red-600 mb-6 text-center max-w-md">
          {error.message || 'We encountered an error while communicating with the backend API.'}
        </p>
        <button
          onClick={() => refresh()}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-slate-50 rounded-lg border border-slate-200 text-slate-600">
        <h2 className="text-xl font-semibold mb-2">No Portfolio Data</h2>
        <p>No portfolio data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{portfolio.name}</h2>
          <p className="text-slate-500">Live portfolio performance and financial metrics</p>
        </div>
        <RefreshStatus 
          lastUpdated={lastUpdated} 
          isRefreshing={isRefreshing} 
          onRefresh={refresh} 
        />
      </div>

      {/* Background Error Warning */}
      {error && portfolio && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-md text-sm flex justify-between items-center">
          <span>⚠️ Unable to refresh live data. Displaying last known values.</span>
          <button onClick={() => refresh()} className="font-semibold underline hover:text-amber-900">Retry now</button>
        </div>
      )}

      <PortfolioSummaryCards summary={portfolio.summary} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Sector Allocation</h3>
          <p className="text-xs text-slate-500 mb-4">Portfolio investment distribution by sector</p>
          <SectorAllocationChart sectors={portfolio.sectors} />
        </div>
        
        <div className="lg:col-span-2 bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-800 text-white flex flex-col justify-center items-center text-center">
          <h3 className="text-xl font-bold mb-2">Dynamic Portfolio</h3>
          <p className="text-slate-400 max-w-md">
            This dashboard dynamically merges your historical holdings from PostgreSQL with real-time quotes and fundamentals from Yahoo and Google Finance.
          </p>
          {portfolio.summary.marketDataCoverage.pricedHoldings < portfolio.summary.marketDataCoverage.totalHoldings && (
             <div className="mt-6 px-4 py-2 bg-slate-800 rounded-md border border-slate-700 text-sm text-slate-300">
               <span className="text-amber-400 font-semibold mr-2">Note:</span>
               Some market prices are currently unavailable. Null values are safely preserved as — without impacting historical investment totals.
             </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-bold text-slate-800 mb-4">Holdings by Sector</h3>
        {portfolio.sectors.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-white border border-slate-200 rounded-lg">
            No holdings found in this portfolio.
          </div>
        ) : (
          <div className="space-y-6">
            {portfolio.sectors.map((sectorGroup) => (
              <SectorSection key={sectorGroup.sector.id} sectorGroup={sectorGroup} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
