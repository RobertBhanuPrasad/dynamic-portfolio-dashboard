import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mock parsed CSV data from Excel
const parsedExcelData = [
  {
    ticker: 'AAPL',
    companyName: 'Apple Inc.',
    sector: 'Technology',
    quantity: 50,
    purchasePrice: 150.00
  },
  {
    ticker: 'MSFT',
    companyName: 'Microsoft Corp.',
    sector: 'Technology',
    quantity: 30,
    purchasePrice: 310.50
  },
  {
    ticker: 'JNJ',
    companyName: 'Johnson & Johnson',
    sector: 'Healthcare',
    quantity: 20,
    purchasePrice: 165.20
  }
];

async function main() {
  console.log('Starting Excel seed process...');

  // 1. Create a default user
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
    },
  });
  console.log(`User created/found: ${user.id}`);

  // 2. Create the initial portfolio
  let portfolio = await prisma.portfolio.findFirst({
    where: { userId: user.id, name: 'Initial Excel Import' }
  });

  if (!portfolio) {
    portfolio = await prisma.portfolio.create({
      data: {
        userId: user.id,
        name: 'Initial Excel Import',
      }
    });
  }
  console.log(`Portfolio created/found: ${portfolio.id}`);

  // 3. Normalize Sectors
  const uniqueSectors = [...new Set(parsedExcelData.map(d => d.sector))];
  const sectorMap = new Map<string, string>(); // SectorName -> SectorID

  for (const sectorName of uniqueSectors) {
    const sector = await prisma.sector.upsert({
      where: { name: sectorName },
      update: {},
      create: { name: sectorName },
    });
    sectorMap.set(sectorName, sector.id);
  }
  console.log('Sectors normalized and inserted.');

  // 4. Insert Holdings (with UPSERT to handle re-running seed)
  for (const row of parsedExcelData) {
    const sectorId = sectorMap.get(row.sector);
    
    if (!sectorId) {
      throw new Error(`Sector not found for ${row.sector}`);
    }

    await prisma.holding.upsert({
      where: {
        portfolioId_ticker: {
          portfolioId: portfolio.id,
          ticker: row.ticker,
        }
      },
      update: {
        quantity: row.quantity,
        purchasePrice: row.purchasePrice,
      },
      create: {
        portfolioId: portfolio.id,
        sectorId: sectorId,
        ticker: row.ticker,
        companyName: row.companyName,
        quantity: row.quantity,
        purchasePrice: row.purchasePrice,
      }
    });
  }

  console.log('Holdings successfully imported from Excel structure.');
}

main()
  .catch((e) => {
    console.error('Seed process failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
