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
