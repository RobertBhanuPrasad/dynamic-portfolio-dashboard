import YahooFinance from 'yahoo-finance2';
import { MarketDataProvider, MarketQuote } from '../market-data.types';
import { YahooSymbolMapper } from './yahoo-finance.mapper';
import { logger } from '../../../utils/logger';
import { runWithConcurrency, withTimeout } from '../../../utils/concurrency';

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
      const timeoutMs = parseInt(process.env.YAHOO_TIMEOUT_MS || '5000', 10);
      const quote: any = await withTimeout(this.yf.quote(providerSymbol), timeoutMs);
      
      if (!quote || typeof quote.regularMarketPrice !== 'number') {
        return this.createErrorQuote(ticker, providerSymbol, 'INVALID_RESPONSE');
      }

      if (quote.currency && quote.currency !== 'INR') {
        logger.warn({ ticker, providerSymbol, expected: 'INR', actual: quote.currency }, 'CURRENCY_MISMATCH');
        return this.createErrorQuote(ticker, providerSymbol, 'CURRENCY_MISMATCH');
      }

      if (quote.quoteType && quote.quoteType !== 'EQUITY') {
        logger.warn({ ticker, providerSymbol, expected: 'EQUITY', actual: quote.quoteType }, 'INVALID_QUOTE_TYPE');
        return this.createErrorQuote(ticker, providerSymbol, 'INVALID_QUOTE_TYPE');
      }

      if (quote.regularMarketPrice <= 0 || !Number.isFinite(quote.regularMarketPrice)) {
        logger.warn({ ticker, providerSymbol, price: quote.regularMarketPrice }, 'INVALID_PRICE');
        return this.createErrorQuote(ticker, providerSymbol, 'INVALID_PRICE');
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

    const concurrencyLimit = parseInt(process.env.YAHOO_CONCURRENCY || '5', 10);
    const timeoutMs = parseInt(process.env.YAHOO_TIMEOUT_MS || '5000', 10);

    const start = Date.now();
    let successes = 0;
    let failures = 0;

    await runWithConcurrency(identifiers, concurrencyLimit, async (id) => {
      const providerSymbol = YahooSymbolMapper.toProviderSymbol(id.ticker, id.exchange);
      try {
        const quote: any = await withTimeout(this.yf.quote(providerSymbol), timeoutMs);
        
        if (!quote || typeof quote.regularMarketPrice !== 'number') {
          result.set(id.ticker, this.createErrorQuote(id.ticker, providerSymbol, 'INVALID_RESPONSE'));
          failures++;
          return;
        }

        // Defensive Sanity Validation
        if (quote.currency && quote.currency !== 'INR') {
          logger.warn({ ticker: id.ticker, providerSymbol, expected: 'INR', actual: quote.currency }, 'CURRENCY_MISMATCH');
          result.set(id.ticker, this.createErrorQuote(id.ticker, providerSymbol, 'CURRENCY_MISMATCH'));
          failures++;
          return;
        }

        if (quote.quoteType && quote.quoteType !== 'EQUITY') {
          logger.warn({ ticker: id.ticker, providerSymbol, expected: 'EQUITY', actual: quote.quoteType }, 'INVALID_QUOTE_TYPE');
          result.set(id.ticker, this.createErrorQuote(id.ticker, providerSymbol, 'INVALID_QUOTE_TYPE'));
          failures++;
          return;
        }

        if (quote.regularMarketPrice <= 0 || !Number.isFinite(quote.regularMarketPrice)) {
          logger.warn({ ticker: id.ticker, providerSymbol, price: quote.regularMarketPrice }, 'INVALID_PRICE');
          result.set(id.ticker, this.createErrorQuote(id.ticker, providerSymbol, 'INVALID_PRICE'));
          failures++;
          return;
        }

        result.set(id.ticker, {
          requestedIdentifier: id.ticker,
          providerSymbol: quote.symbol || providerSymbol,
          price: quote.regularMarketPrice,
          currency: quote.currency,
          exchange: quote.exchange,
          marketState: quote.marketState,
          fetchedAt: new Date(),
        });
        successes++;
      } catch (error: any) {
        result.set(id.ticker, this.handleError(error, id.ticker, providerSymbol));
        failures++;
      }
    });

    const durationMs = Date.now() - start;
    logger.info({
      provider: 'Yahoo',
      requested: identifiers.length,
      successes,
      failures,
      durationMs,
      concurrencyLimit
    }, 'Yahoo Finance enrichment batch completed');

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
