import { prisma } from '../db/prisma';
import { NormalizedHolding } from './types';

export class DatabaseImporter {
  public async importData(holdings: NormalizedHolding[]) {
    // We use a single transaction to ensure all inserts succeed or fail together.
    await prisma.$transaction(async (tx) => {
      // 1. Ensure a default user exists for the assignment portfolio
      const user = await tx.user.upsert({
        where: { email: 'assignment@example.com' },
        update: {},
        create: { email: 'assignment@example.com' }
      });

      // 2. Ensure the portfolio exists
      const portfolioName = 'Original Assignment Portfolio';
      let portfolio = await tx.portfolio.findFirst({
        where: { userId: user.id, name: portfolioName }
      });

      if (!portfolio) {
        portfolio = await tx.portfolio.create({
          data: { userId: user.id, name: portfolioName }
        });
      }

      // 3. Upsert Sectors
      // Get unique sectors from holdings
      const uniqueSectors = [...new Set(holdings.map(h => h.sector))];
      const sectorMap = new Map<string, string>(); // name -> id
      
      for (const sectorName of uniqueSectors) {
        const sector = await tx.sector.upsert({
          where: { name: sectorName },
          update: {},
          create: { name: sectorName }
        });
        sectorMap.set(sectorName, sector.id);
      }

      // 4. Upsert Holdings
      for (const h of holdings) {
        const sectorId = sectorMap.get(h.sector);
        if (!sectorId) throw new Error(`Sector ID not found for ${h.sector}`);

        await tx.holding.upsert({
          where: {
            portfolioId_ticker: {
              portfolioId: portfolio.id,
              ticker: h.securityIdentifier
            }
          },
          update: {
            companyName: h.companyName,
            purchasePrice: h.purchasePrice,
            quantity: h.quantity,
            sectorId: sectorId,
            exchange: h.exchange,
            identifierType: h.securityIdentifierType
          },
          create: {
            portfolioId: portfolio.id,
            companyName: h.companyName,
            purchasePrice: h.purchasePrice,
            quantity: h.quantity,
            sectorId: sectorId,
            ticker: h.securityIdentifier,
            exchange: h.exchange,
            identifierType: h.securityIdentifierType
          }
        });
      }
    });
  }
}
