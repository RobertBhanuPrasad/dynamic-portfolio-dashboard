import https from 'https';
import * as cheerio from 'cheerio';
import { FundamentalsProvider, FundamentalData } from '../market-data.types';
import { GoogleFinanceMapper } from './google-finance.mapper';
import { logger } from '../../../utils/logger';
import { runWithConcurrency } from '../../../utils/concurrency';

export class GoogleFinanceProvider implements FundamentalsProvider {
  private fetchHtml(url: string, timeoutMs: number, redirects = 0): Promise<string> {
    return new Promise((resolve, reject) => {
      if (redirects > 5) return reject(new Error('TOO_MANY_REDIRECTS'));
      
      let timer: NodeJS.Timeout;
      
      const req = https.get(url, {
        family: 4, // Avoid IPv6 hangs
        headers: {
          'User-Agent': 'curl/7.68.0', // Helps bypass some bot walls
          'Accept-Language': 'en-US,en;q=0.9',
          'Cookie': 'CONSENT=YES+cb.20230101-00-p0.en+FX+0'
        }
      }, (res) => {
        if (res.statusCode && [301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
          const redirectUrl = new URL(res.headers.location, url).toString();
          req.destroy();
          clearTimeout(timer);
          return resolve(this.fetchHtml(redirectUrl, timeoutMs, redirects + 1));
        }

        if (res.statusCode && res.statusCode >= 400) {
          res.destroy();
          clearTimeout(timer);
          return reject(new Error(`HTTP_STATUS_${res.statusCode}`));
        }
        
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          clearTimeout(timer);
          resolve(data);
        });
      });
      
      timer = setTimeout(() => {
        if (!req.destroyed) {
          req.destroy();
        }
        reject(new Error('TIMEOUT'));
      }, timeoutMs);

      req.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  async getFundamentals(ticker: string, exchange: string): Promise<FundamentalData> {
    const providerSymbol = GoogleFinanceMapper.toProviderSymbol(ticker, exchange);
    const url = `https://www.google.com/finance/quote/${providerSymbol}?hl=en`;
    const timeoutMs = parseInt(process.env.GOOGLE_TIMEOUT_MS || '10000', 10);

    try {
      const html = await this.fetchHtml(url, timeoutMs);

      if (!html || html.length < 1000) {
        return this.createErrorData(ticker, providerSymbol, 'INVALID_RESPONSE');
      }

      const $ = cheerio.load(html);
      
      let peRatio: number | null = null;
      let latestEarnings: string | null = null;

      // Extract P/E Ratio
      $('div').each((i, el) => {
        if ($(el).text() === 'P/E ratio') {
          // The P/E value is typically a sibling of the tooltip wrapper span
          const valText = $(el).parent().next('.P6K39c').text().trim() || $(el).closest('span').next('.P6K39c').text().trim() || $(el).parent().parent().find('.P6K39c').text().trim();
          
          if (valText && valText !== '-') {
            const parsed = parseFloat(valText.replace(/,/g, ''));
            if (!isNaN(parsed) && isFinite(parsed)) {
              peRatio = parsed;
            }
          }
        }
      });

      // Extract Latest Earnings (mapped to "Net income" in the financials table)
      $('*').each((i, el) => {
        if ($(el).children().length === 0 && $(el).text() === 'Net income') {
          // The table row structure is usually: tr > td > span > div(Net income) ... sibling td contains the value
          const tr = $(el).closest('tr');
          if (tr.length > 0) {
            const tds = tr.find('td');
            if (tds.length >= 2) {
              const valText = $(tds[1]).text().trim();
              if (valText && valText !== '—' && valText !== '-') {
                latestEarnings = valText;
              }
            }
          }
        }
      });

      return {
        requestedIdentifier: ticker,
        providerSymbol,
        peRatio,
        latestEarnings,
        fetchedAt: new Date(),
        source: 'Google Finance'
      };

    } catch (error: any) {
      return this.handleError(error, ticker, providerSymbol);
    }
  }

  async getFundamentalsBatch(identifiers: { ticker: string; exchange: string }[]): Promise<Map<string, FundamentalData>> {
    const result = new Map<string, FundamentalData>();
    const concurrencyLimit = parseInt(process.env.GOOGLE_CONCURRENCY || '5', 10);
    
    const start = Date.now();
    let successes = 0;
    let failures = 0;

    await runWithConcurrency(identifiers, concurrencyLimit, async (id) => {
      const data = await this.getFundamentals(id.ticker, id.exchange);
      result.set(id.ticker, data);
      
      if (data.errorCategory) {
        failures++;
      } else {
        successes++;
      }

      // Small delay between requests per worker to pace Google scraping
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    const durationMs = Date.now() - start;
    logger.info({
      provider: 'Google',
      requested: identifiers.length,
      successes,
      failures,
      durationMs,
      concurrencyLimit
    }, 'Google Finance fundamentals batch completed');

    return result;
  }

  private handleError(error: any, ticker: string, providerSymbol: string): FundamentalData {
    let category = 'PROVIDER_UNAVAILABLE';
    const msg = error?.message || '';

    if (msg.includes('TIMEOUT')) {
      category = 'TIMEOUT';
    } else if (msg.includes('HTTP_STATUS_404')) {
      category = 'SYMBOL_NOT_FOUND';
    } else if (msg.includes('HTTP_STATUS_429')) {
      category = 'RATE_LIMITED';
    } else {
      category = 'PARSE_FAILED';
    }

    logger.warn({ ticker, providerSymbol, category, err: msg }, 'Failed to fetch Google Finance fundamentals');

    return this.createErrorData(ticker, providerSymbol, category);
  }

  private createErrorData(ticker: string, providerSymbol: string, category: string): FundamentalData {
    return {
      requestedIdentifier: ticker,
      providerSymbol,
      peRatio: null,
      latestEarnings: null,
      fetchedAt: new Date(),
      source: 'Google Finance',
      errorCategory: category,
    };
  }
}
