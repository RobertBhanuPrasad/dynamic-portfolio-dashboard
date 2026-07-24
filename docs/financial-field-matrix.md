# Financial Field Matrix

This document provides a gap analysis of all conceptual fields from the original Excel source against the current PostgreSQL database and backend API implementations.

| Excel Field | DB (Prisma) | API | Frontend | Source | Status |
|-------------|-------------|-----|----------|--------|--------|
| No | No | No | No | N/A | NOT_APPLICABLE |
| Particulars / Company Name | Yes | Yes | Yes | Excel | SUPPORTED |
| Purchase Price | Yes | Yes | Yes | Excel | SUPPORTED |
| Qty | Yes | Yes | Yes | Excel | SUPPORTED |
| Investment | No | Yes | Yes | Backend Calc | SUPPORTED |
| Portfolio (%) | No | Yes | Yes | Backend Calc | SUPPORTED |
| NSE/BSE | Yes (exchange) | No | No | Excel | NOT_RENDERED |
| CMP | No | Yes | Yes | Yahoo Finance | LIVE_PROVIDER_DEPENDENT |
| Present Value | No | Yes | Yes | Backend Calc | LIVE_PROVIDER_DEPENDENT |
| Gain/Loss | No | Yes | Yes | Backend Calc | LIVE_PROVIDER_DEPENDENT |
| Gain/Loss (%) | No | Yes | Yes | Backend Calc | LIVE_PROVIDER_DEPENDENT |
| Market Cap | No | No | No | Google Finance | NOT_AVAILABLE |
| P/E (TTM) | No | Yes | Yes | Google Finance | LIVE_PROVIDER_DEPENDENT |
| Latest Earnings | No | Yes | Yes | Google Finance | LIVE_PROVIDER_DEPENDENT |
| Revenue (TTM) | No | No | No | Google Finance | NOT_AVAILABLE |
| EBITDA (TTM) | No | No | No | Google Finance | NOT_AVAILABLE |
| EBITDA (%) | No | No | No | Backend Calc | NOT_AVAILABLE |
| PAT | No | No | No | Google Finance | NOT_AVAILABLE |
| PAT (%) | No | No | No | Backend Calc | NOT_AVAILABLE |
| CFO (March 24) | No | No | No | External | NOT_AVAILABLE |
| CFO (5 years) | No | No | No | External | NOT_AVAILABLE |
| Free Cash Flow (5 years) | No | No | No | External | NOT_AVAILABLE |
| Debt to Equity | No | No | No | External | NOT_AVAILABLE |
| Book Value | No | No | No | External | NOT_AVAILABLE |
| Revenue | No | No | No | External | NOT_AVAILABLE |
| EBITDA | No | No | No | External | NOT_AVAILABLE |
| Profit | No | No | No | External | NOT_AVAILABLE |
| Price to Sales | No | No | No | External | NOT_AVAILABLE |
| CFO to EBITDA | No | No | No | External | NOT_AVAILABLE |
| CFO to PAT | No | No | No | External | NOT_AVAILABLE |
| Price to Book | No | No | No | External | NOT_AVAILABLE |
| Stage-2 | No | No | No | External | NOT_AVAILABLE |
| Sale Price | No | No | No | External | NOT_AVAILABLE |
| Remarks / Abhishek | No | No | No | External | NOT_AVAILABLE |

## Analysis
- **Supported Fields**: The core ownership and investment identifiers (Purchase Price, Qty) are correctly persisted in PostgreSQL and calculated at runtime.
- **Live Provider Fields**: CMP is dynamically sourced from Yahoo Finance. P/E and Latest Earnings are sourced from Google Finance. These remain strictly dynamic and are NOT persisted.
- **Unavailable Fields**: Fundamental metrics like Market Cap, Revenue, EBITDA, PAT, and advanced cash flow metrics are not currently fetched by the Google Finance provider nor stored in the database. Exposing these would require extending the backend provider implementation in a future phase.
- **Available but Not Rendered**: The `exchange` field (NSE/BSE) is stored in the database but currently omitted from the API `HoldingResponse`. It can be added to the DTO if needed, but is largely inferred by the ticker suffix.
