-- BizFlow Database Seed Data 0002: Seed Demonstration Records
-- Demo User: elanselvan1997@gmail.com / Admin123!
INSERT OR IGNORE INTO users (id, email, password_hash, salt, full_name, role, created_at, updated_at)
VALUES (
  'usr_demo_01',
  'elanselvan1997@gmail.com',
  '13e8dcba74014cc6245c308501d13b4cc0c8b9968a55d5802f09e207a04a024c',
  '0123456789abcdef0123456789abcdef',
  'Elanselvan',
  'owner',
  datetime('now', '-30 days'),
  datetime('now', '-30 days')
);

-- Business Settings
INSERT OR IGNORE INTO business_settings (
  id, user_id, business_name, email, phone, address, currency, currency_symbol, timezone, tax_rate, invoice_prefix, created_at, updated_at
) VALUES (
  'bs_demo_01',
  'usr_demo_01',
  'BizFlow — Elanselvan Consulting',
  'elanselvan1997@gmail.com',
  '+1 (555) 349-2810',
  '100 Innovation Way, Suite 400, San Francisco, CA 94107',
  'INR',
  '₹',
  'Asia/Kolkata',
  8.5,
  'INV-',
  datetime('now', '-30 days'),
  datetime('now', '-30 days')
);

-- Customers
INSERT OR IGNORE INTO customers (id, user_id, name, email, phone, company, address, notes, status, created_at, updated_at)
VALUES
('cust_01', 'usr_demo_01', 'Sarah Connor', 'sarah.c@techcorp.io', '+1 (555) 201-4491', 'TechCorp Dynamics', '742 Evergreen Terrace, San Francisco, CA', 'Key enterprise client. Prefers quarterly workflow audits.', 'active', datetime('now', '-25 days'), datetime('now', '-25 days')),
('cust_02', 'usr_demo_01', 'Marcus Vance', 'marcus@nexuslabs.co', '+1 (555) 304-9921', 'Nexus Innovations', '120 Market St, Austin, TX', 'Interested in expanding SaaS integration.', 'active', datetime('now', '-20 days'), datetime('now', '-20 days')),
('cust_03', 'usr_demo_01', 'Elena Rostova', 'elena@stellarcreative.art', '+1 (555) 441-8832', 'Stellar Creative Studio', '89 Broadway Ave, New York, NY', 'High-priority creative agency lead.', 'active', datetime('now', '-18 days'), datetime('now', '-18 days')),
('cust_04', 'usr_demo_01', 'Dr. David Kim', 'dkim@horizonhealth.org', '+1 (555) 672-1144', 'Horizon Health Clinic', '500 Medical Plaza, Chicago, IL', 'Bi-weekly operations consulting contract.', 'active', datetime('now', '-15 days'), datetime('now', '-15 days')),
('cust_05', 'usr_demo_01', 'Rachel Green', 'rachel@apexretail.com', '+1 (555) 902-3371', 'Apex Retailers', '310 Ocean Blvd, Seattle, WA', 'Retail inventory management project.', 'active', datetime('now', '-10 days'), datetime('now', '-10 days'));

-- Services
INSERT OR IGNORE INTO services (id, user_id, name, description, price_cents, duration_minutes, is_active, created_at, updated_at)
VALUES
('srv_01', 'usr_demo_01', 'Business Process Consulting', 'Comprehensive analysis of existing business workflows and bottlenecks.', 15000, 60, 1, datetime('now', '-30 days'), datetime('now', '-30 days')),
('srv_02', 'usr_demo_01', 'Workflow Automation Setup', 'End-to-end configuration and API integration for automated task pipelines.', 35000, 120, 1, datetime('now', '-30 days'), datetime('now', '-30 days')),
('srv_03', 'usr_demo_01', 'Financial Health Audit', 'Deep dive into revenue streams, cost structures, and margins.', 50000, 180, 1, datetime('now', '-30 days'), datetime('now', '-30 days')),
('srv_04', 'usr_demo_01', 'SaaS Architecture Advisory', 'Technical and architectural consultation for cloud scalability.', 25000, 90, 1, datetime('now', '-30 days'), datetime('now', '-30 days')),
('srv_05', 'usr_demo_01', 'Team Operations Workshop', 'Interactive multi-stakeholder workshop for productivity alignment.', 80000, 240, 1, datetime('now', '-30 days'), datetime('now', '-30 days'));

