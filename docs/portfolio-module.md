# Portfolio Module Architecture

## Module Responsibilities
The Portfolio Module is responsible for reading and serving persisted portfolio data from the PostgreSQL database. It isolates the physical database structure from the API layer, exposing a structured, predictable domain model. 
*Note: This module currently acts purely as a persistence read layer. Live market enrichment (e.g., live CMP, P/E, latest earnings) is intentionally omitted and will be implemented in a subsequent phase.*

## Request Flow
HTTP Request → Route (`portfolio.routes.ts`) → Controller (`portfolio.controller.ts`) → Service (`portfolio.service.ts`) → Repository (`portfolio.repository.ts`) → Prisma → PostgreSQL

## Architecture
- **Repository Layer**: Encapsulates all Prisma database queries. Prevents N+1 queries by using `include` correctly for relations (e.g., Holdings + Sectors).
- **Service Layer**: Coordinates business logic and enforces domain rules. It handles missing records by throwing `NotFoundError` and maps the raw Prisma models (with `Prisma.Decimal`) into strictly typed, serialized POJOs.
- **Controller Layer**: Handles HTTP concerns. Uses Zod for strict parameter validation before passing data into the service layer. Responds with `200 OK` on success.

## API Endpoints
- `GET /api/v1/portfolios` - Retrieves all portfolios and their holdings.
- `GET /api/v1/portfolios/:portfolioId` - Retrieves a specific portfolio by UUID.
- `GET /api/v1/portfolios/:portfolioId/holdings` - Retrieves just the holdings for a given portfolio UUID.

## Response Contracts
All successful responses are wrapped in a `{ success: true, data: T }` envelope.
```ts
export interface PortfolioResponse {
  id: string;
  name: string;
  createdAt: string;
  holdings?: HoldingResponse[];
}

export interface HoldingResponse {
  id: string;
  ticker: string;
  companyName: string;
  quantity: number; // Safely serialized from Prisma Decimal
  purchasePrice: number; // Safely serialized from Prisma Decimal
  sector: { id: string; name: string; };
}
```

## Validation & Error Behavior
- **Validation**: `portfolioId` parameters are strictly validated as UUIDs. Malformed UUIDs instantly return a 400 Bad Request via the Zod/AppError handler.
- **Not Found**: If a valid UUID does not exist, the Service throws a `NotFoundError`, resulting in a 404 response.
- **Database Interaction**: Completely read-only.

## Excel Import Strategy (Preparation)
Prior to implementation in the next phase, here is the mapping from the supplied Excel portfolio spreadsheet to the relational schema:

### Persisted Columns
- `Particulars` → `companyName` (String)
- `Purchase Price` → `purchasePrice` (Decimal, normalized to number for API)
- `Qty` → `quantity` (Decimal, normalized to number for API)
- `NSE/BSE` → `ticker` (String). (Note: Numeric BSE codes or NSE ticker symbols will be stored as the primary ticker identifier).
- `Sector group heading` → `sector` (Foreign key to `sectors` table).

### Calculated / External Columns (NOT Persisted)
The following columns are completely excluded from the physical database to avoid state synchronization issues, and will be joined dynamically at runtime:
- `Investment` (Quantity × Purchase Price)
- `Portfolio %` (Investment / Total Portfolio Investment)
- `CMP` (Current Market Price - Fetched via Yahoo Finance)
- `Present Value` (Quantity × CMP)
- `Gain/Loss` (Present Value - Investment)
- `Gain/Loss %` (Gain/Loss / Investment)
- `P/E` (Fetched via Google Finance)
- `Latest Earnings` (Fetched via Google Finance)
