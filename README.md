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
