const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const pCount = await prisma.portfolio.count();
  const hCount = await prisma.holding.count();
  console.log(`Portfolios: ${pCount}`);
  console.log(`Holdings: ${hCount}`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
