import { Hono } from 'hono';
import { Bindings, Variables, Invoice, InvoiceItem, Payment, Customer, BusinessSettings } from '../types';
import { generateId } from '../utils/id';
import { jsonSuccess, jsonError } from '../utils/response';
import { validateInvoiceInput, validatePaymentInput } from '../validators';
import { authMiddleware } from '../middleware/auth';

export const invoicesRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();
invoicesRouter.use('*', authMiddleware);

// List invoices
invoicesRouter.get('/', async (c) => {
  const userId = c.get('userId');
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(c.req.query('limit') || '20', 10)));
  const offset = (page - 1) * limit;
  const status = c.req.query('status')?.trim() || '';
  const customerId = c.req.query('customerId')?.trim() || '';
  const search = c.req.query('search')?.trim() || '';

  let countSql = 'SELECT COUNT(*) as count FROM invoices WHERE user_id = ?';
  let dataSql = `
    SELECT 
      i.*,
      c.name as customer_name,
      c.email as customer_email,
      c.company as customer_company
    FROM invoices i
    JOIN customers c ON i.customer_id = c.id
    WHERE i.user_id = ?
  `;
  const countBindings: any[] = [userId];
  const dataBindings: any[] = [userId];

  if (status && ['draft', 'pending', 'paid', 'overdue', 'cancelled'].includes(status)) {
    const filter = ' AND i.status = ?';
    countSql += ' AND status = ?';
    dataSql += filter;
    countBindings.push(status);
    dataBindings.push(status);
  }

  if (customerId) {
    const filter = ' AND i.customer_id = ?';
    countSql += ' AND customer_id = ?';
    dataSql += filter;
    countBindings.push(customerId);
    dataBindings.push(customerId);
  }

  if (search) {
    const filter = ' AND (i.invoice_number LIKE ? OR c.name LIKE ?)';
    countSql += ' AND (invoice_number LIKE ? OR customer_id IN (SELECT id FROM customers WHERE name LIKE ?))';
    dataSql += filter;
    const term = `%${search}%`;
    countBindings.push(term, term);
    dataBindings.push(term, term);
  }

  dataSql += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
  dataBindings.push(limit, offset);

  const totalRes = await c.env.DB.prepare(countSql).bind(...countBindings).first<{ count: number }>();
  const total = totalRes?.count || 0;
  const totalPages = Math.ceil(total / limit);

  const invoices = await c.env.DB.prepare(dataSql).bind(...dataBindings).all<Invoice>();

  return jsonSuccess(c, invoices.results || [], {
    page,
    limit,
    total,
    totalPages
  });
});

// Get single invoice with items and payments
invoicesRouter.get('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  const invoice = await c.env.DB.prepare(
    `SELECT 
       i.*,
       c.name as customer_name,
       c.email as customer_email,
       c.phone as customer_phone,
       c.company as customer_company,
       c.address as customer_address
     FROM invoices i
     JOIN customers c ON i.customer_id = c.id
     WHERE i.id = ? AND i.user_id = ?`
  ).bind(id, userId).first<Invoice>();

  if (!invoice) {
    return jsonError(c, 'Invoice not found', 404);
  }

  // Fetch items
  const items = await c.env.DB.prepare(
    `SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY id ASC`
  ).bind(id).all<InvoiceItem>();

  // Fetch payments
  const payments = await c.env.DB.prepare(
    `SELECT * FROM payments WHERE invoice_id = ? ORDER BY payment_date DESC`
  ).bind(id).all<Payment>();

  // Fetch business settings for invoice header
  const settings = await c.env.DB.prepare(
    'SELECT * FROM business_settings WHERE user_id = ?'
  ).bind(userId).first<BusinessSettings>();

  return jsonSuccess(c, {
    ...invoice,
    items: items.results || [],
    payments: payments.results || [],
    business: settings
  });
});

