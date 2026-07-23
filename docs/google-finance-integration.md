# Google Finance Integration

## Overview
Phase 10 implements Google Finance integration to retrieve the **P/E Ratio (TTM)** and **Latest Earnings** for portfolio holdings. This fulfills the explicit assignment requirement to fetch fundamentals from Google Finance, while keeping Current Market Price (CMP) fetching strictly isolated to Yahoo Finance.

## Architecture & Provider Abstraction
To avoid polluting core portfolio calculations with HTML scraping logic, Google Finance interactions are strictly encapsulated:
- **`FundamentalsProvider` Interface:** Defines the contract for fetching fundamentals (`peRatio` and `latestEarnings`).
- **`GoogleFinanceProvider`:** Implements this interface using lightweight, standard `https.get` requests and `cheerio` for HTML DOM parsing.
- **`GoogleFinanceMapper`:** Safely maps canonical database identifiers to Google Finance provider symbols (e.g. `HDFCBANK:NSE` and `532174:BOM`).

## Symbol Mapping Strategy
Unlike Yahoo Finance (`.NS` / `.BO`), Google Finance utilizes a `<TICKER>:<EXCHANGE>` format.
- **NSE:** Text-based tickers (e.g., `HDFCBANK`) are mapped to the `NSE` exchange identifier (`HDFCBANK:NSE`).
- **BSE:** Numeric security codes (e.g., `532174`) are mapped to the `BOM` (Bombay Stock Exchange) exchange identifier (`532174:BOM`).

## Definition of "Latest Earnings"
Google Finance does not natively expose a single key statistic labeled "Latest Earnings".
After analyzing the page structure, we map "Latest Earnings" to the **Net income** value presented in the quarterly Financials table. This accurately represents the company's earnings for the most recently reported period net of operating costs, taxes, and interest.

## P/E Ratio Parsing
The P/E Ratio is extracted from the "Key Stats" section by locating the `P/E ratio` label and extracting the sibling `.P6K39c` div value. It is parsed into a strict floating-point number.

## Performance & Caching
Fundamentals (P/E and Earnings) change quarterly or daily, not second-by-second like CMP.
- **TTL:** The `MarketDataService` caches Google Finance responses in-memory for **1 hour** (3600 seconds) to prevent unnecessary network load and avoid triggering Google's rate limits.
- **Concurrency:** Batch requests to Google Finance are processed sequentially with a 500ms delay. Uncontrolled concurrency (e.g., fetching 26 securities simultaneously) results in IP blocks and 10-second `TIMEOUT` errors from Google.

## Error Normalization & Partial Failures
Google HTML scraping is inherently fragile. If Google changes its DOM or blocks the request, the provider normalizes errors into specific categories (`TIMEOUT`, `SYMBOL_NOT_FOUND`, `PARSE_FAILED`).
The Portfolio Service utilizes `Promise.all` to fetch Yahoo and Google data concurrently. If Google Finance fails for a specific ticker, `peRatio` and `latestEarnings` will safely fallback to `null` while preserving the `currentMarketPrice` from Yahoo. This guarantees partial-failure resilience.
