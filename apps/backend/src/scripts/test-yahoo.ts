import { marketDataService } from '../services/market-data/market-data.service';
import { logger } from '../utils/logger';

async function run() {
  logger.info('Starting manual Yahoo Finance integration test');

  const symbols = [
    { ticker: 'HDFCBANK', exchange: 'NSE' },
    { ticker: 'BAJFINANCE', exchange: 'NSE' },
    { ticker: '532174', exchange: 'BSE' }, // ICICI on BSE
    { ticker: 'AFFLE', exchange: 'NSE' },
    { ticker: 'DMART', exchange: 'NSE' },
    { ticker: 'ASTRAL', exchange: 'NSE' },
    { ticker: 'INVALIDXYZ123', exchange: 'NSE' }, // Should fail
  ];

  logger.info('Fetching batch quotes...');
  const start = Date.now();
  const quotes = await marketDataService.getQuotes(symbols);
  const duration = Date.now() - start;

  logger.info(`Batch fetch complete in ${duration}ms`);

  for (const sym of symbols) {
    const q = quotes.get(sym.ticker);
    if (q?.price) {
      logger.info(`✅ ${sym.ticker} -> CMP: ${q.price} ${q.currency} (Mapped: ${q.providerSymbol})`);
    } else {
      logger.warn(`❌ ${sym.ticker} -> Error: ${q?.errorCategory} (Mapped: ${q?.providerSymbol})`);
    }
  }

  logger.info('Testing cache hit (should be immediate)...');
  const cacheStart = Date.now();
  await marketDataService.getQuotes([symbols[0], symbols[1]]);
  const cacheDuration = Date.now() - cacheStart;
  logger.info(`Cache fetch complete in ${cacheDuration}ms`);
}

run().catch(console.error);
