import {
  HoldingResponse,
  PortfolioSummaryResponse,
  SectorGroupResponse,
  SectorSummaryResponse,
  MarketDataCoverage,
} from '../../types/portfolio.types';

export class PortfolioCalculator {
  /**
   * Safe financial rounding to 2 decimal places.
   */
  static round2(val: number): number {
    if (isNaN(val) || !isFinite(val)) return 0;
    return Number(Math.round(Number(val + 'e2')) + 'e-2');
  }

  /**
   * Computes the initial investment for a holding.
   */
  static calculateInvestment(purchasePrice: number, quantity: number): number {
    return this.round2(purchasePrice * quantity);
  }

  /**
   * Computes the present value. Returns null if CMP is missing.
   */
  static calculatePresentValue(cmp: number | null, quantity: number): number | null {
    if (cmp === null || cmp === undefined) return null;
    return this.round2(cmp * quantity);
  }

  /**
   * Computes the absolute gain or loss. Returns null if CMP is missing.
   */
  static calculateGainLoss(investment: number, presentValue: number | null): number | null {
    if (presentValue === null) return null;
    return this.round2(presentValue - investment);
  }

  /**
   * Computes the gain/loss percentage. Returns null if CMP is missing or investment is 0.
   */
  static calculateGainLossPercentage(investment: number, gainLoss: number | null): number | null {
    if (gainLoss === null) return null;
    if (investment === 0) return 0; // safe fallback
    return this.round2((gainLoss / investment) * 100);
  }

  /**
   * Computes the portfolio allocation percentage based on investment.
   */
  static calculatePortfolioPercentage(holdingInvestment: number, totalInvestment: number): number {
    if (totalInvestment === 0) return 0;
    return this.round2((holdingInvestment / totalInvestment) * 100);
  }

  /**
   * Main entry point to process enriched holdings, calculate totals, and group by sector.
   * This is a pure function. It accepts raw (but enriched) holding data and produces the final API structure.
   */
  static processPortfolio(enrichedHoldings: any[]): { summary: PortfolioSummaryResponse; sectors: SectorGroupResponse[] } {
    // Phase 1: Calculate raw metrics for all holdings and determine global investment
    let totalInvestment = 0;
    let totalPresentValue = 0;
    
    let totalHoldingsCount = 0;
    let pricedHoldingsCount = 0;
    
    // We'll store intermediate calculations to avoid recomputing
    const holdingsWithMetrics: HoldingResponse[] = [];

    for (const raw of enrichedHoldings) {
      totalHoldingsCount++;

      // Pure calculations based on exact DB inputs
      const investment = this.calculateInvestment(raw.purchasePrice, raw.quantity);
      totalInvestment += investment;

      const presentValue = this.calculatePresentValue(raw.currentMarketPrice, raw.quantity);
      if (presentValue !== null) {
        pricedHoldingsCount++;
        totalPresentValue += presentValue;
      }

      const gainLoss = this.calculateGainLoss(investment, presentValue);
      const gainLossPercentage = this.calculateGainLossPercentage(investment, gainLoss);

      holdingsWithMetrics.push({
        id: raw.id,
        ticker: raw.ticker,
        companyName: raw.companyName,
        quantity: raw.quantity,
        purchasePrice: raw.purchasePrice,
        sector: raw.sector,
        
        investment,
        portfolioPercentage: 0, // Computed in Phase 2
        
        currentMarketPrice: raw.currentMarketPrice,
        presentValue,
        gainLoss,
        gainLossPercentage,
        marketDataError: raw.marketDataError,
        
        peRatio: raw.peRatio,
        latestEarnings: raw.latestEarnings,
        fundamentalsError: raw.fundamentalsError,
      });
    }

    // Phase 2: Compute portfolio percentages and group by sector
    const sectorGroups = new Map<string, { sector: any; holdings: HoldingResponse[] }>();

    for (const h of holdingsWithMetrics) {
      // Calculate allocation now that we know totalInvestment
      h.portfolioPercentage = this.calculatePortfolioPercentage(h.investment, totalInvestment);

      const sectorId = h.sector.id;
      if (!sectorGroups.has(sectorId)) {
        sectorGroups.set(sectorId, { sector: h.sector, holdings: [] });
      }
      sectorGroups.get(sectorId)!.holdings.push(h);
    }

    // Phase 3: Aggregate Sector Summaries
    const aggregatedSectors: SectorGroupResponse[] = [];

    for (const group of sectorGroups.values()) {
      let secInvestment = 0;
      let secPresentValue = 0;
      let secPricedCount = 0;

      for (const h of group.holdings) {
        secInvestment += h.investment;
        if (h.presentValue !== null) {
          secPresentValue += h.presentValue;
          secPricedCount++;
        }
      }

      const secGainLoss = secPresentValue - (secPricedCount > 0 ? group.holdings.filter(h => h.presentValue !== null).reduce((sum, h) => sum + h.investment, 0) : 0);
      // Wait, the prompt says "Total Present Value - Total Investment". 
      // Should Sector Gain/Loss use all sector investment, or only investment for priced holdings?
      // "If totalPresentValue represents only successfully priced holdings, clearly identify that it is partial. 
      // Do not misrepresent partial data as a complete portfolio valuation."
      // For accurate accounting: gainLoss = totalPresentValue(for priced) - totalInvestment(for priced).
      // Let's compute the investment of ONLY priced holdings for the gain calculation.
      
      let secPricedInvestment = 0;
      for (const h of group.holdings) {
        if (h.presentValue !== null) {
          secPricedInvestment += h.investment;
        }
      }

      const finalSecGainLoss = this.round2(secPresentValue - secPricedInvestment);
      const finalSecGainLossPct = this.calculateGainLossPercentage(secPricedInvestment, finalSecGainLoss) ?? 0;

      aggregatedSectors.push({
        sector: group.sector,
        holdings: group.holdings,
        summary: {
          totalInvestment: this.round2(secInvestment),
          totalPresentValue: this.round2(secPresentValue),
          gainLoss: finalSecGainLoss,
          gainLossPercentage: finalSecGainLossPct,
          marketDataCoverage: {
            totalHoldings: group.holdings.length,
            pricedHoldings: secPricedCount,
            unavailableHoldings: group.holdings.length - secPricedCount,
          }
        }
      });
    }

    // Phase 4: Compute Overall Portfolio Summary
    let totalPricedInvestment = 0;
    for (const h of holdingsWithMetrics) {
      if (h.presentValue !== null) {
        totalPricedInvestment += h.investment;
      }
    }

    const overallGainLoss = this.round2(totalPresentValue - totalPricedInvestment);
    const overallGainLossPct = this.calculateGainLossPercentage(totalPricedInvestment, overallGainLoss) ?? 0;

    return {
      summary: {
        totalInvestment: this.round2(totalInvestment),
        totalPresentValue: this.round2(totalPresentValue),
        totalGainLoss: overallGainLoss,
        totalGainLossPercentage: overallGainLossPct,
        marketDataCoverage: {
          totalHoldings: totalHoldingsCount,
          pricedHoldings: pricedHoldingsCount,
          unavailableHoldings: totalHoldingsCount - pricedHoldingsCount,
        }
      },
      sectors: aggregatedSectors,
    };
  }
}
