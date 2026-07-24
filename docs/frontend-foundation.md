# Frontend Foundation (Phase 12)

## Overview
This document outlines the architecture and foundational configuration of the Next.js frontend for the Dynamic Portfolio Dashboard.

## Architecture
The frontend leverages modern React features through **Next.js 14 App Router**. 
- **Server Components:** Data fetching happens on the server component (`page.tsx`), reducing the need for client-side state management overhead just for initial rendering.
- **Client Components:** Used only for interactivity (e.g., error handling boundaries via `error.tsx`).

## Folder Structure
```
apps/frontend/
  src/
    app/                  // App Router routes and layouts
      layout.tsx          // Global layout shell
      page.tsx            // Primary dashboard route
      loading.tsx         // Global loading state
      error.tsx           // Global error boundary
      globals.css         // Tailwind entry point
    lib/
      api.ts              // Centralized API fetch wrapper
      formatters.ts       // Reusable display formatters
    services/
      portfolio.service.ts // Fetch logic corresponding to backend endpoints
    types/
      portfolio.types.ts  // Strict TypeScript representations of backend API
```

## API Client
The `ApiClient` is a wrapper around the native `fetch` API. It handles centralized JSON parsing, error throwing, and prefixing routes with the environment-configured base URL.

## Portfolio Service
The `PortfolioService` isolates API calls away from React components. The service parses backend responses and strongly types them using the `PortfolioApiResponse` interfaces.

## Type Strategy
TypeScript types were created by strictly inspecting the actual output of `GET /api/v1/portfolios`. We do not reinvent properties or attempt to perform financial logic on the client. 
- Nullable Market Values: `currentMarketPrice`, `presentValue`, and `gainLoss` are correctly mapped as `number | null` to represent missing real-time data explicitly.

## Environment Variables
The Next.js client uses `NEXT_PUBLIC_API_BASE_URL` to know where the backend resides. For local development, this defaults to `http://localhost:8080`.

## Loading / Error / Empty States
- **Loading:** Implemented via `loading.tsx` to display a spinner and pulsing text, preventing the app from appearing broken.
- **Error:** Implemented via `error.tsx` (Client Component) to gracefully catch any API failures (e.g., connection refused) and display an actionable "Try again" screen.
- **Empty State:** `page.tsx` checks if the portfolio array is empty and explicitly renders a clean empty state rather than crashing on missing fields.

## Financial Formatting
`src/lib/formatters.ts` handles all display formatting using `Intl.NumberFormat`.
- Uses the `en-IN` locale to format currencies with standard Indian comma placement.
- Null fallback handles missing market data gracefully by rendering `—` instead of fake values like `0`.

## Backend Integration
The dashboard successfully mounts and fetches the calculated holdings and sector aggregations from the backend without re-calculating them. 

## Future 15-Second Refresh Strategy
While `page.tsx` is currently a Server Component fetching initial data statically (or dynamically on request), the Phase 13/14 polling requirement can be achieved by:
1. Moving the table rendering into a new Client Component (e.g., `<PortfolioTable />`).
2. Allowing the Client Component to poll `PortfolioService.getPortfolios()` via SWR, React Query, or `useEffect` intervals.
3. Keeping the shell (Header, Layout, etc.) as Server Components. 
This hybrid architecture preserves SEO/fast initial load while seamlessly supporting periodic client hydration.
