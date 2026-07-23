import { MarketDataProvider, MarketQuote, FundamentalsProvider, FundamentalData } from './market-data.types';
import { YahooFinanceProvider } from './providers/yahoo-finance.provider';
import { GoogleFinanceProvider } from './providers/google-finance.provider';
import { logger } from '../../utils/logger';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class MarketDataService {
  private quoteProvider: MarketDataProvider;
  private fundamentalsProvider: FundamentalsProvider;
  
  private quoteCache: Map<string, CacheEntry<MarketQuote>>;
  private quoteCacheTTLMs: number = 10 * 1000; // 10 seconds TTL
  
  private fundamentalsCache: Map<string, CacheEntry<FundamentalData>>;
  // Fundamentals change daily/quarterly, so a 1-hour TTL is sufficient to reduce Google requests substantially
  private fundamentalsCacheTTLMs: number = 60 * 60 * 1000; 
  
  // Pending promises to handle request deduplication
  private pendingQuoteRequests: Map<string, Promise<MarketQuote>>;
  private pendingFundamentalsRequests: Map<string, Promise<FundamentalData>>;

  constructor(quoteProvider?: MarketDataProvider, fundamentalsProvider?: FundamentalsProvider) {
    this.quoteProvider = quoteProvider || new YahooFinanceProvider();
    this.fundamentalsProvider = fundamentalsProvider || new GoogleFinanceProvider();
    
    this.quoteCache = new Map();
    this.fundamentalsCache = new Map();
    
    this.pendingQuoteRequests = new Map();
    this.pendingFundamentalsRequests = new Map();
  }

  async getQuote(ticker: string, exchange: string): Promise<MarketQuote> {
    const cacheKey = `${exchange}:${ticker}`;
    
    // Check cache
    const cached = this.quoteCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      logger.debug({ ticker, exchange }, 'Cache HIT for market quote');
      return cached.data;
    }

    // Check if there is a pending request for this symbol
    if (this.pendingQuoteRequests.has(cacheKey)) {
      logger.debug({ ticker, exchange }, 'Deduplicating market quote request');
      return this.pendingQuoteRequests.get(cacheKey)!;
    }

    // Make new request
    logger.debug({ ticker, exchange }, 'Cache MISS for market quote, fetching from provider');
    
    const requestPromise = this.quoteProvider.getQuote(ticker, exchange).then(quote => {
      // Cache the result
      this.quoteCache.set(cacheKey, {
        data: quote,
        expiresAt: Date.now() + this.quoteCacheTTLMs
      });
      this.pendingQuoteRequests.delete(cacheKey);
      return quote;
    }).catch(error => {
      this.pendingQuoteRequests.delete(cacheKey);
      throw error; // Let the provider handle known errors, this is for unexpected throws
    });

    this.pendingQuoteRequests.set(cacheKey, requestPromise);
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
      
      const cached = this.quoteCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        result.set(id.ticker, cached.data);
        continue;
      }

      if (this.pendingQuoteRequests.has(cacheKey)) {
        promises.push(this.pendingQuoteRequests.get(cacheKey)!.then(quote => {
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
      
      const batchPromise = this.quoteProvider.getQuotes(toFetch).then(quotesMap => {
        for (const id of toFetch) {
          const cacheKey = `${id.exchange}:${id.ticker}`;
          const quote = quotesMap.get(id.ticker);
          if (quote) {
            this.quoteCache.set(cacheKey, {
              data: quote,
              expiresAt: Date.now() + this.quoteCacheTTLMs
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

  // Fundamentals
  async getFundamentalsBatch(identifiers: { ticker: string; exchange: string }[]): Promise<Map<string, FundamentalData>> {
    const result = new Map<string, FundamentalData>();
    const toFetch: { ticker: string; exchange: string }[] = [];

    const uniqueIdentifiers = Array.from(
      new Map(identifiers.map(id => [`${id.exchange}:${id.ticker}`, id])).values()
    );

    const promises: Promise<void>[] = [];

    for (const id of uniqueIdentifiers) {
      const cacheKey = `${id.exchange}:${id.ticker}`;
      
      const cached = this.fundamentalsCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        result.set(id.ticker, cached.data);
        continue;
      }

      if (this.pendingFundamentalsRequests.has(cacheKey)) {
        promises.push(this.pendingFundamentalsRequests.get(cacheKey)!.then(data => {
          result.set(id.ticker, data);
        }));
        continue;
      }

      toFetch.push(id);
    }

    if (toFetch.length > 0) {
      // Create pending requests before batching to handle immediate duplicates
      const batchResolveMap = new Map<string, (val: FundamentalData) => void>();
      const batchRejectMap = new Map<string, (err: any) => void>();
      
      for (const id of toFetch) {
        const cacheKey = `${id.exchange}:${id.ticker}`;
        const p = new Promise<FundamentalData>((resolve, reject) => {
          batchResolveMap.set(id.ticker, resolve);
          batchRejectMap.set(id.ticker, reject);
        });
        this.pendingFundamentalsRequests.set(cacheKey, p);
      }

      const batchPromise = this.fundamentalsProvider.getFundamentalsBatch(toFetch).then(dataMap => {
        for (const id of toFetch) {
          const cacheKey = `${id.exchange}:${id.ticker}`;
          const data = dataMap.get(id.ticker);
          if (data) {
            this.fundamentalsCache.set(cacheKey, {
              data: data,
              expiresAt: Date.now() + this.fundamentalsCacheTTLMs
            });
            result.set(id.ticker, data);
            batchResolveMap.get(id.ticker)?.(data);
          }
          this.pendingFundamentalsRequests.delete(cacheKey);
        }
      }).catch(err => {
        for (const id of toFetch) {
          const cacheKey = `${id.exchange}:${id.ticker}`;
          this.pendingFundamentalsRequests.delete(cacheKey);
          batchRejectMap.get(id.ticker)?.(err);
        }
      });

      promises.push(batchPromise);
    }

    await Promise.all(promises);

    return result;
  }

  // Exposed for testing
  clearCache() {
    this.quoteCache.clear();
    this.fundamentalsCache.clear();
  }
}

export const marketDataService = new MarketDataService();
