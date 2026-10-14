# BizFlow Database Schema & Migrations

BizFlow uses **Cloudflare D1**, a distributed serverless SQLite database with relational constraints and indexing.

---

## 1. Relational Entity Relationship Diagram

```
+---------------+        1:1       +-------------------+
|     users     | ---------------- | business_settings |
+---------------+                  +-------------------+
       | 1:N
       +-----------------------+--------------------+--------------------+
       |                       |                    |                    |
       v                       v                    v                    v
+--------------+        +--------------+     +--------------+     +--------------+
|  customers   |        |   services   |     |   bookings   |     |   invoices   |
+--------------+        +--------------+     +--------------+     +--------------+
       ^                       ^                    ^                    | 1:N
       |                       |                    |                    v
       +-----------------------|--------------------+           +----------------+
       |                       +------------------------------- | invoice_items  |
       |                                                        +----------------+
       |                                                                 |
       +-----------------------------------------------------------------+
                                                                         | 1:N
                                                                         v
                                                                +----------------+
                                                                |    payments    |
                                                                +----------------+
```

---

## 2. Table Specifications

### `users`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Unique user ID (`usr_...`) |
| `email` | TEXT | NOT NULL, UNIQUE | User login email |
| `password_hash`| TEXT | NOT NULL | PBKDF2 derived key (SHA-256) |
| `salt` | TEXT | NOT NULL | Unique 16-byte hex salt |
| `full_name` | TEXT | NOT NULL | Owner full name |
| `role` | TEXT | NOT NULL, DEFAULT 'owner' | Authorization role |
| `created_at` | TEXT | NOT NULL | ISO-8601 timestamp |
| `updated_at` | TEXT | NOT NULL | ISO-8601 timestamp |

### `business_settings`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Settings ID (`bs_...`) |
| `user_id` | TEXT | UNIQUE, FK -> users(id) ON DELETE CASCADE | Owner foreign key |
| `business_name`| TEXT | NOT NULL | Legal/trading entity name |
| `email` | TEXT | NULLABLE | Billing contact email |
| `phone` | TEXT | NULLABLE | Support telephone |
| `address` | TEXT | NULLABLE | Physical office address |
| `currency` | TEXT | NOT NULL, DEFAULT 'USD' | 3-letter currency code |
| `currency_symbol` | TEXT | NOT NULL, DEFAULT '$' | Symbol for receipts |
| `timezone` | TEXT | NOT NULL, DEFAULT 'America/New_York' | Operating timezone |
| `tax_rate` | REAL | NOT NULL, DEFAULT 8.5 | Default tax percentage |
| `invoice_prefix` | TEXT | NOT NULL, DEFAULT 'INV-' | Prefix for statements |

### `customers`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Customer ID (`cust_...`) |
| `user_id` | TEXT | NOT NULL, FK -> users(id) ON DELETE CASCADE | Tenant isolation key |
| `name` | TEXT | NOT NULL | Client contact or organization |
| `email` | TEXT | NULLABLE | Client email address |
| `phone` | TEXT | NULLABLE | Telephone number |
| `company` | TEXT | NULLABLE | Corporate affiliation |
| `address` | TEXT | NULLABLE | Mailing / billing address |
| `notes` | TEXT | NULLABLE | Internal account memo |
| `status` | TEXT | NOT NULL, CHECK(status IN ('active', 'inactive')) | Client state |

### `services`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Service ID (`srv_...`) |
| `user_id` | TEXT | NOT NULL, FK -> users(id) ON DELETE CASCADE | Tenant isolation key |
| `name` | TEXT | NOT NULL | Offering title |
| `description` | TEXT | NULLABLE | Service description |
| `price_cents` | INTEGER | NOT NULL, CHECK(price_cents >= 0) | Rate in integer cents |
| `duration_minutes` | INTEGER | NOT NULL, CHECK(duration_minutes > 0) | Duration in minutes |
| `is_active` | INTEGER | NOT NULL, CHECK(is_active IN (0, 1)) | Active status |

