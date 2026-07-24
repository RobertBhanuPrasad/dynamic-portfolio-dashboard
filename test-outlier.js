async function main() {
  const res = await fetch('http://localhost:8080/api/v1/portfolios');
  const data = await res.json();
  const portfolio = data.data[0];
  
  if (!portfolio) {
    console.log("No portfolio found.");
    return;
  }
  
  const allHoldings = portfolio.sectors.flatMap(s => s.holdings);
  
  allHoldings.sort((a, b) => (b.presentValue || 0) - (a.presentValue || 0));
  
  console.log("Holdings sorted by Present Value:");
  for (const h of allHoldings) {
    if (h.presentValue !== null) {
      console.log(`Ticker: ${h.ticker} | Qty: ${h.quantity} | Purchase: ${h.purchasePrice} | CMP: ${h.currentMarketPrice} | PV: ${h.presentValue} | GainLoss: ${h.gainLoss} | Error: ${h.marketDataError}`);
    }
  }
  
  console.log("\nFailed to fetch prices for:");
  for (const h of allHoldings) {
    if (h.presentValue === null) {
      console.log(`Ticker: ${h.ticker} | Error: ${h.marketDataError}`);
    }
  }
}
main().catch(console.error);
