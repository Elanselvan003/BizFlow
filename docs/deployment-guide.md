# BizFlow Deployment Guide

This guide describes how to deploy BizFlow to the Cloudflare ecosystem using the **free-tier compatible** services:
- **Frontend**: Cloudflare Pages / Static Assets
- **Backend**: Cloudflare Workers
- **Database**: Cloudflare D1

---

## 1. Prerequisites

1. Cloudflare account with active credentials.
2. Node.js 20+ and npm installed.
3. Wrangler CLI authenticated:
   ```bash
   npx wrangler login
   ```
   Verify authentication via:
   ```bash
   npx wrangler whoami
   ```

---

## 2. Backend & D1 Database Deployment

### Step A: Provision the Remote D1 Database
Execute:
```bash
cd backend
npx wrangler d1 create bizflow-db
```
Wrangler will output the unique database ID:
```
[[d1_databases]]
binding = "DB"
database_name = "bizflow-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### Step B: Update `wrangler.jsonc`
Replace the placeholder `database_id` in `backend/wrangler.jsonc` with your assigned D1 database ID.

### Step C: Apply Remote Database Migrations
Apply the initial schema and seed demonstration records to the remote database:
```bash
npx wrangler d1 migrations apply bizflow-db --remote
```

### Step D: Set Cloudflare Worker Production Secrets
Configure production secrets using Wrangler's secret-management vault:
```bash
npx wrangler secret put JWT_SECRET
# Enter a secure, random string (min 32 characters)
```

### Step E: Deploy the Backend Worker
```bash
npx wrangler deploy
```
Wrangler will output your live API URL (e.g., `https://bizflow-api.<your-subdomain>.workers.dev`).

---

## 3. Frontend Deployment (Cloudflare Pages)

### Step A: Configure Production Environment
Open `frontend/src/environments/environment.production.ts` and set `apiUrl` to your deployed Worker API URL:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://bizflow-api.<your-subdomain>.workers.dev/api'
};
```

### Step B: Build Production Bundle
```bash
cd frontend
npm run build
```
The compiled SPA distribution is created at `frontend/dist/frontend/browser`.

### Step C: Deploy to Cloudflare Pages
```bash
npx wrangler pages deploy dist/frontend/browser --project-name=bizflow-app
```
Cloudflare Pages will assign a live URL (e.g. `https://bizflow-app.pages.dev`).

### Step D: Update CORS Configuration
In `backend/wrangler.jsonc`, update `FRONTEND_URL` to your production Pages URL:
```jsonc
"vars": {
  "ENVIRONMENT": "production",
  "FRONTEND_URL": "https://bizflow-app.pages.dev"
}
```
Redeploy the backend:
```bash
cd backend && npx wrangler deploy
```

---

## 4. Production Smoke Testing Checklist

1. **Health Check**: `curl https://bizflow-api.<subdomain>.workers.dev/api/health` -> verify status is `healthy`.
2. **Login**: Sign in with seeded admin credentials `demo@bizflow.app` / `Admin123!`.
3. **Dashboard**: Verify KPI cards and ECharts render database statistics.
4. **CRUD Flow**:
   - Create a new client in Customers.
   - Schedule an appointment in Bookings.
   - Create an invoice in Invoices.
   - Record a partial/full payment and observe status changes to `paid`.
   - Review updated reports in Reports & Insights.
