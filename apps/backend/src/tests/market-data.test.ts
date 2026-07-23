import { test, describe, mock, beforeEach } from 'node:test';
import assert from 'node:assert';
import { MarketDataService } from '../services/market-data/market-data.service';
import { MarketDataProvider, MarketQuote } from '../services/market-data/market-data.types';
import { YahooSymbolMapper } from '../services/market-data/providers/yahoo-finance.mapper';

class MockProvider implements MarketDataProvider {
  getQuote = mock.fn<MarketDataProvider['getQuote']>();
  getQuotes = mock.fn<MarketDataProvider['getQuotes']>();
}

describe('Yahoo Symbol Mapper', () => {
  test('maps text symbol to NSE', () => {
    assert.strictEqual(YahooSymbolMapper.toProviderSymbol('HDFCBANK', 'NSE'), 'HDFCBANK.NS');
  });

  test('maps numeric symbol to BSE', () => {
    assert.strictEqual(YahooSymbolMapper.toProviderSymbol('532174', 'BSE'), '532174.BO');
    assert.strictEqual(YahooSymbolMapper.toProviderSymbol('532174', 'NSE'), '532174.BO'); // Should still map to BSE because it's numeric
  });
});

describe('Market Data Service', () => {
  let mockProvider: MockProvider;
  let service: MarketDataService;

  beforeEach(() => {
    mockProvider = new MockProvider();
    service = new MarketDataService(mockProvider);
  });

  test('successfully fetches and caches quote', async () => {
    const mockQuote: MarketQuote = {
      requestedIdentifier: 'HDFCBANK',
      providerSymbol: 'HDFCBANK.NS',
      price: 1500,
      fetchedAt: new Date(),
    };
    
    mockProvider.getQuote.mock.mockImplementation(async () => mockQuote);

    const result1 = await service.getQuote('HDFCBANK', 'NSE');
    assert.strictEqual(result1.price, 1500);
    assert.strictEqual(mockProvider.getQuote.mock.callCount(), 1);

    // Cache hit
    const result2 = await service.getQuote('HDFCBANK', 'NSE');
    assert.strictEqual(result2.price, 1500);
    assert.strictEqual(mockProvider.getQuote.mock.callCount(), 1);
  });

  test('handles batch fetch and deduplication', async () => {
    const mockQuotes = new Map<string, MarketQuote>([
      ['HDFCBANK', { requestedIdentifier: 'HDFCBANK', providerSymbol: 'HDFCBANK.NS', price: 1500, fetchedAt: new Date() }],
      ['532174', { requestedIdentifier: '532174', providerSymbol: '532174.BO', price: 200, fetchedAt: new Date() }]
    ]);

    mockProvider.getQuotes.mock.mockImplementation(async () => mockQuotes);

    const result = await service.getQuotes([
      { ticker: 'HDFCBANK', exchange: 'NSE' },
      { ticker: '532174', exchange: 'BSE' }
    ]);

    assert.strictEqual(result.get('HDFCBANK')?.price, 1500);
    assert.strictEqual(result.get('532174')?.price, 200);
    assert.strictEqual(mockProvider.getQuotes.mock.callCount(), 1);
  });

  test('returns error quote if provider fails', async () => {
    mockProvider.getQuote.mock.mockImplementation(async () => {
      return {
        requestedIdentifier: 'INVALID',
        providerSymbol: 'INVALID.NS',
        price: null,
        errorCategory: 'SYMBOL_NOT_FOUND',
        fetchedAt: new Date()
      };
    });

    const result = await service.getQuote('INVALID', 'NSE');
    assert.strictEqual(result.price, null);
    assert.strictEqual(result.errorCategory, 'SYMBOL_NOT_FOUND');
  });
});
