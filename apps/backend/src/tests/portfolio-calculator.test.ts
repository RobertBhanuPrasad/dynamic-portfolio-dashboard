import { test, describe } from 'node:test';
import assert from 'node:assert';
import { PortfolioCalculator } from '../core/calculators/portfolio.calculator';

describe('PortfolioCalculator', () => {
  describe('calculateInvestment', () => {
    test('calculates investment correctly', () => {
      assert.strictEqual(PortfolioCalculator.calculateInvestment(1490, 50), 74500); // HDFC
      assert.strictEqual(PortfolioCalculator.calculateInvestment(6466, 15), 96990); // Bajaj
      assert.strictEqual(PortfolioCalculator.calculateInvestment(1151, 50), 57550); // Affle
      assert.strictEqual(PortfolioCalculator.calculateInvestment(3777, 27), 101979); // DMart
      assert.strictEqual(PortfolioCalculator.calculateInvestment(224, 225), 50400); // Tata Power
    });

    test('rounds safely', () => {
      assert.strictEqual(PortfolioCalculator.calculateInvestment(10.123, 2), 20.25);
    });
  });

  describe('calculatePresentValue', () => {
    test('calculates correctly', () => {
      assert.strictEqual(PortfolioCalculator.calculatePresentValue(1600, 50), 80000);
    });

    test('returns null for missing CMP', () => {
      assert.strictEqual(PortfolioCalculator.calculatePresentValue(null, 50), null);
    });
  });

  describe('calculateGainLoss', () => {
    test('calculates correctly for gains', () => {
      assert.strictEqual(PortfolioCalculator.calculateGainLoss(74500, 80000), 5500);
    });

    test('calculates correctly for losses (negative)', () => {
      assert.strictEqual(PortfolioCalculator.calculateGainLoss(1000, 800), -200);
    });

    test('returns null if PV is null', () => {
      assert.strictEqual(PortfolioCalculator.calculateGainLoss(1000, null), null);
    });
  });

  describe('calculateGainLossPercentage', () => {
    test('calculates correctly for gains', () => {
      assert.strictEqual(PortfolioCalculator.calculateGainLossPercentage(74500, 5500), 7.38);
    });

    test('calculates correctly for losses', () => {
      assert.strictEqual(PortfolioCalculator.calculateGainLossPercentage(1000, -200), -20);
    });

    test('returns null if gain/loss is null', () => {
      assert.strictEqual(PortfolioCalculator.calculateGainLossPercentage(1000, null), null);
    });

    test('safely handles zero investment', () => {
      assert.strictEqual(PortfolioCalculator.calculateGainLossPercentage(0, 500), 0);
    });
  });

  describe('calculatePortfolioPercentage', () => {
    test('calculates correctly', () => {
      assert.strictEqual(PortfolioCalculator.calculatePortfolioPercentage(750, 1000), 75);
      assert.strictEqual(PortfolioCalculator.calculatePortfolioPercentage(250, 1000), 25);
    });

    test('safely handles zero total', () => {
      assert.strictEqual(PortfolioCalculator.calculatePortfolioPercentage(750, 0), 0);
    });
  });

  describe('processPortfolio (Integration)', () => {
    const mockHoldings = [
      {
        id: '1',
        ticker: 'HDFC',
        companyName: 'HDFC',
        quantity: 10,
        purchasePrice: 100, // Investment = 1000
        sector: { id: 's1', name: 'Finance' },
        currentMarketPrice: 120, // PV = 1200
      },
      {
        id: '2',
        ticker: 'BAJAJ',
        companyName: 'BAJAJ',
        quantity: 5,
        purchasePrice: 200, // Investment = 1000
        sector: { id: 's1', name: 'Finance' },
        currentMarketPrice: 180, // PV = 900
      },
      {
        id: '3',
        ticker: 'MISSING',
        companyName: 'MISSING CMP',
        quantity: 10,
        purchasePrice: 100, // Investment = 1000
        sector: { id: 's2', name: 'Tech' },
        currentMarketPrice: null, // PV = null
      }
    ];

    test('processes correctly', () => {
      const result = PortfolioCalculator.processPortfolio(mockHoldings);

      // Overall Summary
      // Total investment = 1000 + 1000 + 1000 = 3000
      assert.strictEqual(result.summary.totalInvestment, 3000);
      
      // Total present value = 1200 + 900 = 2100
      assert.strictEqual(result.summary.totalPresentValue, 2100);
      
      // Gain loss uses PRICED holdings only: (1200 + 900) - (1000 + 1000) = 2100 - 2000 = 100
      assert.strictEqual(result.summary.totalGainLoss, 100);
      
      // Gain loss pct = 100 / 2000 * 100 = 5%
      assert.strictEqual(result.summary.totalGainLossPercentage, 5);

      assert.strictEqual(result.summary.marketDataCoverage.totalHoldings, 3);
      assert.strictEqual(result.summary.marketDataCoverage.pricedHoldings, 2);
      assert.strictEqual(result.summary.marketDataCoverage.unavailableHoldings, 1);

      // Sectors
      assert.strictEqual(result.sectors.length, 2);

      // Finance Sector
      const financeSector = result.sectors.find(s => s.sector.name === 'Finance')!;
      assert.strictEqual(financeSector.summary.totalInvestment, 2000);
      assert.strictEqual(financeSector.summary.totalPresentValue, 2100);
      assert.strictEqual(financeSector.summary.gainLoss, 100);
      assert.strictEqual(financeSector.summary.gainLossPercentage, 5);
      
      // Finance Portfolio Percentages
      assert.strictEqual(financeSector.holdings[0].portfolioPercentage, 33.33); // 1000 / 3000

      // Tech Sector (Null CMP)
      const techSector = result.sectors.find(s => s.sector.name === 'Tech')!;
      assert.strictEqual(techSector.summary.totalInvestment, 1000);
      assert.strictEqual(techSector.summary.totalPresentValue, 0);
      assert.strictEqual(techSector.summary.gainLoss, 0);
      assert.strictEqual(techSector.summary.marketDataCoverage.unavailableHoldings, 1);
    });
  });
});
