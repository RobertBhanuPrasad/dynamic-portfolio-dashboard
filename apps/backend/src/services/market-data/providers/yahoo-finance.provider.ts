import YahooFinance from 'yahoo-finance2';
import { MarketDataProvider, MarketQuote } from '../market-data.types';
import { YahooSymbolMapper } from './yahoo-finance.mapper';
import { logger } from '../../../utils/logger';

export class YahooFinanceProvider implements MarketDataProvider {
  private yf: InstanceType<typeof YahooFinance>;

  constructor() {
    this.yf = new YahooFinance({
      suppressNotices: ['yahooSurvey']
    });
  }

  async getQuote(ticker: string, exchange: string): Promise<MarketQuote> {
    const providerSymbol = YahooSymbolMapper.toProviderSymbol(ticker, exchange);
    
    try {
      // Set a timeout for the request
      const quote: any = await Promise.race([
        this.yf.quote(providerSymbol),
        new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 5000))
      ]);
      
      if (!quote || typeof quote.regularMarketPrice !== 'number') {
        return this.createErrorQuote(ticker, providerSymbol, 'INVALID_RESPONSE');
      }

      return {
        requestedIdentifier: ticker,
        providerSymbol,
        price: quote.regularMarketPrice,
        currency: quote.currency,
        exchange: quote.exchange,
        marketState: quote.marketState,
        fetchedAt: new Date(),
      };
    } catch (error: any) {
      return this.handleError(error, ticker, providerSymbol);
    }
  }

  async getQuotes(identifiers: { ticker: string; exchange: string }[]): Promise<Map<string, MarketQuote>> {
    const result = new Map<string, MarketQuote>();
    if (identifiers.length === 0) return result;

    const mapping = new Map<string, { ticker: string, exchange: string }>();
    const providerSymbols = identifiers.map(id => {
      const sym = YahooSymbolMapper.toProviderSymbol(id.ticker, id.exchange);
      mapping.set(sym, id);
      return sym;
    });

    try {
      const quotes: any = await Promise.race([
        this.yf.quote(providerSymbols),
        new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 10000))
      ]);

      // yahooFinance.quote(array) returns an array
      const quotesArray = Array.isArray(quotes) ? quotes : [quotes];

      for (const quote of quotesArray) {
        if (!quote.symbol) continue;
        
        const originalId = mapping.get(quote.symbol);
        if (!originalId) continue;

        if (typeof quote.regularMarketPrice === 'number') {
          result.set(originalId.ticker, {
            requestedIdentifier: originalId.ticker,
            providerSymbol: quote.symbol,
            price: quote.regularMarketPrice,
            currency: quote.currency,
            exchange: quote.exchange,
            marketState: quote.marketState,
            fetchedAt: new Date(),
          });
        } else {
          result.set(originalId.ticker, this.createErrorQuote(originalId.ticker, quote.symbol, 'INVALID_RESPONSE'));
        }
      }

      // Fill in those that were not found
      for (const id of identifiers) {
        if (!result.has(id.ticker)) {
          const providerSymbol = YahooSymbolMapper.toProviderSymbol(id.ticker, id.exchange);
          result.set(id.ticker, this.createErrorQuote(id.ticker, providerSymbol, 'SYMBOL_NOT_FOUND'));
        }
      }
    } catch (error: any) {
      logger.error({ err: error }, 'Yahoo Finance batch fetch failed, falling back to individual failures');
      
      // If batch fails, we mark all as failed. Or we could fallback to individual, but marking as failed is safer and respects rate limits.
      for (const id of identifiers) {
        const providerSymbol = YahooSymbolMapper.toProviderSymbol(id.ticker, id.exchange);
        result.set(id.ticker, this.handleError(error, id.ticker, providerSymbol));
      }
    }

    return result;
  }

  private handleError(error: any, ticker: string, providerSymbol: string): MarketQuote {
    let category = 'PROVIDER_UNAVAILABLE';
    if (error?.message === 'TIMEOUT') {
      category = 'TIMEOUT';
    } else if (error?.name === 'FailedYahooValidationError' || error?.message?.includes('Not Found')) {
      category = 'SYMBOL_NOT_FOUND';
    } else if (error?.message?.includes('rate limit')) {
      category = 'RATE_LIMITED';
    }

    logger.warn({ ticker, providerSymbol, category, err: error.message }, 'Failed to fetch Yahoo quote');

    return this.createErrorQuote(ticker, providerSymbol, category);
  }

  private createErrorQuote(ticker: string, providerSymbol: string, category: string): MarketQuote {
    return {
      requestedIdentifier: ticker,
      providerSymbol,
      price: null,
      fetchedAt: new Date(),
      errorCategory: category,
    };
  }
}
