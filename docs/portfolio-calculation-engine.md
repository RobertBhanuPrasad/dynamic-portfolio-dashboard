# Portfolio Calculation Engine

## Overview
Phase 11 introduces a deterministic calculation engine (`PortfolioCalculator`) responsible for aggregating financial metrics and grouping holdings by sector.

To adhere strictly to the principle of "Do not trust stored derived values," calculation results like **Investment**, **Present Value**, and **Gain/Loss** are calculated dynamically at runtime by merging database values (Purchase Price, Quantity) with live market data (CMP) from Yahoo Finance.

These derived metrics are NEVER written back to PostgreSQL. They exist entirely in memory to satisfy the API response for the frontend.

## Source Fields
- `purchasePrice`: Retrieved from PostgreSQL (established during import).
- `quantity`: Retrieved from PostgreSQL.
- `sector`: Retrieved from PostgreSQL.
- `currentMarketPrice` (CMP): Fetched from Yahoo Finance dynamically.
- `peRatio` & `latestEarnings`: Fetched from Google Finance dynamically (passed through without calculation).

## Formulas
The calculator executes pure functions based on the assignment rules:

1. **Investment:** `purchasePrice * quantity`
2. **Present Value:** `cmp * quantity` (Returns `null` if CMP is unavailable)
3. **Gain/Loss:** `Present Value - Investment` (Returns `null` if CMP is unavailable)
4. **Gain/Loss Percentage:** `(Gain/Loss / Investment) * 100` (Returns `0` if investment is `0` or `null` if CMP is missing)
5. **Portfolio Percentage:** `(Investment / Total Portfolio Investment) * 100`

*Note: Portfolio percentage is calculated against total **Investment**, not Present Value, exactly matching the original Excel behavior.*

## Rounding Strategy
- **Money Values:** Full numeric precision is maintained during intermediate aggregation, then safely rounded to 2 decimal places using `Number(Math.round(val + 'e2') + 'e-2')` before serialization.
- **Percentage Values:** Rounded exactly to 2 decimal places.

## Missing CMP & Partial Valuations
When Yahoo Finance fails to return a Current Market Price (e.g. rate-limit or delisted security), the backend gracefully handles partial data:
- `presentValue`, `gainLoss`, and `gainLossPercentage` become `null` for the affected holding.
- The **Sector Summary** and **Portfolio Summary** do NOT assume the missing asset is worth $0. Instead, the aggregated Gain/Loss is calculated *only using successfully priced holdings* to prevent wildly inaccurate negative swings.
- Metadata is provided via `marketDataCoverage` to indicate missing data:
  ```json
  "marketDataCoverage": {
    "totalHoldings": 26,
    "pricedHoldings": 24,
    "unavailableHoldings": 2
  }
  ```

## Sector Aggregation
Holdings are dynamically grouped by the normalized `Sector` ID sourced from PostgreSQL. A Sector Summary aggregates the total investment, present value, and gain/loss for the group using the identical formula and partial-valuation safety checks mentioned above.

## Sold Position Handling
Sold holdings (e.g. Infy, Happiest Mind) were strictly ignored during the Phase 8 Data Import and are not persisted in the database. Therefore, the Portfolio Calculator does not need to filter them out—they simply do not participate in active totals.

## Excel Reconciliation Results
The calculation engine successfully matches the original imported dataset.
Calculated Total Active Investment: **1,543,060**
Spreadsheet Reported Total: **1,543,060**
Difference: **0**

Representative holding investment verifications (Tested in `portfolio-calculator.test.ts`):
- HDFC Bank (`1490 * 50`): **74,500**
- Bajaj Finance (`6466 * 15`): **96,990**
- Affle India (`1151 * 50`): **57,550**
- DMart (`3777 * 27`): **101,979**
- Tata Power (`224 * 225`): **50,400**

All tests pass deterministically.
