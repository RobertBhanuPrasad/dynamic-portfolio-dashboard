import { WorkbookReader } from './workbook-reader';
import { RowClassifier } from './row-classifier';
import { Normalizer } from './normalizer';
import { Validator } from './validator';
import { DatabaseImporter } from './importer';
import { RowType, NormalizedHolding, InvalidHolding, ImportSummary } from './types';
import * as path from 'path';

export async function runImport(filePath: string, isDryRun: boolean = true): Promise<ImportSummary> {
  const reader = new WorkbookReader();
  const rows = reader.readRows(filePath);
  
  const classifier = new RowClassifier();
  const normalizer = new Normalizer();
  const validator = new Validator();
  
  let sectorHeadersFound = 0;
  let activeHoldingsFound = 0;
  let soldHoldingsFound = 0;
  let blankRows = 0;
  let unknownRows = 0;
  
  const activeHoldings: NormalizedHolding[] = [];
  const invalidActiveRows: InvalidHolding[] = [];
  
  let spreadsheetReportedTotal = 0;
  let calculatedActiveInvestmentTotal = 0;

  const sectorReconciliation = new Map<string, number>();

  for (const row of rows) {
    const classification = classifier.classify(row);
    
    switch(classification.type) {
      case RowType.BLANK:
        blankRows++;
        break;
      case RowType.SECTOR_HEADER:
        sectorHeadersFound++;
        normalizer.setCurrentSector(String(row.data[1]));
        break;
      case RowType.ACTIVE_HOLDING:
        activeHoldingsFound++;
        try {
          const holding = normalizer.normalizeActiveHolding(row);
          const errors = validator.validate(holding);
          
          if (errors.length > 0) {
            invalidActiveRows.push(...errors);
          } else {
            activeHoldings.push(holding);
            const investment = holding.purchasePrice * holding.quantity;
            calculatedActiveInvestmentTotal += investment;
            
            sectorReconciliation.set(
              holding.sector, 
              (sectorReconciliation.get(holding.sector) || 0) + investment
            );
          }
        } catch (e: any) {
          invalidActiveRows.push({
            sourceRowNumber: row.rowNumber,
            field: 'unknown',
            category: 'PARSE_EXCEPTION',
            reason: e.message
          });
        }
        break;
      case RowType.PORTFOLIO_TOTAL:
        if (row.data[4] !== undefined) {
          spreadsheetReportedTotal = parseFloat(String(row.data[4]).replace(/,/g, ''));
        }
        break;
      case RowType.SOLD_HOLDING:
        soldHoldingsFound++;
        break;
      case RowType.UNKNOWN:
        unknownRows++;
        console.warn(`Unknown row detected at line ${row.rowNumber}`);
        break;
    }
  }

  const summary: ImportSummary = {
    worksheetSelected: reader.sheetName,
    rowsScanned: rows.length,
    sectorHeadersFound,
    activeHoldingsFound,
    soldHoldingsFound,
    blankRows,
    unknownRows,
    invalidActiveRows,
    calculatedActiveInvestmentTotal,
    spreadsheetReportedTotal
  };

  console.log('\n======================================');
  console.log(isDryRun ? 'DRY RUN SUMMARY' : 'IMPORT SUMMARY');
  console.log('======================================');
  console.log(`Worksheet: ${summary.worksheetSelected}`);
  console.log(`Rows Scanned: ${summary.rowsScanned}`);
  console.log(`Active Holdings: ${summary.activeHoldingsFound}`);
  console.log(`Sold Holdings: ${summary.soldHoldingsFound}`);
  console.log(`Sector Headers: ${summary.sectorHeadersFound}`);
  console.log(`Blank/Ignored Rows: ${summary.blankRows}`);
  console.log(`Unknown Rows: ${summary.unknownRows}`);
  console.log(`Invalid Active Rows: ${summary.invalidActiveRows.length}`);
  
  if (invalidActiveRows.length > 0) {
    console.error('Validation Failures:', JSON.stringify(invalidActiveRows, null, 2));
  }

  console.log('\n--- INVESTMENT RECONCILIATION ---');
  console.log(`Calculated Total: ${calculatedActiveInvestmentTotal}`);
  console.log(`Spreadsheet Total: ${spreadsheetReportedTotal}`);
  console.log(`Difference: ${calculatedActiveInvestmentTotal - spreadsheetReportedTotal}`);

  console.log('\n--- SECTOR RECONCILIATION ---');
  for (const [sector, total] of sectorReconciliation.entries()) {
    console.log(`${sector}: ${total}`);
  }

  if (invalidActiveRows.length > 0) {
    console.warn('\n⚠️ Aborting import due to validation errors.');
    return summary;
  }

  if (!isDryRun) {
    console.log('\nStarting database import...');
    const importer = new DatabaseImporter();
    await importer.importData(activeHoldings);
    console.log('✅ Database import completed successfully.');
  }

  return summary;
}

// CLI Execution
if (require.main === module) {
  const isDryRun = !process.argv.includes('--execute');
  const filePath = path.resolve(__dirname, '../../../../data/source/302ABB36.xlsx');
  
  runImport(filePath, isDryRun).catch(e => {
    console.error('Import failed with exception:', e);
    process.exit(1);
  });
}