// Create invoice
invoicesRouter.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json().catch(() => null);
  const validation = validateInvoiceInput(body);

  if (!validation.isValid) {
    return jsonError(c, validation.error || 'Invalid invoice data', 400);
  }

  // Check customer
  const customer = await c.env.DB.prepare(
    'SELECT id FROM customers WHERE id = ? AND user_id = ?'
  ).bind(body.customer_id, userId).first<Customer>();

  if (!customer) {
    return jsonError(c, 'Customer not found or unauthorized', 404);
  }

  // Calculate totals safely with integer cents
  let subtotal_cents = 0;
  const itemsWithTotals = body.items.map((item: any) => {
    const itemTotal = item.quantity * item.unit_price_cents;
    subtotal_cents += itemTotal;
    return {
      id: generateId('item'),
      service_id: item.service_id || null,
      description: item.description.trim(),
      quantity: item.quantity,
      unit_price_cents: item.unit_price_cents,
      total_cents: itemTotal
    };
  });

  const discount_cents = Math.max(0, parseInt(body.discount_cents || '0', 10));
  const taxable_amount = Math.max(0, subtotal_cents - discount_cents);
  const tax_rate = typeof body.tax_rate === 'number' ? Math.max(0, body.tax_rate) : 0.0;
  const tax_cents = Math.round(taxable_amount * (tax_rate / 100));
  const total_cents = taxable_amount + tax_cents;

  // Generate invoice number if not provided
  let invoice_number = body.invoice_number?.trim();
  if (!invoice_number) {
    const countRes = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM invoices WHERE user_id = ?'
    ).bind(userId).first<{ count: number }>();
    const nextNum = (countRes?.count || 0) + 1;
    const year = new Date().getFullYear();
    invoice_number = `INV-${year}-${String(nextNum).padStart(4, '0')}`;
  }

  // Check invoice number uniqueness
  const existingNum = await c.env.DB.prepare(
    'SELECT id FROM invoices WHERE invoice_number = ?'
  ).bind(invoice_number).first();

  if (existingNum) {
    return jsonError(c, `Invoice number ${invoice_number} is already in use`, 409);
  }

  const invoiceId = generateId('inv');
  const now = new Date().toISOString();

  // Insert invoice
  await c.env.DB.prepare(
    `INSERT INTO invoices (
       id, user_id, customer_id, booking_id, invoice_number, issue_date, due_date, status,
       subtotal_cents, discount_cents, tax_rate, tax_cents, total_cents, paid_cents, notes, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`
  ).bind(
    invoiceId,
    userId,
    body.customer_id,
    body.booking_id || null,
    invoice_number,
    body.issue_date,
    body.due_date,
    body.status || 'pending',
    subtotal_cents,
    discount_cents,
    tax_rate,
    tax_cents,
    total_cents,
    body.notes?.trim() || null,
    now,
    now
  ).run();

  // Insert line items
  for (const item of itemsWithTotals) {
    await c.env.DB.prepare(
      `INSERT INTO invoice_items (id, invoice_id, service_id, description, quantity, unit_price_cents, total_cents)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      item.id,
      invoiceId,
      item.service_id,
      item.description,
      item.quantity,
      item.unit_price_cents,
      item.total_cents
    ).run();
  }

  const created = await c.env.DB.prepare(
    `SELECT i.*, c.name as customer_name, c.email as customer_email
     FROM invoices i
     JOIN customers c ON i.customer_id = c.id
     WHERE i.id = ?`
  ).bind(invoiceId).first<Invoice>();

  return jsonSuccess(c, {
    ...created,
    items: itemsWithTotals
  }, undefined, 201);
});

// Update invoice
invoicesRouter.put('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => null);

  const existing = await c.env.DB.prepare(
    'SELECT * FROM invoices WHERE id = ? AND user_id = ?'
  ).bind(id, userId).first<Invoice>();

  if (!existing) {
    return jsonError(c, 'Invoice not found', 404);
  }

  const status = body.status || existing.status;
  const issue_date = body.issue_date || existing.issue_date;
  const due_date = body.due_date || existing.due_date;
  const notes = body.notes !== undefined ? body.notes : existing.notes;
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    `UPDATE invoices 
     SET status = ?, issue_date = ?, due_date = ?, notes = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`
  ).bind(status, issue_date, due_date, notes, now, id, userId).run();

  const updated = await c.env.DB.prepare('SELECT * FROM invoices WHERE id = ?').bind(id).first<Invoice>();
  return jsonSuccess(c, updated);
});

// Record Payment
invoicesRouter.post('/:id/payments', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => null);
  const validation = validatePaymentInput(body);

  if (!validation.isValid) {
    return jsonError(c, validation.error || 'Invalid payment data', 400);
  }

  const invoice = await c.env.DB.prepare(
    'SELECT * FROM invoices WHERE id = ? AND user_id = ?'
  ).bind(id, userId).first<Invoice>();

  if (!invoice) {
    return jsonError(c, 'Invoice not found', 404);
  }

  if (invoice.status === 'cancelled') {
    return jsonError(c, 'Cannot record payment for a cancelled invoice', 400);
  }

  const paymentId = generateId('pay');
  const now = new Date().toISOString();
  const paymentDate = body.payment_date || now.split('T')[0];
  const newPaidCents = invoice.paid_cents + body.amount_cents;
  const newStatus = newPaidCents >= invoice.total_cents ? 'paid' : 'pending';

  // Insert payment and update invoice in batch
  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO payments (id, user_id, invoice_id, amount_cents, payment_date, payment_method, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      paymentId,
      userId,
      id,
      body.amount_cents,
      paymentDate,
      body.payment_method || 'credit_card',
      body.notes?.trim() || null,
      now
    ),
    c.env.DB.prepare(
      `UPDATE invoices 
       SET paid_cents = ?, status = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`
    ).bind(newPaidCents, newStatus, now, id, userId)
  ]);

  const updatedInvoice = await c.env.DB.prepare('SELECT * FROM invoices WHERE id = ?').bind(id).first<Invoice>();
  const createdPayment = await c.env.DB.prepare('SELECT * FROM payments WHERE id = ?').bind(paymentId).first<Payment>();

  return jsonSuccess(c, {
    invoice: updatedInvoice,
    payment: createdPayment
  }, undefined, 201);
});

// Delete invoice
invoicesRouter.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  const invoice = await c.env.DB.prepare(
    'SELECT * FROM invoices WHERE id = ? AND user_id = ?'
  ).bind(id, userId).first<Invoice>();

  if (!invoice) {
    return jsonError(c, 'Invoice not found', 404);
  }

  if (invoice.paid_cents > 0) {
    return jsonError(c, 'Cannot delete an invoice that has recorded payments. Mark it as cancelled instead.', 400);
  }

  await c.env.DB.prepare('DELETE FROM invoices WHERE id = ? AND user_id = ?').bind(id, userId).run();
  return jsonSuccess(c, { message: 'Invoice deleted successfully' });
});
