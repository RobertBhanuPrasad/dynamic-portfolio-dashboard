import { ApiClient } from '../lib/api';
import type { PortfolioApiResponse, Portfolio } from '../types/portfolio.types';

export class PortfolioService {
  /**
   * Fetches the portfolios and returns the primary portfolio data.
   */
  static async getPortfolios(): Promise<Portfolio[]> {
    const response = await ApiClient.get<PortfolioApiResponse>('/api/v1/portfolios');
    if (!response.success) {
      throw new Error('Failed to fetch portfolios');
    }
    return response.data;
  }
}
