import { prisma } from '../src/db/prisma';
import { runImport } from '../src/data-import/index';
import * as path from 'path';

async function main() {
  console.log('🌱 Starting database seed process...');
  
  const filePath = path.resolve(__dirname, '../../../data/source/302ABB36.xlsx');
  console.log(`Loading portfolio data from ${filePath}`);
  
  // Importer executes transactionally and idempotently
  // We pass 'false' to execute the import (not dry-run)
  await runImport(filePath, false);

  console.log('✅ Seeding completed.');
}

main()
  .catch((e) => {
    console.error('Seed process failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
