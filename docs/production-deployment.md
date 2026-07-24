# Production Deployment Guide

This guide outlines the production infrastructure preparation, deployment strategy, and manual cloud actions required to deploy the Dynamic Portfolio Dashboard across Vercel, Render, and Neon PostgreSQL.

## Architecture

*   **Frontend**: Next.js 14 hosted on **Vercel**.
*   **Backend**: Node.js/Express (Node 22+) hosted on **Render**.
*   **Database**: Serverless PostgreSQL hosted on **Neon**.

## Prerequisites

*   Node.js >= 22 (Required by `yahoo-finance2`).
*   Neon account & database.
*   Render account.
*   Vercel account linked to this Git repository.

---

## Part 1: Automated Repository Work Completed

The codebase has been successfully hardened and configured for deployment:
1.  **Prisma Migration Strategy**: The schema now includes `directUrl` alongside `url` to properly handle Neon's connection pooler during migrations. A new `db:deploy` script (`prisma migrate deploy`) was added to `apps/backend/package.json` for production CI/CD.
2.  **Node 22 Runtime**: Explicitly documented and configured in `apps/backend/package.json`.
3.  **CORS & Health Checks**: The backend dynamically allows CORS for `FRONTEND_URL` and exposes a `/api/v1/health` endpoint that pings the database.
4.  **Frontend URL Mapping**: The frontend is properly configured to resolve `NEXT_PUBLIC_API_BASE_URL`.

---

## Part 2: Manual Cloud Actions Required

Because cloud environment credentials are required to provision infrastructure, the following steps must be completed manually.

### Step 1: Configure Neon PostgreSQL
1.  Create a Neon project and PostgreSQL database.
2.  Obtain the **Pooled Connection String** (ends with `?sslmode=require&pgbouncer=true` if required, although Neon's native pooler doesn't strictly need the pgbouncer query string in Prisma 5+).
3.  Obtain the **Direct Connection String** (used for migrations).

### Step 2: Deploy Render Backend
1.  Create a new **Web Service** in Render attached to this repository.
2.  Set the **Root Directory** to: `apps/backend` (or leave root and use workspace commands).
3.  **Language**: Node
4.  **Node Version**: Ensure Render uses Node 22+ (Set `NODE_VERSION` environment variable to `22.x`).
5.  **Build Command**: `npm install && npm run db:deploy && npm run db:generate && npm run build`
6.  **Start Command**: `npm run start`
7.  **Environment Variables**:
    *   `NODE_ENV` = `production`
    *   `DATABASE_URL` = `<Neon Pooled Connection String>`
    *   `DIRECT_URL` = `<Neon Direct Connection String>`
    *   `FRONTEND_URL` = `<Your future Vercel domain>`
    *   `LOG_LEVEL` = `info`
8.  **Health Check Path**: `/api/v1/health`

### Step 3: Production Data Migration
Once the backend connects to Neon and runs `prisma migrate deploy` during the build step, you must import the historical Excel file into the Neon database.
*   **Action**: From your local machine with `DATABASE_URL` temporarily set to the Neon connection, run:
    `npm run data:import --workspace=backend`
*   **Verification**: Ensure the command succeeds and imports exactly 26 active holdings and ₹15,43,060 total investment. The import pipeline is idempotent.

### Step 4: Deploy Vercel Frontend
1.  Import the repository into Vercel.
2.  **Framework Preset**: Next.js
3.  **Root Directory**: `apps/frontend`
4.  **Build Command**: `npm run build`
5.  **Environment Variables**:
    *   `NEXT_PUBLIC_API_BASE_URL` = `<Your Render Backend HTTPS URL>`
6.  Deploy.

### Step 5: Final Configuration
1.  If the deployed Vercel domain differs from your initial `FRONTEND_URL` guess, update the `FRONTEND_URL` variable in the Render dashboard and trigger a backend restart to update CORS.
2.  Navigate to the Vercel domain in a real browser. Verify the Portfolio Summary, Sector Allocation Chart, and 26 active holdings populate.
