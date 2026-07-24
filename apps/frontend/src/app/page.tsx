import { PortfolioService } from "../services/portfolio.service";
import { PortfolioDashboard } from "../components/portfolio/PortfolioDashboard";

export const dynamic = "force-dynamic";

export default async function PortfolioDashboardPage() {
  let initialPortfolio = null;
  
  try {
    const portfolios = await PortfolioService.getPortfolios();
    initialPortfolio = portfolios.length > 0 ? portfolios[0] : null;
  } catch (error) {
    // If initial server fetch fails, we let the client component handle the error state 
    // by passing null (or we could pass the error, but the client will just re-fetch and show its error)
    console.error("Server fetch failed:", error);
  }

  return <PortfolioDashboard initialPortfolio={initialPortfolio} />;
}
