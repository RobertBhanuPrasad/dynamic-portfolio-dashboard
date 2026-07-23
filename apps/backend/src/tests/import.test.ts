import test from 'node:test';
import assert from 'node:assert';
import * as path from 'path';
import { runImport } from '../data-import/index';
import { RowClassifier } from '../data-import/row-classifier';
import { Normalizer } from '../data-import/normalizer';
import { RowType } from '../data-import/types';

test('Portfolio Data Import Verification', async (t) => {
  const filePath = path.resolve(__dirname, '../../../../data/source/302ABB36.xlsx');
  
  await t.test('1. Workbook parsing, row classification, active/sold boundaries, totals', async () => {
    // Run dry-run to test everything without mutating DB
    const summary = await runImport(filePath, true);
    
    assert.strictEqual(summary.worksheetSelected, 'Priyanshu');
    assert.ok(summary.rowsScanned > 900);
    assert.strictEqual(summary.sectorHeadersFound, 6);
    assert.strictEqual(summary.activeHoldingsFound, 26);
    assert.strictEqual(summary.soldHoldingsFound, 3);
    assert.strictEqual(summary.invalidActiveRows.length, 0);

    // Totals reconciliation
    assert.strictEqual(summary.spreadsheetReportedTotal, 1543060);
    assert.strictEqual(summary.calculatedActiveInvestmentTotal, 1543060);
  });

  await t.test('2. Row Classifier edge cases', async () => {
    const classifier = new RowClassifier();
    
    // Blank rows
    assert.strictEqual(classifier.classify({ rowNumber: 1, data: [] }).type, RowType.BLANK);
    assert.strictEqual(classifier.classify({ rowNumber: 1, data: [undefined, ''] }).type, RowType.BLANK);

    // Sector header
    assert.strictEqual(classifier.classify({ rowNumber: 2, data: [undefined, 'Financial Sector'] }).type, RowType.SECTOR_HEADER);

    // Active Holding
    assert.strictEqual(classifier.classify({ rowNumber: 3, data: [1, 'Company', 100, 10] }).type, RowType.ACTIVE_HOLDING);

    // Portfolio Total
    const totalRow = { rowNumber: 35, data: [undefined, undefined, undefined, undefined, '1543060'] };
    assert.strictEqual(classifier.classify(totalRow).type, RowType.PORTFOLIO_TOTAL);

    // Sold Holding (appears after total)
    assert.strictEqual(classifier.classify({ rowNumber: 38, data: [1, 'Company', 100, 10] }).type, RowType.SOLD_HOLDING);
  });

  await t.test('3. Normalizer & Data Extraction', async () => {
    const normalizer = new Normalizer();
    
    // Sector normalization
    normalizer.setCurrentSector('  Financial Sector  ');
    
    // NSE Ticker
    const nseRow = normalizer.normalizeActiveHolding({ rowNumber: 2, data: [1, ' HDFC Bank  ', '1,520.5', '166', '252320', '16%', ' HDFCBANK '] });
    assert.strictEqual(nseRow.companyName, 'HDFC Bank');
    assert.strictEqual(nseRow.purchasePrice, 1520.5);
    assert.strictEqual(nseRow.quantity, 166);
    assert.strictEqual(nseRow.sector, 'Financial');
    assert.strictEqual(nseRow.securityIdentifier, 'HDFCBANK');
    assert.strictEqual(nseRow.securityIdentifierType, 'TICKER');
    assert.strictEqual(nseRow.exchange, 'NSE');

    // BSE Code
    const bseRow = normalizer.normalizeActiveHolding({ rowNumber: 3, data: [2, 'Hariom Pipes', '580', '60', '34800', '2%', ' 543517 '] });
    assert.strictEqual(bseRow.securityIdentifier, '543517');
    assert.strictEqual(bseRow.securityIdentifierType, 'BSE_CODE');
    assert.strictEqual(bseRow.exchange, 'BSE');
    
    // Handle "#DIV/0!" or "Loading..." strings gracefully inside numbers if they appear (should result in NaN, caught by validator)
    const errRow = normalizer.normalizeActiveHolding({ rowNumber: 4, data: [3, 'ErrCorp', 'Loading...', '#DIV/0!', '0', '0%', 'TICK'] });
    assert.ok(isNaN(errRow.purchasePrice));
    assert.ok(isNaN(errRow.quantity));
  });
});
