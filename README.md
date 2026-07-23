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

