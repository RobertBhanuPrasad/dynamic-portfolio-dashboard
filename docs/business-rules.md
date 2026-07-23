# Business Rules & Validation

## Calculations
The Backend acts as the authoritative engine for all calculations.

1. **Holding Investment (Cost Basis)**
   - Formula: `purchasePrice * quantity`
   - Description: The total historical capital invested in a specific holding.

2. **Holding Present Value**
   - Formula: `currentMarketPrice * quantity`
   - Description: The real-time value of the holding based on Yahoo Finance data.

3. **Holding Gain/Loss (Unrealized)**
   - Formula: `Holding Present Value - Holding Investment`
   - Description: The absolute monetary profit or loss for a single holding.

4. **Portfolio Total Investment**
   - Formula: `Sum of all Holding Investments in the Portfolio`
   - Description: Total capital injected into the entire portfolio.

5. **Portfolio Total Present Value**
   - Formula: `Sum of all Holding Present Values in the Portfolio`
   - Description: Real-time value of the entire portfolio.

6. **Portfolio Total Gain/Loss**
   - Formula: `Portfolio Total Present Value - Portfolio Total Investment`
   - Description: Total absolute return.

7. **Holding Portfolio Percentage**
   - Formula: `Holding Present Value / Portfolio Total Present Value`
   - Description: The weight of a specific holding relative to the entire portfolio.

8. **Sector Investment**
   - Formula: `Sum of Holding Investments grouped by Sector`
   - Description: Total capital allocated to a specific sector.

9. **Sector Gain/Loss**
   - Formula: `Sum of Holding Gain/Loss grouped by Sector`
   - Description: Profitability of a specific sector strategy.

10. **Sector Portfolio Percentage**
    - Formula: `Sum of Sector Present Value / Portfolio Total Present Value`
    - Description: Weight of the sector relative to the entire portfolio.

## Validation Rules
All incoming data must be sanitized and validated before hitting the database or external APIs.

1. **Purchase Price**
   - Rule: Must be a numeric value strictly greater than `0`.
   - Reason: You cannot buy an asset for negative money or exactly free in standard markets.

2. **Quantity**
   - Rule: Must be a positive integer (strictly `> 0`).
   - Reason: Fractional shares are currently unsupported; negative shares (shorting) are unsupported.

3. **Ticker**
   - Rule: Cannot be empty, must be uppercase alphanumeric (e.g., `AAPL`, `BRK.A`).
   - Reason: Required as the primary lookup key for Yahoo and Google Finance.

4. **Sector**
   - Rule: Must exactly match a pre-defined list of supported sectors stored in the database.
   - Reason: Prevents fragmentation of sector grouping (e.g., "Tech" vs "Technology").

5. **Portfolio Name**
   - Rule: Cannot be empty, maximum length 50 characters, unique per User.
   - Reason: Ensures predictable UI rendering and data sanity.
