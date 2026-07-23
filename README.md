# Dynamic Portfolio Dashboard

## Overview

## Business Domain
The core business domain isolates user-generated historical data (Transactions/Portfolios) from volatile market data (Live Prices/Fundamentals). The backend acts as the single source of truth for all financial math, fetching historical ledgers from PostgreSQL, merging them with live data from Yahoo and Google Finance, and delivering calculated holdings (Total Value, P/L) to the Next.js frontend, which manages a 15-second polling interval for real-time dashboard updates. For a complete entity relationship and request flow breakdown, refer to [Domain Model](docs/domain-model.md).

## Architecture & Tech Stack

## Prerequisites

## Local Development Setup

### 1. Environment Variables

### 2. Database Setup (Docker/Neon)

### 3. Running the Backend

### 4. Running the Frontend

## Project Structure

## Database Migrations

## Testing

## Deployment

## API Documentation

## Domain Model
See the Business Domain Diagram, entities, attributes, and data classifications located in the [Domain Model documentation](docs/domain-model.md).

## Business Rules
See the [Business Rules & Validation](docs/business-rules.md) document for a complete list of mathematical formulas (e.g., Present Value, Gain/Loss, Portfolio Percentage) and data validation constraints (e.g., Quantity, Purchase Price).

## Request Lifecycle
See the [Request Flow](docs/request-flow.md) document for a detailed breakdown of how a browser request traverses Next.js, Express, the Cache, PostgreSQL, Yahoo Finance, and Google Finance, including sequence diagrams.

## Deployment Architecture
See the [Deployment Architecture](docs/deployment-architecture.md) document for infrastructure mapping across Vercel, Render, and Neon, including architectural diagrams.

## Database Design & ERD
See the [Database Design](docs/database-design.md) document for a complete PostgreSQL schema, including normalization rules, column data types, constraints (indexes, foreign keys, checks), and the Mermaid Entity Relationship Diagram.

## Database Migration Strategy
We utilize Neon PostgreSQL's branching features alongside Prisma (or standard SQL migrations) to ensure zero-downtime schema evolution. See the [Database Design](docs/database-design.md) document for architectural principles regarding volatile data.

## Seed Data Strategy
See the Seed Data Strategy section in the [Database Design](docs/database-design.md) document for instructions on parsing, normalizing, and inserting the initial Excel portfolio spreadsheet into the relational schema.

## Database Infrastructure

### Prisma
This project uses **Prisma ORM** for type-safe database access. The schema is located at `apps/backend/prisma/schema.prisma`. 
To interact with the database visually, run `npm run db:studio` from the `apps/backend` directory.

### Migrations
Database migrations are tracked in `apps/backend/prisma/migrations`. 
The initial migration (`20260723120000_init`) contains all tables, indexes, cascading foreign keys, and manual `CHECK` constraints (e.g., `quantity > 0`).
To apply migrations to your local database, run `npm run db:migrate`.

### Seeding
A seed script is provided at `apps/backend/prisma/seed.ts` to implement the Excel import strategy. It parses dummy Excel data, normalizes sector names into the `sectors` lookup table, initializes a default user and portfolio, and executes `UPSERT` operations to ensure idempotent seeding.
Run `npm run db:seed` to execute it.

### Local Development (PostgreSQL)
For local development, it is recommended to run PostgreSQL via Docker:
```bash
docker run --name portfolio-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
```
Set your `.env` file in `apps/backend` to:
`DATABASE_URL="postgresql://postgres:postgres@localhost:5432/portfolio_db?schema=public"`

### Production Database (Neon PostgreSQL)
For production and staging, the app connects to **Neon PostgreSQL** (Serverless).
1. Create a project in the Neon Console.
2. Obtain the pooled connection string (with `?sslmode=require`).
3. Set it as the `DATABASE_URL` environment variable in your Render dashboard.
Neon's branching feature seamlessly integrates with Prisma migrations, allowing you to create a separate database branch for feature testing before pushing migrations to the main production branch.

## Backend Architecture
See the [Backend Foundation](docs/backend-foundation.md) document for a detailed explanation of Express middleware ordering, Zod configuration validation, and architectural principles.

## Environment Variables
The backend uses **Zod** for strict runtime environment variable validation. If any variable in `.env` is missing or invalid, the process will crash immediately upon startup.
Required variables: `NODE_ENV`, `PORT`, `DATABASE_URL`, `FRONTEND_URL`, `LOG_LEVEL`.

## Database Connection
A single Prisma instance is centrally managed at `apps/backend/src/db/prisma.ts`. It securely connects to the PostgreSQL instance via the validated `DATABASE_URL`.

## Running the Backend
From the `apps/backend` directory:
- **Development**: Run `npm run dev` (starts `tsx watch`).
- **Production Build**: Run `npm run build` followed by `npm run start`.
- **Type Checking**: Run `npm run typecheck` to strictly verify TypeScript integrity without emitting files.

## Health Check
The backend exposes `GET /api/v1/health` for deployment monitoring and local verification. It returns a structured JSON payload containing the service name, timestamp, and a lightweight database connectivity check.

## Error Handling
The application uses a global error handler middleware. Known operational errors utilize the `AppError` class (e.g., `NotFoundError`), returning structured JSON. Unexpected server errors return a standard `500` response without leaking stack traces in production. `express-async-errors` is used to prevent the need for manual `try/catch` wrapping on async controllers.

## Logging
Structured JSON logging is implemented using **Pino** and **pino-http**. In development, logs are automatically formatted using `pino-pretty`. HTTP request logs automatically ignore high-frequency pings like the health endpoint to prevent noise.

## Current Implementation Status
The core database schema, Express backend foundation, and Read-Only Portfolio API are implemented and tested. External live enrichment (Yahoo/Google Finance) and the Excel parser are intentionally omitted.

## Portfolio Module API
The Portfolio Persistence API allows strictly-typed access to persisted `users`, `portfolios`, `sectors`, and `holdings`.
- `GET /api/v1/portfolios` - Fetch all portfolios and holdings.
- `GET /api/v1/portfolios/:portfolioId` - Fetch a portfolio by its UUID.
- `GET /api/v1/portfolios/:portfolioId/holdings` - Fetch holdings associated with a portfolio.

For detailed architecture, serialization of `Decimal` types, and the Excel import specification, read the [Portfolio Module Documentation](docs/portfolio-module.md).
