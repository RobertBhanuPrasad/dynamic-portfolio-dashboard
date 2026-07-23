import https from 'https';
import * as cheerio from 'cheerio';
import { FundamentalsProvider, FundamentalData } from '../market-data.types';
import { GoogleFinanceMapper } from './google-finance.mapper';
import { logger } from '../../../utils/logger';

export class GoogleFinanceProvider implements FundamentalsProvider {
  private fetchHtml(url: string, redirects = 0): Promise<string> {
    return new Promise((resolve, reject) => {
      if (redirects > 5) return reject(new Error('TOO_MANY_REDIRECTS'));
      
      const req = https.get(url, {
        family: 4, // Avoid IPv6 hangs
        headers: {
          'User-Agent': 'curl/7.68.0', // Helps bypass some bot walls
          'Accept-Language': 'en-US,en;q=0.9',
          'Cookie': 'CONSENT=YES+cb.20230101-00-p0.en+FX+0'
        },
        timeout: 10000 // 10s connection timeout
      }, (res) => {
        if (res.statusCode && [301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
          const redirectUrl = new URL(res.headers.location, url).toString();
          req.destroy();
          return resolve(this.fetchHtml(redirectUrl, redirects + 1));
        }

        if (res.statusCode && res.statusCode >= 400) {
          res.destroy();
          return reject(new Error(`HTTP_STATUS_${res.statusCode}`));
        }
        
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('TIMEOUT'));
      });
    });
  }

  async getFundamentals(ticker: string, exchange: string): Promise<FundamentalData> {
    const providerSymbol = GoogleFinanceMapper.toProviderSymbol(ticker, exchange);
    const url = `https://www.google.com/finance/quote/${providerSymbol}?hl=en`;

    try {
      // Race the HTML fetch against an overall timeout
      const html = await Promise.race([
        this.fetchHtml(url),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 12000))
      ]);

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
    // Process sequentially with a small delay to avoid Google rate limiting / blocking
    const result = new Map<string, FundamentalData>();
    
    for (const id of identifiers) {
      const data = await this.getFundamentals(id.ticker, id.exchange);
      result.set(id.ticker, data);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

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
