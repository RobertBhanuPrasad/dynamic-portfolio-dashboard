import React from 'react';

interface RefreshStatusProps {
  lastUpdated: Date | null;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function RefreshStatus({ lastUpdated, isRefreshing, onRefresh }: RefreshStatusProps) {
  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-2">
        <div className="relative flex h-3 w-3">
          {isRefreshing ? (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          ) : (
            <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          )}
          <span className={`relative inline-flex rounded-full h-3 w-3 ${isRefreshing ? 'bg-blue-500' : 'bg-green-500'}`}></span>
        </div>
        <span className="text-slate-600">
          {isRefreshing ? 'Refreshing...' : 'Live'}
        </span>
      </div>
      
      {lastUpdated && (
        <span className="text-slate-500">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </span>
      )}
      
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className="px-3 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-700 disabled:opacity-50 transition-colors"
        aria-label="Refresh portfolio data"
      >
        Refresh
      </button>
    </div>
  );
}
