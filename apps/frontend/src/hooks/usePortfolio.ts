import { useState, useEffect, useCallback, useRef } from 'react';
import { PortfolioService } from '../services/portfolio.service';
import type { Portfolio } from '../types/portfolio.types';

interface UsePortfolioResult {
  data: Portfolio | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

export function usePortfolio(initialData?: Portfolio | null): UsePortfolioResult {
  const [data, setData] = useState<Portfolio | null>(initialData || null);
  const [isLoading, setIsLoading] = useState<boolean>(!initialData);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(initialData ? new Date() : null);
  
  // Use refs to prevent stale closures in the interval
  const isFetchingRef = useRef(false);

  const fetchPortfolio = useCallback(async (isBackgroundRefresh = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (isBackgroundRefresh) {
      setIsRefreshing(true);
    } else if (!data) {
      setIsLoading(true);
    }

    try {
      const portfolios = await PortfolioService.getPortfolios();
      const primary = portfolios.length > 0 ? portfolios[0] : null;
      setData(primary);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch portfolio data:', err);
      // If it's a background refresh, we DO NOT clear the existing data
      // We just set the error state
      if (!isBackgroundRefresh && !data) {
        setError(err instanceof Error ? err : new Error('Unknown error fetching portfolio'));
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      isFetchingRef.current = false;
    }
  }, [data]);

  // Initial fetch if no initial data
  useEffect(() => {
    if (!initialData) {
      fetchPortfolio(false);
    }
  }, [initialData, fetchPortfolio]);

  // Polling mechanism
  useEffect(() => {
    // 15 seconds = 15000 ms
    const intervalId = setInterval(() => {
      fetchPortfolio(true);
    }, 15000);

    return () => clearInterval(intervalId);
  }, [fetchPortfolio]);

  const handleManualRefresh = useCallback(async () => {
    await fetchPortfolio(true);
  }, [fetchPortfolio]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
    refresh: handleManualRefresh,
  };
}
