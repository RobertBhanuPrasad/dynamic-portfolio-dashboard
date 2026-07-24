# Dashboard UI/UX Architecture

This document outlines the UI/UX decisions, visual hierarchy, and interaction design of the Dynamic Portfolio Dashboard (Phase 14).

## Visual Hierarchy & Layout
The dashboard employs a clean, data-dense financial aesthetic rather than a consumer marketing style. The layout prioritizes information in the following order:
1. **Headline & Status**: Global context (Portfolio Name) and the live background polling status (e.g. `Live`, `Refreshing...`) paired with a manual trigger.
2. **Summary Cards**: Top-level aggregated financial metrics (Investment, Present Value, Gain/Loss, Market Coverage) that instantly communicate the overall health of the portfolio.
3. **Sector Allocation Chart**: A visual breakdown of capital allocation across industry sectors, serving as a rapid visual anchor before parsing tabular data.
4. **Sector Grouped Holdings Tables**: Detailed tabular data, logically split by sector to prevent overwhelming the user with a single massive 26-row grid.

## Financial Table & Column Strategy
The holdings table (`PortfolioTable.tsx`) was enhanced to support wide-table UX without breaking responsiveness.
- **Column Grouping**: The table header introduces a visual hierarchy by grouping columns into logical categories (`Company info`, `Portfolio`, `Market`, `Fundamentals`). This significantly reduces cognitive load.
- **Sticky Behavior**: On desktop and mobile, the horizontal overflow container allows horizontal scrolling, while the `Company` column remains pinned (`sticky left-0`) so the user never loses context of which stock they are evaluating.
- **Responsive Strategy**: We deliberately avoided stacking table cells arbitrarily on mobile. Semantic tables with horizontal scrolling remain the gold standard for financial tabular data, ensuring numerical alignment is strictly preserved.

## Sector Visualization
- **Library Selection**: We selected `recharts` for the sector allocation chart. It is extremely lightweight, relies directly on React components, handles SSR cleanly in Next.js (when marked as client-side), and produces highly accessible SVGs without canvas-bloat.
- **Data Source**: The chart strictly consumes the `totalInvestment` field from the backend `SectorSummaryResponse` to build its pie slices dynamically, avoiding any hardcoded sectors.

## State Management & Resilience
- **Polling Preservation**: The 15-second polling interval strictly preserves existing tabular data during the background fetch. A non-intrusive dot pulses blue.
- **Network Timeout Behavior**: Long requests or timeouts from Yahoo/Google Finance trigger a localized error state (an amber banner at the top of the dashboard). **Critical design choice**: We do *not* unmount the historical data grid on a failure. The user retains visibility into their baseline investment while the network attempts to recover on the next tick.
- **Null Handling**: Missing fundamentals or quotes (CMP) map deterministically to `—`. This null-safety ensures that missing realtime data does not erroneously render as `0`, which would disastrously plunge the calculated portfolio value.

## Accessibility (a11y)
- The Sector Allocation chart provides a `role="region"` and `aria-label`.
- Gain/Loss values do not rely solely on color (Red/Green); they provide structural prefix indicators (`+` and `-`).
- Table semantics use correct structural HTML (`thead`, `th scope`, etc.).
