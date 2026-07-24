const http = require('http');
const https = require('https');
https.globalAgent.options.timeout = 30000;
process.env.YAHOO_TIMEOUT_MS = 30000;
const YahooFinance = require('yahoo-finance2').default;

async function main() {
  const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
  try {
    const res = await yf.quote('541557.BO');
    console.log("Currency:", res.currency);
    console.log("QuoteType:", res.quoteType);
    console.log("Exchange:", res.exchange);
    console.log("Price:", res.regularMarketPrice);
    console.log("Name:", res.shortName);
  } catch (err) {
    console.error("Failed:", err.message);
  }
}
main();
