# Market Data Reliability & Performance Hardening

## Incident Overview (Phase 10.5)
During local verification, the `GET /api/v1/portfolios` endpoint returned a successful `HTTP 200` but experienced severe latency, with a worst-case response time of ~50.77 seconds.

### Root Cause Analysis

1. **Yahoo Finance Bottleneck (Batch Failure Poisoning):**
   - **Before:** The provider fetched all 26 symbols as a single batch using `Promise.race([yf.quote(array), timeout(10000)])`. 
   - **Issue:** `yf.quote` on a large batch containing invalid or rate-limited symbols could either hang or throw a single exception for the entire batch. Consequently, if *one* symbol failed or delayed the request past the 10-second timeout, the entire batch failed, resulting in all 26 holdings reporting `TIMEOUT` or `SYMBOL_NOT_FOUND`.

2. **Google Finance Bottleneck (Sequential Pacing):**
   - **Before:** The provider iterated sequentially over all 26 holdings: `for (const id of identifiers) { await getFundamentals(...) }`, adding a 500ms delay between each fetch. 
   - **Issue:** `26 * (HTTP Request Time + 500ms Delay)` guaranteed a minimum latency of ~15 seconds under perfect conditions, and easily extended to ~40-50 seconds if some requests took 1-2 seconds or encountered network/timeout delays.

3. **Orphaned Timeouts (Resource Leaks):**
   - **Before:** `Promise.race` was used with a dangling `setTimeout` that was never cleared upon successful resolution. The Google `fetchHtml` function lacked a mechanism to actively destroy the underlying `https` socket if the 12-second overall timeout was reached.

### Architecture Improvements

#### 1. Provider Independence & Bounded Concurrency
- **Yahoo Strategy:** Refactored from a single all-or-nothing batch array to individual symbol requests executed concurrently with a strict limit (`YAHOO_CONCURRENCY`, defaulting to 5). 
- **Google Strategy:** Replaced the sequential loop with the same bounded concurrency utility (`GOOGLE_CONCURRENCY`, defaulting to 5). Re-introduced a small 200ms inter-request delay per worker to prevent aggressive scraping blocks while still parallelizing the workload.

#### 2. Timeouts & HTTP Aborts
- **Timeouts:** A dedicated `withTimeout` utility was introduced to wrap promises, ensuring timers are cleared immediately via `clearTimeout` upon resolution or rejection, preventing Node event loop leakage.
- **Resource Cleanup:** In Google's `fetchHtml`, if the timeout is reached before the request resolves, the underlying `https.ClientRequest` is actively destroyed (`req.destroy()`) to prevent socket leakage.

#### 3. Partial Failure & Caching Strategies
- **Partial Success Resilience:** Because fetches are executed individually under the concurrency pool, one failed symbol (e.g., an invalid ticker) will only result in `null` data for itself, preserving successful responses for the remaining 25 holdings.
- **Failure Cache (Short TTL):** Previously, failures might be re-attempted on every request, or cached for an entire hour alongside successes. 
  - **Yahoo Cache:** Successful quotes are cached for 10 seconds. Provider failures are now explicitly failure-cached for 30 seconds to prevent immediate re-hammering.
  - **Google Cache:** Successful fundamentals are cached for 1 hour. Failures are cached for 1 minute to prevent persistent 10-second request hangs per refresh.

### Performance Results

| Metric | Before (Observed) | After (Measured) |
| --- | --- | --- |
| Cold Cache Latency | ~50.77s | ~8.67s |
| Warm Cache Latency | ~50.77s | ~0.48s |

- **Yahoo Real Success Rate:** 26 attempted, partial failures successfully isolated.
- **Google Real Success Rate:** 26 attempted, partial failures successfully isolated.
- **Overall Time Budget:** Worst-case wait bounded strictly by concurrency limits multiplied by the per-request timeout.
