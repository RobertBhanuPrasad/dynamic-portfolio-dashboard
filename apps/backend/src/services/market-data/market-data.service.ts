import { MarketDataProvider, MarketQuote } from './market-data.types';
import { YahooFinanceProvider } from './providers/yahoo-finance.provider';
import { logger } from '../../utils/logger';

interface CacheEntry {
  quote: MarketQuote;
  expiresAt: number;
}

export class MarketDataService {
  private provider: MarketDataProvider;
  private cache: Map<string, CacheEntry>;
  private cacheTTLMs: number = 10 * 1000; // 10 seconds TTL
  
  // Pending promises to handle request deduplication
  private pendingRequests: Map<string, Promise<MarketQuote>>;

  constructor(provider?: MarketDataProvider) {
    this.provider = provider || new YahooFinanceProvider();
    this.cache = new Map();
    this.pendingRequests = new Map();
  }

  async getQuote(ticker: string, exchange: string): Promise<MarketQuote> {
    const cacheKey = `${exchange}:${ticker}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      logger.debug({ ticker, exchange }, 'Cache HIT for market quote');
      return cached.quote;
    }

    // Check if there is a pending request for this symbol
    if (this.pendingRequests.has(cacheKey)) {
      logger.debug({ ticker, exchange }, 'Deduplicating market quote request');
      return this.pendingRequests.get(cacheKey)!;
    }

    // Make new request
    logger.debug({ ticker, exchange }, 'Cache MISS for market quote, fetching from provider');
    
    const requestPromise = this.provider.getQuote(ticker, exchange).then(quote => {
      // Cache the result
      this.cache.set(cacheKey, {
        quote,
        expiresAt: Date.now() + this.cacheTTLMs
      });
      this.pendingRequests.delete(cacheKey);
      return quote;
    }).catch(error => {
      this.pendingRequests.delete(cacheKey);
      throw error; // Let the provider handle known errors, this is for unexpected throws
    });

    this.pendingRequests.set(cacheKey, requestPromise);
    return requestPromise;
  }

  async getQuotes(identifiers: { ticker: string; exchange: string }[]): Promise<Map<string, MarketQuote>> {
    const result = new Map<string, MarketQuote>();
    const toFetch: { ticker: string; exchange: string }[] = [];

    // Deduplicate incoming identifiers
    const uniqueIdentifiers = Array.from(
      new Map(identifiers.map(id => [`${id.exchange}:${id.ticker}`, id])).values()
    );

    // Check cache and pending requests
    const promises: Promise<void>[] = [];

    for (const id of uniqueIdentifiers) {
      const cacheKey = `${id.exchange}:${id.ticker}`;
      
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        result.set(id.ticker, cached.quote);
        continue;
      }

      if (this.pendingRequests.has(cacheKey)) {
        promises.push(this.pendingRequests.get(cacheKey)!.then(quote => {
          result.set(id.ticker, quote);
        }));
        continue;
      }

      toFetch.push(id);
    }

    if (toFetch.length > 0) {
      // Batch fetch the remaining symbols
      // Note: In a highly concurrent system we might want to register these batch requests as pending,
      // but for simplicity, we'll just await the batch and then populate the results.
      
      const batchPromise = this.provider.getQuotes(toFetch).then(quotesMap => {
        for (const id of toFetch) {
          const cacheKey = `${id.exchange}:${id.ticker}`;
          const quote = quotesMap.get(id.ticker);
          if (quote) {
            this.cache.set(cacheKey, {
              quote,
              expiresAt: Date.now() + this.cacheTTLMs
            });
            result.set(id.ticker, quote);
          }
        }
      });

      promises.push(batchPromise);
    }

    await Promise.all(promises);

    return result;
  }

  // Exposed for testing
  clearCache() {
    this.cache.clear();
  }
}

export const marketDataService = new MarketDataService();
