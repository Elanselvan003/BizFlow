# BizFlow — Business Management System

> Professional, full-stack SaaS business operations platform built with **Angular 22**, **Cloudflare Workers**, **Cloudflare D1**, and **Apache ECharts**.

[![Angular 22](https://img.shields.io/badge/Angular-22-dd0031.svg?logo=angular)](https://angular.dev)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020.svg?logo=cloudflare)](https://workers.cloudflare.com)
[![Cloudflare D1](https://img.shields.io/badge/Database-Cloudflare%20D1%20(SQLite)-2563eb.svg)](https://developers.cloudflare.com/d1/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Mode-3178C6.svg?logo=typescript)](https://www.typescriptlang.org)
[![Apache ECharts](https://img.shields.io/badge/Analytics-Apache%20ECharts-AA344D.svg)](https://echarts.apache.org)

---

## 👨‍💻 Author & Engineering

- **Lead Full-Stack Engineer**: **Elanselvan**
- **Email**: [elanselvan1997@gmail.com](mailto:elanselvan1997@gmail.com)
- **Repository**: [https://github.com/Elanselvan003/BizFlow](https://github.com/Elanselvan003/BizFlow)

---

## 🚀 Live Demo & Testing

For freelance client and employer review, BizFlow includes pre-seeded demonstration data:

- **Demo Owner Account**: `elanselvan1997@gmail.com`
- **Demo Password**: `Admin123!`
- *(Or simply click the **"Quick Fill Demo"** button on the login screen for 1-click access)*

---

## ✨ Features

- **Executive Analytics Dashboard**:
  - Live database-calculated metrics: Total Customers, Total Bookings, Collected Revenue, and Pending Invoices.
  - Interactive **Revenue Trajectory** area chart comparing invoiced amounts against cash collected.
  - Interactive **Appointment Status** donut distribution chart.
  - Recent appointments and invoices tables with status tags.
- **Customer CRM**:
  - Full client directory with search by name, email, or company.
  - Status filtering (`Active` vs `Inactive`) and pagination.
  - Add, edit, and delete clients with safe dependency enforcement.
  - Comprehensive customer detail modal displaying complete booking and invoicing histories.
- **Services & Pricing Catalog**:
  - Configurable service packages with duration (minutes) and rate in currency.
  - Active/Archived toggling to prevent scheduling deprecated services.
- **Bookings & Appointments**:
  - Scheduling modal linked to active customers and services.
  - Automatic duration and fee populating with override capabilities.
  - Lifecycle state machine: `Pending`, `Confirmed`, `Completed`, `Cancelled`.
  - Date filtering and status tab switching.
- **Invoices & Billing**:
  - Statement generation with auto-assigned invoice numbers (`INV-YYYY-XXXX`).
  - Dynamic multi-line items (service selector, quantity, unit price, and item totals).
  - Accurate calculation of subtotal, discount, tax rate, and final balance.
  - **Payment Recording**: Partial or full payment settlement with automatic transition to `Paid`.
  - Print-friendly invoice view (`window.print()` / PDF export).
- **Financial & Operational Reports**:
  - Date filtering (7 Days, 30 Days, 90 Days, 1 Year).
  - Cash collections timeline bar chart.
  - Payment gateway/method distribution breakdown.
  - Booking completion ratios and top client rankings.
- **Settings & Profile**:
  - Business profile configuration: Trading name, contact details, currency symbol, timezone, tax rate.
  - Owner profile: Full name, email, and password changes with current password verification.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Angular 22, TypeScript (strict), Standalone Components, Angular Signals, Reactive Forms, SCSS Design System, Apache ECharts |
| **Backend** | Cloudflare Workers, Hono Web Framework, TypeScript, Web Crypto API (PBKDF2 & HMAC-SHA256) |
| **Database** | Cloudflare D1 (Serverless SQLite), Parameterized SQL, Versioned Migrations, Foreign Keys & Indexes |
| **Testing** | Vitest, Angular Testing Library, Chrome DevTools Browser Testing |
| **Monorepo** | Clean structure separating `frontend/`, `backend/`, and `docs/` |

---

## 📐 Monetary Precision Architecture

To completely prevent floating-point rounding inaccuracies (e.g. `0.1 + 0.2 != 0.3`), **all currency values are stored as integer minor units (cents)** in SQLite and API payloads. Calculations (subtotal, tax percentages, payments, balances) use integer math before being formatted via `MoneyPipe` into formatted currency strings.

---

## 💻 Local Development Setup

### 1. Clone & Prerequisites
Ensure Node.js 20+ and npm are installed:
```bash
node -v
npm -v
```

### 2. Backend Setup
```bash
cd backend
npm install

# Run automated tests
npm test

# Apply local D1 database schema and demo seed data
npm run d1:migrate:local

# Start the Cloudflare Workers API locally (port 8787)
npm run dev
```

### 3. Frontend Setup
In a new terminal:
```bash
cd frontend
npm install

# Run automated tests
npm test -- --watch=false

# Start the Angular development server (port 4200)
npm start
```
Open **`http://localhost:4200`** in your browser.

---

## 🧪 Testing Summary

- **Backend Tests (`backend/tests/api.test.ts`)**:
  - 13/13 passing tests covering PBKDF2 hashing, JWT signing/verifying, runtime input validators, and integer invoice arithmetic.
- **Frontend Tests (`frontend/src/app/*.spec.ts`)**:
  - 7/7 passing tests covering component creation, MoneyPipe currency conversion, and reactive notification signals.
- **Production Build**:
  - Angular production compilation (`npm run build`) generates optimized bundles with zero budget warnings.

---

## 🚢 Deployment Guide

See [`docs/deployment-guide.md`](file:///Users/apple/Documents/Business/BizFlow/docs/deployment-guide.md) for full Cloudflare deployment instructions:
- **API**: `npx wrangler deploy` to Cloudflare Workers.
- **Database**: `npx wrangler d1 migrations apply bizflow-db --remote`.
- **Frontend**: `npx wrangler pages deploy dist/frontend/browser` to Cloudflare Pages.

---

## 📚 Documentation Reference

- [Architecture & Design Decisions](docs/architecture.md)
- [REST API Specification](docs/api-documentation.md)
- [Database Schema & Migrations](docs/database-schema.md)
- [Cloudflare Deployment Guide](docs/deployment-guide.md)
- [Automated Testing Guide](docs/testing-guide.md)

---

## 🔒 Security & Tenant Isolation

- **Zero Plain-Text Passwords**: Passwords hashed with PBKDF2 (SHA-256) and unique 16-byte random salts.
- **Stateless Tokens**: JWTs signed via HMAC-SHA256 with 7-day expiration.
- **Row-Level Tenant Isolation**: Every database query strictly filters by `user_id = ?`, preventing cross-account data leakage.
- **Strict Parameterized Queries**: All D1 database queries use parameterized prepared statements against SQL injection.
- **Protected Secrets**: Secrets (`JWT_SECRET`) are stored in `.dev.vars` (ignored by Git) and Cloudflare secret storage.
