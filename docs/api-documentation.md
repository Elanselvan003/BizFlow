# BizFlow REST API Documentation

Base URL (Local): `http://localhost:8787/api`  
Base URL (Production): `https://bizflow-api.workers.dev/api`

All protected endpoints require an HTTP header:
```http
Authorization: Bearer <jwt_token>
```

---

## 1. Authentication (`/api/auth`)

### Register Account
- **Endpoint**: `POST /api/auth/register`
- **Request Body**:
  ```json
  {
    "full_name": "Jane Doe",
    "business_name": "Doe Enterprise Consulting",
    "email": "jane@doe.com",
    "password": "Password123!"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOi...",
      "user": { "id": "usr_...", "email": "jane@doe.com", "full_name": "Jane Doe", "role": "owner" },
      "settings": { "id": "bs_...", "business_name": "Doe Enterprise Consulting", "currency": "USD" }
    }
  }
  ```

### Login
- **Endpoint**: `POST /api/auth/login`
- **Request Body**:
  ```json
  {
    "email": "demo@bizflow.app",
    "password": "Admin123!"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOi...",
      "user": { "id": "usr_demo_01", "email": "demo@bizflow.app", "full_name": "Alex Morgan", "role": "owner" },
      "settings": { ... }
    }
  }
  ```

### Profile & Session
- **Endpoint**: `GET /api/auth/me`
- **Response** (`200 OK`): Current user profile and business settings.

---

## 2. Dashboard (`/api/dashboard`)

### Dashboard Key Performance Stats
- **Endpoint**: `GET /api/dashboard/stats`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "total_customers": 5,
      "total_bookings": 6,
      "total_revenue_cents": 54250,
      "pending_invoices_count": 3,
      "pending_invoices_amount_cents": 122063,
      "booking_status_counts": {
        "pending": 1,
        "confirmed": 2,
        "completed": 2,
        "cancelled": 1
      }
    }
  }
  ```

### Monthly Revenue Trajectory
- **Endpoint**: `GET /api/dashboard/revenue`
- **Response** (`200 OK`): Monthly collected revenue and invoiced totals for time-series charts.

### Recent Activity
- **Endpoint**: `GET /api/dashboard/recent-activity`
- **Response** (`200 OK`): Recent 5 bookings and recent 5 invoices with customer details.

---

## 3. Customers (`/api/customers`)

### List Customers
- **Endpoint**: `GET /api/customers?page=1&limit=10&search=Sarah&status=active`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "cust_01",
        "name": "Sarah Connor",
        "email": "sarah.c@techcorp.io",
        "company": "TechCorp Dynamics",
        "phone": "+1 (555) 201-4491",
        "status": "active",
        "booking_count": 1,
        "total_invoiced_cents": 37975
      }
    ],
    "meta": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
  }
  ```

### Customer Details
- **Endpoint**: `GET /api/customers/:id`
- **Response** (`200 OK`): Customer details with full appointment and invoice history.

### Create Customer
- **Endpoint**: `POST /api/customers`
- **Request Body**: `{ "name": "...", "email": "...", "phone": "...", "company": "...", "status": "active" }`
- **Response** (`201 Created`): Created customer object.

### Update Customer
- **Endpoint**: `PUT /api/customers/:id`
- **Response** (`200 OK`): Updated customer record.

### Delete Customer
- **Endpoint**: `DELETE /api/customers/:id`
- **Response** (`200 OK`): Confirmation or error if dependent records exist.

---

## 4. Services (`/api/services`)

- `GET /api/services`: List services (optional `?active=true`).
- `GET /api/services/:id`: Single service.
- `POST /api/services`: Create service with `name`, `description`, `price_cents`, `duration_minutes`, `is_active`.
- `PUT /api/services/:id`: Update service.
- `DELETE /api/services/:id`: Delete service (guarded against active bookings).

---

## 5. Bookings (`/api/bookings`)

- `GET /api/bookings?status=confirmed&date=2026-10-20`: List bookings.
- `GET /api/bookings/:id`: Booking details.
- `POST /api/bookings`: Create booking (`customer_id`, `service_id`, `booking_date`, `start_time`, `duration_minutes`, `total_amount_cents`).
- `PUT /api/bookings/:id`: Update booking date, time, status, notes.
- `DELETE /api/bookings/:id`: Cancel / delete booking.

---

## 6. Invoices & Payments (`/api/invoices`)

- `GET /api/invoices?status=pending`: List invoices.
- `GET /api/invoices/:id`: Full invoice with line items, payments, and business details.
- `POST /api/invoices`: Create invoice with line items:
  ```json
  {
    "customer_id": "cust_01",
    "issue_date": "2026-10-14",
    "due_date": "2026-10-28",
    "discount_cents": 0,
    "tax_rate": 8.5,
    "items": [
      { "description": "Consulting Session", "quantity": 1, "unit_price_cents": 15000 }
    ]
  }
  ```
- `POST /api/invoices/:id/payments`: Record a payment:
  ```json
  {
    "amount_cents": 15000,
    "payment_method": "credit_card",
    "payment_date": "2026-10-14",
    "notes": "Card ending in 4242"
  }
  ```

---

## 7. Reports & Settings

- `GET /api/reports/revenue?period=30d`: Collections timeline, invoiced totals, payment method distribution.
- `GET /api/reports/bookings?period=30d`: Appointment completion rate and service volume.
- `GET /api/reports/customers`: Customer lifetime value and revenue rankings.
- `GET /api/settings`: Business settings.
- `PUT /api/settings`: Update settings.
- `PUT /api/settings/profile`: Update user name, email, and password.
