async function runTest() {
  console.log("Testing API...");

  // Cold request
  let start = performance.now();
  let res = await fetch('http://localhost:8080/api/v1/portfolios');
  let data = await res.json();
  let end = performance.now();
  console.log(`Cold Request Time: ${(end - start).toFixed(2)}ms`);

  // Warm request
  start = performance.now();
  res = await fetch('http://localhost:8080/api/v1/portfolios');
  data = await res.json();
  end = performance.now();
  console.log(`Warm (Cached) Request Time: ${(end - start).toFixed(2)}ms`);

  const portfolio = data.data[0];
  console.log("Total Investment: ", portfolio.summary.totalInvestment);
  console.log("Total Holdings: ", portfolio.summary.marketDataCoverage.totalHoldings);

  portfolio.sectors.forEach(s => {
    console.log(`Sector: ${s.sector.name}, Investment: ${s.summary.totalInvestment}`);
  });

  const hdfc = portfolio.sectors.flatMap(s => s.holdings).find(h => h.ticker === 'HDFCBANK');
  console.log("HDFC Holding:", JSON.stringify(hdfc, null, 2));
}
runTest().catch(console.error);
