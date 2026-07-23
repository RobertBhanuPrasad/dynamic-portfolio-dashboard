import { MarketDataService } from '../services/market-data/market-data.service';
import { YahooFinanceProvider } from '../services/market-data/providers/yahoo-finance.provider';
import { GoogleFinanceProvider } from '../services/market-data/providers/google-finance.provider';

async function testGoogle() {
  console.log('Testing Google Finance Provider...\n');
  
  const service = new MarketDataService(new YahooFinanceProvider(), new GoogleFinanceProvider());
  
  const testHoldings = [
    { ticker: 'HDFCBANK', exchange: 'NSE' },
    { ticker: 'BAJFINANCE', exchange: 'NSE' },
    { ticker: '532174', exchange: 'BSE' }, // ICICI on BSE
    { ticker: 'AFFLE', exchange: 'NSE' },
    { ticker: 'DMART', exchange: 'NSE' },
    { ticker: 'ASTRAL', exchange: 'NSE' },
    { ticker: 'INVALIDXYZ123', exchange: 'NSE' }
  ];

  const startTime = Date.now();
  
  console.log(`Fetching fundamentals for ${testHoldings.length} holdings in batch...`);
  const results = await service.getFundamentalsBatch(testHoldings);
  
  console.log(`\nBatch fetch complete in ${Date.now() - startTime}ms\n`);
  
  for (const h of testHoldings) {
    const data = results.get(h.ticker);
    if (!data) {
      console.log(`❌ ${h.ticker} -> No data returned at all`);
      continue;
    }
    
    if (data.errorCategory) {
      console.log(`❌ ${h.ticker} -> Error: ${data.errorCategory} (Mapped: ${data.providerSymbol})`);
    } else {
      console.log(`✅ ${h.ticker} -> P/E: ${data.peRatio}, Earnings: ${data.latestEarnings} (Mapped: ${data.providerSymbol})`);
    }
  }

  // Test caching
  console.log(`\nTesting cache hit (should be immediate)...`);
  const cacheStart = Date.now();
  await service.getFundamentalsBatch(testHoldings);
  console.log(`Cache fetch complete in ${Date.now() - cacheStart}ms\n`);
}

testGoogle().catch(console.error);
