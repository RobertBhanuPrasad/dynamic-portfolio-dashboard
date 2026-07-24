const YahooFinance = require('yahoo-finance2').default;

async function main() {
  const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
  try {
    const quote = await yf.quote('541557.BO');
    console.log(JSON.stringify(quote, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}
main();
