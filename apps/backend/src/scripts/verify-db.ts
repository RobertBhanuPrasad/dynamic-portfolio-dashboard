import { prisma } from '../db/prisma';

async function verify() {
  const userCount = await prisma.user.count();
  const portfolioCount = await prisma.portfolio.count();
  const sectorCount = await prisma.sector.count();
  const holdingCount = await prisma.holding.count();

  console.log('--- DATABASE COUNTS ---');
  console.log(`Users: ${userCount}`);
  console.log(`Portfolios: ${portfolioCount}`);
  console.log(`Sectors: ${sectorCount}`);
  console.log(`Holdings: ${holdingCount}`);
}

verify().finally(() => prisma.$disconnect());