### `bookings`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Booking ID (`bk_...`) |
| `user_id` | TEXT | NOT NULL, FK -> users(id) ON DELETE CASCADE | Tenant isolation key |
| `customer_id` | TEXT | NOT NULL, FK -> customers(id) | Associated client |
| `service_id` | TEXT | NOT NULL, FK -> services(id) | Associated service |
| `booking_date`| TEXT | NOT NULL (YYYY-MM-DD) | Scheduled date |
| `start_time` | TEXT | NOT NULL (HH:MM) | Start time |
| `duration_minutes` | INTEGER | NOT NULL, CHECK(duration_minutes > 0) | Duration in minutes |
| `status` | TEXT | NOT NULL, CHECK(status IN ('pending', 'confirmed', 'completed', 'cancelled')) | Lifecycle status |
| `total_amount_cents` | INTEGER | NOT NULL, CHECK(total_amount_cents >= 0) | Booking fee in cents |
| `notes` | TEXT | NULLABLE | Agenda or meeting notes |

### `invoices`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Invoice ID (`inv_...`) |
| `user_id` | TEXT | NOT NULL, FK -> users(id) ON DELETE CASCADE | Tenant isolation key |
| `customer_id` | TEXT | NOT NULL, FK -> customers(id) | Client foreign key |
| `booking_id` | TEXT | NULLABLE, FK -> bookings(id) ON DELETE SET NULL | Optional linked appointment |
| `invoice_number` | TEXT | NOT NULL, UNIQUE | Human-readable statement number |
| `issue_date` | TEXT | NOT NULL (YYYY-MM-DD) | Date issued |
| `due_date` | TEXT | NOT NULL (YYYY-MM-DD) | Payment deadline |
| `status` | TEXT | NOT NULL, CHECK(status IN ('draft', 'pending', 'paid', 'overdue', 'cancelled')) | Invoice status |
| `subtotal_cents` | INTEGER | NOT NULL, CHECK(subtotal_cents >= 0) | Sum of items before tax |
| `discount_cents` | INTEGER | NOT NULL, CHECK(discount_cents >= 0) | Subtracted discount |
| `tax_rate` | REAL | NOT NULL, CHECK(tax_rate >= 0) | Applied tax % |
| `tax_cents` | INTEGER | NOT NULL, CHECK(tax_cents >= 0) | Computed tax in cents |
| `total_cents` | INTEGER | NOT NULL, CHECK(total_cents >= 0) | Final invoice total |
| `paid_cents` | INTEGER | NOT NULL, CHECK(paid_cents >= 0) | Recorded payments |
| `notes` | TEXT | NULLABLE | Payment notes |

### `invoice_items`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Line item ID (`item_...`) |
| `invoice_id` | TEXT | NOT NULL, FK -> invoices(id) ON DELETE CASCADE | Parent invoice |
| `service_id` | TEXT | NULLABLE, FK -> services(id) ON DELETE SET NULL | Optional linked service |
| `description` | TEXT | NOT NULL | Item description |
| `quantity` | INTEGER | NOT NULL, CHECK(quantity > 0) | Item quantity |
| `unit_price_cents`| INTEGER | NOT NULL, CHECK(unit_price_cents >= 0) | Unit price in cents |
| `total_cents` | INTEGER | NOT NULL, CHECK(total_cents >= 0) | `quantity * unit_price_cents` |

### `payments`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Payment ID (`pay_...`) |
| `user_id` | TEXT | NOT NULL, FK -> users(id) ON DELETE CASCADE | Tenant isolation key |
| `invoice_id` | TEXT | NOT NULL, FK -> invoices(id) ON DELETE CASCADE | Target invoice |
| `amount_cents` | INTEGER | NOT NULL, CHECK(amount_cents > 0) | Amount in cents |
| `payment_date` | TEXT | NOT NULL | Date paid |
| `payment_method` | TEXT | NOT NULL, CHECK(payment_method IN ('credit_card', 'bank_transfer', 'cash', 'stripe', 'other')) | Channel |
| `notes` | TEXT | NULLABLE | Reference or confirmation code |

---

## 3. Indexes for High Performance

- `idx_users_email` ON `users(email)`
- `idx_customers_user` ON `customers(user_id)`
- `idx_customers_user_name` ON `customers(user_id, name)`
- `idx_services_user` ON `services(user_id)`
- `idx_bookings_user_date` ON `bookings(user_id, booking_date)`
- `idx_bookings_status` ON `bookings(user_id, status)`
- `idx_invoices_user_status` ON `invoices(user_id, status)`
- `idx_invoices_number` ON `invoices(invoice_number)`
- `idx_invoice_items_invoice` ON `invoice_items(invoice_id)`
- `idx_payments_invoice` ON `payments(invoice_id)`