-- Bookings
INSERT OR IGNORE INTO bookings (id, user_id, customer_id, service_id, booking_date, start_time, duration_minutes, status, total_amount_cents, notes, created_at, updated_at)
VALUES
('bk_01', 'usr_demo_01', 'cust_01', 'srv_02', date('now', '-12 days'), '10:00', 120, 'completed', 35000, 'Initial workflow setup sprint', datetime('now', '-14 days'), datetime('now', '-12 days')),
('bk_02', 'usr_demo_01', 'cust_02', 'srv_01', date('now', '-8 days'), '14:30', 60, 'completed', 15000, 'Quarterly sync & process review', datetime('now', '-10 days'), datetime('now', '-8 days')),
('bk_03', 'usr_demo_01', 'cust_03', 'srv_04', date('now', '+2 days'), '11:00', 90, 'confirmed', 25000, 'SaaS design review', datetime('now', '-5 days'), datetime('now', '-5 days')),
('bk_04', 'usr_demo_01', 'cust_04', 'srv_03', date('now', '+5 days'), '09:00', 180, 'confirmed', 50000, 'Financial audit session part 1', datetime('now', '-3 days'), datetime('now', '-3 days')),
('bk_05', 'usr_demo_01', 'cust_05', 'srv_01', date('now', '+7 days'), '16:00', 60, 'pending', 15000, 'Initial discovery call', datetime('now', '-1 days'), datetime('now', '-1 days')),
('bk_06', 'usr_demo_01', 'cust_02', 'srv_05', date('now', '-2 days'), '13:00', 240, 'cancelled', 80000, 'Rescheduled to next month upon client request', datetime('now', '-6 days'), datetime('now', '-2 days'));

-- Invoices
INSERT OR IGNORE INTO invoices (
  id, user_id, customer_id, booking_id, invoice_number, issue_date, due_date, status, subtotal_cents, discount_cents, tax_rate, tax_cents, total_cents, paid_cents, notes, created_at, updated_at
) VALUES
('inv_01', 'usr_demo_01', 'cust_01', 'bk_01', 'INV-2026-001', date('now', '-12 days'), date('now', '+2 days'), 'paid', 35000, 0, 8.5, 2975, 37975, 37975, 'Thank you for your business!', datetime('now', '-12 days'), datetime('now', '-10 days')),
('inv_02', 'usr_demo_01', 'cust_02', 'bk_02', 'INV-2026-002', date('now', '-8 days'), date('now', '+6 days'), 'paid', 15000, 0, 8.5, 1275, 16275, 16275, 'Quarterly consulting invoice', datetime('now', '-8 days'), datetime('now', '-7 days')),
('inv_03', 'usr_demo_01', 'cust_03', 'bk_03', 'INV-2026-003', date('now', '-4 days'), date('now', '+10 days'), 'pending', 25000, 2500, 8.5, 1913, 24413, 0, 'SaaS Advisory retainer (10% discount applied)', datetime('now', '-4 days'), datetime('now', '-4 days')),
('inv_04', 'usr_demo_01', 'cust_04', 'bk_04', 'INV-2026-004', date('now', '-15 days'), date('now', '-1 days'), 'overdue', 50000, 0, 8.5, 4250, 54250, 0, 'Financial Health Audit part 1', datetime('now', '-15 days'), datetime('now', '-15 days')),
('inv_05', 'usr_demo_01', 'cust_05', NULL, 'INV-2026-005', date('now', '-1 days'), date('now', '+14 days'), 'pending', 40000, 0, 8.5, 3400, 43400, 0, 'Retail System scoping retainer', datetime('now', '-1 days'), datetime('now', '-1 days'));

-- Invoice Items
INSERT OR IGNORE INTO invoice_items (id, invoice_id, service_id, description, quantity, unit_price_cents, total_cents)
VALUES
('item_01', 'inv_01', 'srv_02', 'Workflow Automation Setup', 1, 35000, 35000),
('item_02', 'inv_02', 'srv_01', 'Business Process Consulting', 1, 15000, 15000),
('item_03', 'inv_03', 'srv_04', 'SaaS Architecture Advisory', 1, 25000, 25000),
('item_04', 'inv_04', 'srv_03', 'Financial Health Audit', 1, 50000, 50000),
('item_05', 'inv_05', 'srv_01', 'Business Process Consulting (Phase 1)', 2, 15000, 30000),
('item_06', 'inv_05', NULL, 'Custom Integration Architecture Assessment', 1, 10000, 10000);

-- Payments
INSERT OR IGNORE INTO payments (id, user_id, invoice_id, amount_cents, payment_date, payment_method, notes, created_at)
VALUES
('pay_01', 'usr_demo_01', 'inv_01', 37975, date('now', '-10 days'), 'stripe', 'Full payment via Stripe checkout', datetime('now', '-10 days')),
('pay_02', 'usr_demo_01', 'inv_02', 16275, date('now', '-7 days'), 'bank_transfer', 'Wire transfer reference #WT-9921', datetime('now', '-7 days'));
