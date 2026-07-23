# Data Import Specification (Phase 8)

## Overview
The application's initial dataset is sourced from an original Excel assignment workbook (`data/source/302ABB36.xlsx`). 

**Important Architectural Note**: The Excel workbook is treated strictly as a **one-time source data artifact**. It is NOT the runtime application database. Once the data is parsed and verified, it is transactionally seeded into PostgreSQL. All runtime API requests (e.g. `GET /api/v1/portfolios`) read natively from the PostgreSQL tables using the Prisma ORM. 

## Workbook Structure & Row Classification
The `data-import` module strictly categorizes Excel rows using specific structural heuristics rather than hardcoded positions:
- **Active Holdings**: Identified by a numeric serial number in column 0, and non-empty values in company name, purchase price, and quantity.
- **Sector Headers**: Identified by an empty column 0 and text in column 1.
- **Portfolio Total**: Identified by checking for an aggregate total in column 4 while the first 4 columns are empty.
- **Sold Holdings**: Holdings that appear after the active portfolio is concluded (after the portfolio total row or "Sold Price" header). Sold positions are **not** persisted to PostgreSQL.
- **Ignored / Blank**: Empty arrays or cells containing metadata are safely skipped.

## Security Identifier Handling (Schema Adjustments)
The source workbook includes mixed identifiers in the `NSE/BSE` column:
- **TICKER**: e.g., `HDFCBANK`, `DMART`
- **BSE_CODE**: e.g., `543517`, `532790` (strictly numeric strings)

Because a BSE code is fundamentally different from an NSE ticker, the `Holding` schema was migrated to include:
- `exchange` (e.g., `NSE` or `BSE`)
- `identifierType` (e.g., `TICKER` or `BSE_CODE`)
This guarantees data integrity without corrupting numeric BSE identifiers into assumed NSE symbols.

## Data Normalization
- **Sectors**: Canonical string replacements (e.g., "Financial Sector" → "Financial").
- **Company Whitespace**: Extraneous spacing is reduced to a single space.
- **Calculations**: `purchasePrice` and `quantity` are parsed into numbers. Values like `Loading...` or `#DIV/0!` that appear in unneeded columns are ignored.

## Validation & Verification
Before mutating the database, holdings are validated using strict rules (e.g., valid numbers > 0, existing company names).
The module calculates active investments deterministically (`purchasePrice * quantity`) and reconciles them against the static totals in the spreadsheet.

## Idempotency
Executing `npm run data:import` multiple times is safe. The `DatabaseImporter` utilizes `prisma.$transaction` and `upsert` semantics bound by unique constraints to guarantee duplicate records are never created.

## Executing the Import
1. Validate dataset (Dry-run without DB changes): `npm run data:validate`
2. Import dataset: `npm run data:import` or `npm run db:seed`
