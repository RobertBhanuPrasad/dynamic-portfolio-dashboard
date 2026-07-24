import { PortfolioService } from "../services/portfolio.service";
import { formatCurrency, formatPercentage, formatNumber } from "../lib/formatters";

// Define it as a dynamic route or configure revalidation here.
// For now, Next.js default is to force-cache fetch, but we set 'no-store' in the API client.
export const dynamic = "force-dynamic";

export default async function PortfolioDashboard() {
  const portfolios = await PortfolioService.getPortfolios();

  if (!portfolios || portfolios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-slate-50 rounded-lg border border-slate-200 text-slate-600">
        <h2 className="text-xl font-semibold mb-2">No Portfolio Data</h2>
        <p>No portfolio data available.</p>
      </div>
    );
  }

  const primaryPortfolio = portfolios[0];
  const { summary, sectors } = primaryPortfolio;
  const coverage = summary.marketDataCoverage;

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Total Investment</h3>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(summary.totalInvestment)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Holdings</h3>
          <p className="text-2xl font-bold text-slate-900">{formatNumber(coverage.totalHoldings)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Market Data Coverage</h3>
          <p className="text-2xl font-bold text-slate-900">
            {coverage.pricedHoldings} / {coverage.totalHoldings}
          </p>
          <p className="text-xs text-slate-400 mt-1">prices available</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Present Value (Priced)</h3>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(summary.totalPresentValue)}</p>
        </div>
      </section>

      {/* Sector Verification */}
      <section>
        <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Sector Breakdown</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {sectors.map((sectorGroup) => (
            <div key={sectorGroup.sector.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex justify-between items-center">
              <div>
                <h4 className="font-medium text-slate-800">{sectorGroup.sector.name}</h4>
                <p className="text-xs text-slate-500">{sectorGroup.holdings.length} holdings</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-900">{formatCurrency(sectorGroup.summary.totalInvestment)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Temporary Holdings Verification */}
      <section>
        <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Holdings Verification</h2>
        <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-slate-200">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Ticker</th>
                <th className="px-4 py-3">Investment</th>
                <th className="px-4 py-3">CMP</th>
                <th className="px-4 py-3">Present Value</th>
                <th className="px-4 py-3">Gain/Loss</th>
              </tr>
            </thead>
            <tbody>
              {sectors.flatMap(s => s.holdings).map((holding) => (
                <tr key={holding.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{holding.ticker}</td>
                  <td className="px-4 py-3">{formatCurrency(holding.investment)}</td>
                  <td className="px-4 py-3">{formatCurrency(holding.currentMarketPrice)}</td>
                  <td className="px-4 py-3">{formatCurrency(holding.presentValue)}</td>
                  <td className={`px-4 py-3 ${holding.gainLoss && holding.gainLoss > 0 ? 'text-green-600' : holding.gainLoss && holding.gainLoss < 0 ? 'text-red-600' : ''}`}>
                    {formatCurrency(holding.gainLoss)}
                    {holding.gainLossPercentage !== null && <span className="ml-1 text-xs opacity-75">({formatPercentage(holding.gainLossPercentage)})</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
