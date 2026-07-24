import test from 'node:test';
import assert from 'node:assert';
import { YahooSymbolMapper } from '../services/market-data/providers/yahoo-finance.mapper';
import { PortfolioCalculator } from '../core/calculators/portfolio.calculator';
import { YahooFinanceProvider } from '../services/market-data/providers/yahoo-finance.provider';

test('Market Data Accuracy & Financial Validation', async (t) => {
  await t.test('1. Yahoo Symbol Mapper', async () => {
    assert.strictEqual(YahooSymbolMapper.toProviderSymbol('HDFCBANK', 'NSE'), 'HDFCBANK.NS');
    assert.strictEqual(YahooSymbolMapper.toProviderSymbol('541557', 'BSE'), '541557.BO');
    assert.strictEqual(YahooSymbolMapper.toProviderSymbol('RELIANCE', 'NSE'), 'RELIANCE.NS');
  });

  await t.test('2. Portfolio Calculator - HDFC Control Case', async () => {
    const rawEnrichedHoldings = [{
      id: 'hdfc-1',
      ticker: 'HDFCBANK',
      companyName: 'HDFC Bank',
      quantity: 50,
      purchasePrice: 1490,
      sector: { id: 'fin', name: 'Financial' },
      currentMarketPrice: 1550, // mock CMP
      marketDataError: null,
      peRatio: 15,
      latestEarnings: 100,
      fundamentalsError: null
    }];

    const { summary, sectors } = PortfolioCalculator.processPortfolio(rawEnrichedHoldings);
    const holding = sectors[0].holdings[0];
    
    // Historical
    assert.strictEqual(holding.investment, 74500); // 1490 * 50
    // Present
    assert.strictEqual(holding.presentValue, 77500); // 1550 * 50
    // Gain/Loss
    assert.strictEqual(holding.gainLoss, 3000);
    assert.strictEqual(holding.gainLossPercentage, 4.03); // (3000/74500) * 100
  });

  await t.test('3. Portfolio Calculator - Partial Market Data Aggregation', async () => {
    const rawEnrichedHoldings = [
      {
        id: 'h1',
        ticker: 'HDFCBANK',
        companyName: 'HDFC Bank',
        quantity: 50,
        purchasePrice: 1490,
        sector: { id: 'fin', name: 'Financial' },
        currentMarketPrice: 1550, // success
      },
      {
        id: 'h2',
        ticker: '541557',
        companyName: 'Fine Organic',
        quantity: 16,
        purchasePrice: 4284,
        sector: { id: 'chem', name: 'Chemicals' },
        currentMarketPrice: null, // failed validation
        marketDataError: 'CURRENCY_MISMATCH'
      }
    ];

    const { summary, sectors } = PortfolioCalculator.processPortfolio(rawEnrichedHoldings);
    
    assert.strictEqual(summary.totalInvestment, 143044); // (50*1490) + (16*4284)
    assert.strictEqual(summary.totalPresentValue, 77500); // Only HDFC contributes
    assert.strictEqual(summary.totalGainLoss, 3000); // Only HDFC's priced investment is subtracted
    assert.strictEqual(summary.totalGainLossPercentage, 4.03); // Based only on priced holdings
    assert.strictEqual(summary.marketDataCoverage.pricedHoldings, 1);
    assert.strictEqual(summary.marketDataCoverage.unavailableHoldings, 1);
  });
});
