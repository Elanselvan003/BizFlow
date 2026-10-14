import { Hono } from 'hono';
import { Bindings, Variables, Customer } from '../types';
import { generateId } from '../utils/id';
import { jsonSuccess, jsonError } from '../utils/response';
import { validateCustomerInput } from '../validators';
import { authMiddleware } from '../middleware/auth';

export const customersRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();
customersRouter.use('*', authMiddleware);

// List customers with pagination, search, status filter
customersRouter.get('/', async (c) => {
  const userId = c.get('userId');
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(c.req.query('limit') || '10', 10)));
  const offset = (page - 1) * limit;
  const search = c.req.query('search')?.trim() || '';
  const status = c.req.query('status')?.trim() || '';

  let countSql = 'SELECT COUNT(*) as count FROM customers WHERE user_id = ?';
  let dataSql = `
    SELECT 
      c.*,
      (SELECT COUNT(*) FROM bookings b WHERE b.customer_id = c.id) as booking_count,
      (SELECT COALESCE(SUM(i.total_cents), 0) FROM invoices i WHERE i.customer_id = c.id) as total_invoiced_cents
    FROM customers c
    WHERE c.user_id = ?
  `;
  const countBindings: any[] = [userId];
  const dataBindings: any[] = [userId];

  if (search) {
    const searchFilter = ' AND (name LIKE ? OR email LIKE ? OR company LIKE ?)';
    countSql += searchFilter;
    dataSql += searchFilter;
    const term = `%${search}%`;
    countBindings.push(term, term, term);
    dataBindings.push(term, term, term);
  }

  if (status && ['active', 'inactive'].includes(status)) {
    const statusFilter = ' AND status = ?';
    countSql += statusFilter;
    dataSql += statusFilter;
    countBindings.push(status);
    dataBindings.push(status);
  }

  dataSql += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
  dataBindings.push(limit, offset);

  const totalRes = await c.env.DB.prepare(countSql).bind(...countBindings).first<{ count: number }>();
  const total = totalRes?.count || 0;
  const totalPages = Math.ceil(total / limit);

  const customers = await c.env.DB.prepare(dataSql).bind(...dataBindings).all<Customer>();

  return jsonSuccess(c, customers.results || [], {
    page,
    limit,
    total,
    totalPages
  });
});

// Get single customer
customersRouter.get('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  const customer = await c.env.DB.prepare(
    'SELECT * FROM customers WHERE id = ? AND user_id = ?'
  ).bind(id, userId).first<Customer>();

  if (!customer) {
    return jsonError(c, 'Customer not found', 404);
  }

  // Get customer's recent bookings
  const bookings = await c.env.DB.prepare(
    `SELECT b.*, s.name as service_name 
     FROM bookings b
     JOIN services s ON b.service_id = s.id
     WHERE b.customer_id = ? AND b.user_id = ?
     ORDER BY b.booking_date DESC LIMIT 10`
  ).bind(id, userId).all();

  // Get customer's invoices
  const invoices = await c.env.DB.prepare(
    `SELECT * FROM invoices 
     WHERE customer_id = ? AND user_id = ?
     ORDER BY issue_date DESC LIMIT 10`
  ).bind(id, userId).all();

  return jsonSuccess(c, {
    ...customer,
    bookings: bookings.results || [],
    invoices: invoices.results || []
  });
});

// Create customer
customersRouter.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json().catch(() => null);
  const validation = validateCustomerInput(body);

  if (!validation.isValid) {
    return jsonError(c, validation.error || 'Invalid customer data', 400);
  }

  // Check duplicate email for this user if email provided
  if (body.email) {
    const existing = await c.env.DB.prepare(
      'SELECT id FROM customers WHERE user_id = ? AND LOWER(email) = LOWER(?)'
    ).bind(userId, body.email.trim()).first();

    if (existing) {
      return jsonError(c, 'A customer with this email address already exists', 409);
    }
  }

  const id = generateId('cust');
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    `INSERT INTO customers (id, user_id, name, email, phone, company, address, notes, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    userId,
    body.name.trim(),
    body.email?.trim() || null,
    body.phone?.trim() || null,
    body.company?.trim() || null,
    body.address?.trim() || null,
    body.notes?.trim() || null,
    body.status || 'active',
    now,
    now
  ).run();

  const created = await c.env.DB.prepare('SELECT * FROM customers WHERE id = ?').bind(id).first<Customer>();
  return jsonSuccess(c, created, undefined, 201);
});

// Update customer
customersRouter.put('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => null);
  const validation = validateCustomerInput(body);

  if (!validation.isValid) {
    return jsonError(c, validation.error || 'Invalid customer data', 400);
  }

  const existing = await c.env.DB.prepare(
    'SELECT id FROM customers WHERE id = ? AND user_id = ?'
  ).bind(id, userId).first();

  if (!existing) {
    return jsonError(c, 'Customer not found', 404);
  }

  // Check duplicate email
  if (body.email) {
    const dup = await c.env.DB.prepare(
      'SELECT id FROM customers WHERE user_id = ? AND LOWER(email) = LOWER(?) AND id != ?'
    ).bind(userId, body.email.trim(), id).first();

    if (dup) {
      return jsonError(c, 'Another customer with this email already exists', 409);
    }
  }

  const now = new Date().toISOString();
  await c.env.DB.prepare(
    `UPDATE customers 
     SET name = ?, email = ?, phone = ?, company = ?, address = ?, notes = ?, status = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`
  ).bind(
    body.name.trim(),
    body.email?.trim() || null,
    body.phone?.trim() || null,
    body.company?.trim() || null,
    body.address?.trim() || null,
    body.notes?.trim() || null,
    body.status || 'active',
    now,
    id,
    userId
  ).run();

  const updated = await c.env.DB.prepare('SELECT * FROM customers WHERE id = ?').bind(id).first<Customer>();
  return jsonSuccess(c, updated);
});

// Delete customer
customersRouter.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  const customer = await c.env.DB.prepare(
    'SELECT id FROM customers WHERE id = ? AND user_id = ?'
  ).bind(id, userId).first();

  if (!customer) {
    return jsonError(c, 'Customer not found', 404);
  }

  // Check if customer has associated invoices or bookings
  const bookingsCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM bookings WHERE customer_id = ?'
  ).bind(id).first<{ count: number }>();

  const invoicesCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM invoices WHERE customer_id = ?'
  ).bind(id).first<{ count: number }>();

  if ((bookingsCount?.count || 0) > 0 || (invoicesCount?.count || 0) > 0) {
    return jsonError(
      c,
      `Cannot delete customer with ${bookingsCount?.count || 0} booking(s) and ${invoicesCount?.count || 0} invoice(s). You can change status to inactive instead.`,
      400
    );
  }

  await c.env.DB.prepare(
    'DELETE FROM customers WHERE id = ? AND user_id = ?'
  ).bind(id, userId).run();

  return jsonSuccess(c, { message: 'Customer deleted successfully' });
});
