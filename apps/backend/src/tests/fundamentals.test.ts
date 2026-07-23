import { test, describe, mock, beforeEach } from 'node:test';
import assert from 'node:assert';
import { MarketDataService } from '../services/market-data/market-data.service';
import { MarketDataProvider, FundamentalsProvider, FundamentalData, MarketQuote } from '../services/market-data/market-data.types';
import { GoogleFinanceMapper } from '../services/market-data/providers/google-finance.mapper';

class MockQuoteProvider implements MarketDataProvider {
  getQuote = mock.fn<MarketDataProvider['getQuote']>();
  getQuotes = mock.fn<MarketDataProvider['getQuotes']>();
}

class MockFundamentalsProvider implements FundamentalsProvider {
  getFundamentals = mock.fn<FundamentalsProvider['getFundamentals']>();
  getFundamentalsBatch = mock.fn<FundamentalsProvider['getFundamentalsBatch']>();
}

describe('Google Symbol Mapper', () => {
  test('maps text symbol to NSE', () => {
    assert.strictEqual(GoogleFinanceMapper.toProviderSymbol('HDFCBANK', 'NSE'), 'HDFCBANK:NSE');
  });

  test('maps numeric symbol to BOM (BSE)', () => {
    assert.strictEqual(GoogleFinanceMapper.toProviderSymbol('532174', 'BSE'), '532174:BOM');
    assert.strictEqual(GoogleFinanceMapper.toProviderSymbol('532174', 'NSE'), '532174:BOM'); // Numeric defaults to BOM
  });
});

describe('Fundamentals Data Service (Google Finance)', () => {
  let mockQuoteProvider: MockQuoteProvider;
  let mockFundamentalsProvider: MockFundamentalsProvider;
  let service: MarketDataService;

  beforeEach(() => {
    mockQuoteProvider = new MockQuoteProvider();
    mockFundamentalsProvider = new MockFundamentalsProvider();
    service = new MarketDataService(mockQuoteProvider, mockFundamentalsProvider);
  });

  test('successfully fetches and caches fundamentals batch', async () => {
    const mockData = new Map<string, FundamentalData>([
      ['HDFCBANK', { requestedIdentifier: 'HDFCBANK', providerSymbol: 'HDFCBANK:NSE', peRatio: 15.5, latestEarnings: '192.45B', fetchedAt: new Date(), source: 'Google Finance' }],
      ['532174', { requestedIdentifier: '532174', providerSymbol: '532174:BOM', peRatio: 12.1, latestEarnings: null, fetchedAt: new Date(), source: 'Google Finance' }]
    ]);

    mockFundamentalsProvider.getFundamentalsBatch.mock.mockImplementation(async () => mockData);

    const result1 = await service.getFundamentalsBatch([
      { ticker: 'HDFCBANK', exchange: 'NSE' },
      { ticker: '532174', exchange: 'BSE' }
    ]);

    assert.strictEqual(result1.get('HDFCBANK')?.peRatio, 15.5);
    assert.strictEqual(result1.get('532174')?.peRatio, 12.1);
    assert.strictEqual(mockFundamentalsProvider.getFundamentalsBatch.mock.callCount(), 1);

    // Cache hit
    const result2 = await service.getFundamentalsBatch([
      { ticker: 'HDFCBANK', exchange: 'NSE' },
      { ticker: '532174', exchange: 'BSE' }
    ]);

    assert.strictEqual(result2.get('HDFCBANK')?.peRatio, 15.5);
    assert.strictEqual(mockFundamentalsProvider.getFundamentalsBatch.mock.callCount(), 1);
  });

  test('handles fundamentals error gracefully', async () => {
    const mockData = new Map<string, FundamentalData>([
      ['INVALID', { requestedIdentifier: 'INVALID', providerSymbol: 'INVALID:NSE', peRatio: null, latestEarnings: null, errorCategory: 'SYMBOL_NOT_FOUND', fetchedAt: new Date(), source: 'Google Finance' }]
    ]);

    mockFundamentalsProvider.getFundamentalsBatch.mock.mockImplementation(async () => mockData);

    const result = await service.getFundamentalsBatch([
      { ticker: 'INVALID', exchange: 'NSE' }
    ]);

    assert.strictEqual(result.get('INVALID')?.peRatio, null);
    assert.strictEqual(result.get('INVALID')?.errorCategory, 'SYMBOL_NOT_FOUND');
  });
});
