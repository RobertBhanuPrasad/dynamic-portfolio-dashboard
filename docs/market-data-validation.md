# Market Data Validation Architecture

## Overview
The Dynamic Portfolio Dashboard consumes live pricing and fundamental data from external providers (Yahoo Finance, Google Finance). Because external identifiers are mapping from PostgreSQL/Excel, we strictly validate returned data to prevent API inconsistencies (such as Market Capitalization inadvertently mapped as Current Market Price or mapping to foreign instruments) from corrupting the portfolio valuation.

## Yahoo Finance Symbol Mapping
- **NSE Equities**: Tickers consisting entirely of alphabetical strings (e.g., `HDFCBANK`, `RELIANCE`) are appended with `.NS`.
- **BSE Equities**: Tickers consisting of numeric codes (e.g., `541557`, `500400`) are mapped to the Bombay Stock Exchange by appending `.BO`.
- **Implementation**: Handled globally in `YahooSymbolMapper.toProviderSymbol`.

## Market Data Validation
To prevent anomalous data from breaking calculations, quotes are subjected to strict identity and bounds validation before being accepted:

1. **Numeric Integrity**: The `regularMarketPrice` must be a `number`, `finite`, and strictly greater than `0`.
2. **Currency Identity**: The returned `quote.currency` MUST be `INR`. This protects against BSE numeric codes accidentally colliding with foreign instruments (e.g. Indonesian stocks in IDR). If the currency is incorrect, the quote is rejected with a `CURRENCY_MISMATCH`.
3. **Instrument Identity**: The returned `quote.quoteType` MUST be `EQUITY`. This prevents the ingestion of mutual funds, ETNs, or corrupted API payloads. Invalid quotes are rejected with `INVALID_QUOTE_TYPE`.

## Provider Failure Isolation
If a quote is rejected or times out:
- The holding's `currentMarketPrice` becomes `null`.
- The `marketDataError` field is populated with the specific error category (e.g., `TIMEOUT`, `CURRENCY_MISMATCH`, `INVALID_PRICE`).
- The `PortfolioCalculator` intelligently ignores `null` values when computing `presentValue`, `gainLoss`, and `gainLossPercentage`.
- The aggregate Portfolio `Total Present Value` will simply represent the sum of *successfully priced* investments.
- The aggregate Portfolio `Total Investment` always reflects 100% of the active database holdings, preserving historical integrity.

## Cache Behavior
- **Successes**: Valid quotes and fundamentals are cached in memory. Quotes for 10 seconds; Fundamentals for 1 hour.
- **Failures**: Rejected or timed-out requests are cached using a short failure TTL (e.g., 30-60 seconds) to prevent catastrophic rate-limiting cascades (`429 Too Many Requests`) against Yahoo/Google.

## Known Limitations
- The underlying `yahoo-finance2` library relies on Undici's `fetch`, which experiences recurrent `UND_ERR_CONNECT_TIMEOUT` issues under Node.js 20.x environments on specific networks. The application degrades gracefully in these scenarios, preserving the application's UX and historical investment values. Node 22+ is heavily recommended in production.
