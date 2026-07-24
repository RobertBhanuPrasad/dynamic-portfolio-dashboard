# Portfolio Dashboard UI (Phase 13)

## Dashboard Architecture
The dashboard UI relies on a Next.js App Router hybrid model. The main page (`page.tsx`) acts as a Server Component that initially fetches data from the backend to ensure fast initial page loads and SEO capabilities. It passes this data to the client-side `<PortfolioDashboard />` component via the `initialPortfolio` prop. This allows the application to hydrate instantly without an initial client-side spinner.

## Component Architecture
```
components/portfolio/
├── PortfolioDashboard.tsx   # Main orchestrator (Client Component)
├── PortfolioSummaryCards.tsx # Top-level aggregated financial metrics
├── SectorSection.tsx        # Groups holdings into Sector containers
├── PortfolioTable.tsx       # Reusable responsive financial table
├── GainLoss.tsx             # Semantic visual formatting (+/- colors)
└── RefreshStatus.tsx        # Polling status indicator and manual trigger
```

## Portfolio Table & Sector Grouping
The financial table was built using semantic HTML (`table`, `thead`, `tbody`, `th`, `td`). We intentionally avoided heavy dependencies like DataGrid or virtualization since the active holdings count is only 26.
- **Responsiveness**: Wrapped in `overflow-x-auto` to allow horizontal scrolling on small screens without breaking cell alignments.
- **Sticky Headers**: The table header (`sticky top-0`) and the Company Name column (`sticky left-0`) remain visible while scrolling, preserving context on wide screens.
- **Sector Grouping**: Each sector dynamically renders its own section containing summary totals (Investment, Present Value, Gain/Loss) and its respective table of holdings.

## Formatting and Nullable Values
Financial values are formatted using Indian Rupee conventions (e.g., `₹15,43,060.00`).
Market data can independently fail. The UI safely renders missing values (e.g., `null` CMP or Present Value) as `—`. We explicitly do NOT substitute `$0`, ensuring the portfolio valuation does not incorrectly drop.

## Polling Architecture & 15-Second Refresh
To satisfy the 15-second live refresh requirement, a custom `usePortfolio` hook manages the React lifecycle:
- **setInterval**: Safely executes every 15,000ms.
- **Background Refresh Behavior**: During background updates, the previous portfolio data remains visible. The UI does not revert to a loading skeleton. A small pulsing `RefreshStatus` indicator informs the user.
- **Duplicate Protection**: A `useRef` tracking `isFetching` completely prevents duplicate overlapping requests if a network call hangs longer than 15 seconds.
- **Error Handling**: If a background refresh fails (e.g., network timeout), the application safely catches the error, leaves the old data visible, and displays a non-intrusive warning banner allowing a manual retry. The interval continues attempting next cycles.

## Accessibility Decisions
Semantic tags were heavily utilized. Colors are not the sole indicator of gain/loss (we include `+` and `-` prefixes). Contrast requirements are met across the Tailwind design system, and the manual refresh button uses appropriate focus and disabled states.
