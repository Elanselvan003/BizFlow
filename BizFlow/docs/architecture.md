# BizFlow Architecture Documentation

## 1. System Overview

**BizFlow** is an enterprise-grade, modern SaaS business management system designed for independent professionals, consultants, and service-based enterprises. It consolidates appointment scheduling, client relationship management (CRM), service catalog configuration, invoicing with itemized line items, payment tracking, financial reporting, and administrative configuration into a unified architecture.

```
+-------------------------------------------------------------------------+
|                               BizFlow                                   |
|                                                                         |
|  +------------------------+             +----------------------------+  |
|  |     Angular 22 SPA     |             | Cloudflare Workers REST API|  |
|  |  (Standalone, Signals, |  HTTP / JSON|   (Hono Framework, Web     |  |
|  |   ECharts, SCSS, CDK)  | <=========> |     Crypto HMAC/PBKDF2)    |  |
|  +------------------------+             +----------------------------+  |
|                                                       ||                |
|                                            Parameterized SQL Queries    |
|                                                       ||                |
|                                                       \/                |
|                                         +----------------------------+  |
|                                         |     Cloudflare D1 (SQLite) |  |
|                                         |   Versioned SQL Migrations |  |
|                                         +----------------------------+  |
+-------------------------------------------------------------------------+
```

---

## 2. Frontend Architecture

- **Framework**: Angular 22 with TypeScript (strict type checking enabled).
- **Component Paradigm**: 100% Standalone Components without NgModules.
- **Change Detection & State**: Angular Signals (`signal`, `computed`, `update`) for reactive state management across services and components.
- **Routing**: Angular Router with lazy-loaded feature modules (`loadComponent: () => import(...)`) and functional route guards (`authGuard`).
- **HTTP Layer**: Angular `HttpClient` configured via `provideHttpClient(withInterceptors([authInterceptor]))` for centralized JWT token injection and 401 error interception.
- **Forms**: Angular Reactive Forms (`FormBuilder`, `FormGroup`, `FormArray`, `Validators`) for runtime input validation and dynamic line items.
- **Data Visualizations**: Apache ECharts natively integrated for responsive area charts, donut distributions, and timelines.
- **Design System**: Bespoke, modern SaaS design system implemented in Vanilla SCSS with curated CSS custom properties, responsive breakpoints, accessible focus states, glassmorphic modals, and dedicated print stylesheets.

---

## 3. Backend Architecture

- **Runtime**: Cloudflare Workers (V8 isolates execution environment).
- **API Framework**: Hono v4 — lightweight, zero-dependency, ultra-fast routing engine compatible with Workers.
- **Security & Cryptography**: Native Web Crypto API (`crypto.subtle`):
  - Password Hashing: PBKDF2 with SHA-256, 100,000 iterations, unique 16-byte random salts.
  - Token Management: HMAC-SHA256 (`HS256`) RFC 7519 JSON Web Tokens (7-day validity).
- **Tenant Isolation**: Strict row-level isolation on every database query (`WHERE user_id = ?`).
- **Validation**: Centralized, schema-validated request bodies with error messages and HTTP status codes (400, 401, 403, 404, 409, 422).
- **Error Handling**: Centralized `app.onError` handler ensuring consistent JSON error responses: `{ success: false, error: string }`.

---

## 4. Monetary Calculations & Precision

To eliminate floating-point rounding errors common in financial software (e.g. `0.1 + 0.2 === 0.30000000000000004`), BizFlow represents **all currency amounts as non-negative 64-bit integers in minor units (cents)** in both database storage and arithmetic operations:

$$\text{Subtotal Cents} = \sum (\text{Quantity} \times \text{Unit Price Cents})$$
$$\text{Taxable Cents} = \max(0, \text{Subtotal Cents} - \text{Discount Cents})$$
$$\text{Tax Cents} = \text{round}\left(\text{Taxable Cents} \times \frac{\text{Tax Rate}}{100}\right)$$
$$\text{Total Cents} = \text{Taxable Cents} + \text{Tax Cents}$$

Frontend presentation layers format cents via `MoneyPipe` into formatted currency strings (e.g. `$150.00`).
