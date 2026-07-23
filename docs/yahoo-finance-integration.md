# Yahoo Finance Integration

## Context
Phase 9 introduces the retrieval of the Current Market Price (CMP) for portfolio holdings. The project requires Yahoo Finance as the market data provider. Because Yahoo Finance does not provide a stable, official public API, this integration treats it as a potentially unreliable external service.

## Integration Strategy
We are using the `yahoo-finance2` library to abstract the raw HTTP requests to Yahoo's unofficial endpoints.
The architecture enforces strict isolation by using a `MarketDataProvider` interface, ensuring that portfolio business logic doesn't leak provider-specific details.

## Provider Abstraction
The `MarketDataProvider` interface requires `getQuote` and `getQuotes` methods. The concrete implementation `YahooFinanceProvider` handles interacting with Yahoo Finance, including mapping identifiers, batch fetching, and normalizing errors.

## Identifier Mapping
The database stores canonical identifiers (e.g., `HDFCBANK`, `532174`).
- **NSE text symbols** (e.g., `HDFCBANK`) are mapped to `<ticker>.NS`.
- **BSE numeric identifiers** (e.g., `532174`) are mapped to `<ticker>.BO`.
This ensures robust integration without altering the canonical database records.

## Batch Fetching
To minimize rate limits and avoid N+1 requests, `MarketDataService.getQuotes` utilizes Yahoo Finance's batch-fetch capabilities. Up to 26 holdings can be resolved in a single request.

## Caching Strategy
We implemented an in-memory short-lived caching mechanism (10-second TTL) within `MarketDataService`.
This reduces the frequency of external HTTP requests, which is crucial given the frontend's requirement to poll the backend every 15 seconds. Concurrent requests for the same symbol are deduplicated.

## Error Handling & Partial Failures
If a quote request fails (e.g., due to timeout, rate limiting, or symbol not found), the provider returns an error object without crashing the entire portfolio response. Unresolvable prices are surfaced as `null`, alongside an `errorCategory`, ensuring graceful degradation of the UI.

## Timeout Strategy
All Yahoo HTTP requests are bounded by `Promise.race` with a reasonable timeout limit (e.g., 5 seconds for a single quote, 10 seconds for batch).

## Known Limitations
- The API is unofficial; endpoints may change.
- Strict rate limits are occasionally applied by Yahoo based on IP address.
- Prolonged delays in network requests could cause caching stampedes if not fully mitigated, though request deduplication is already implemented.
