import { Hono } from 'hono';
import { Bindings, Variables, Booking, Service, Customer } from '../types';
import { generateId } from '../utils/id';
import { jsonSuccess, jsonError } from '../utils/response';
import { validateBookingInput } from '../validators';
import { authMiddleware } from '../middleware/auth';

export const bookingsRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();
bookingsRouter.use('*', authMiddleware);

// List bookings
bookingsRouter.get('/', async (c) => {
  const userId = c.get('userId');
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(c.req.query('limit') || '20', 10)));
  const offset = (page - 1) * limit;
  const status = c.req.query('status')?.trim() || '';
  const customerId = c.req.query('customerId')?.trim() || '';
  const date = c.req.query('date')?.trim() || '';

  let countSql = 'SELECT COUNT(*) as count FROM bookings WHERE user_id = ?';
  let dataSql = `
    SELECT 
      b.*,
      c.name as customer_name,
      c.email as customer_email,
      c.phone as customer_phone,
      s.name as service_name
    FROM bookings b
    JOIN customers c ON b.customer_id = c.id
    JOIN services s ON b.service_id = s.id
    WHERE b.user_id = ?
  `;
  const countBindings: any[] = [userId];
  const dataBindings: any[] = [userId];

  if (status && ['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
    const filter = ' AND b.status = ?';
    countSql += ' AND status = ?';
    dataSql += filter;
    countBindings.push(status);
    dataBindings.push(status);
  }

  if (customerId) {
    const filter = ' AND b.customer_id = ?';
    countSql += ' AND customer_id = ?';
    dataSql += filter;
    countBindings.push(customerId);
    dataBindings.push(customerId);
  }

  if (date) {
    const filter = ' AND b.booking_date = ?';
    countSql += ' AND booking_date = ?';
    dataSql += filter;
    countBindings.push(date);
    dataBindings.push(date);
  }

  dataSql += ' ORDER BY b.booking_date DESC, b.start_time DESC LIMIT ? OFFSET ?';
  dataBindings.push(limit, offset);

  const totalRes = await c.env.DB.prepare(countSql).bind(...countBindings).first<{ count: number }>();
  const total = totalRes?.count || 0;
  const totalPages = Math.ceil(total / limit);

  const bookings = await c.env.DB.prepare(dataSql).bind(...dataBindings).all<Booking>();

  return jsonSuccess(c, bookings.results || [], {
    page,
    limit,
    total,
    totalPages
  });
});

// Get single booking
bookingsRouter.get('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  const booking = await c.env.DB.prepare(
    `SELECT 
       b.*,
       c.name as customer_name,
       c.email as customer_email,
       c.phone as customer_phone,
       c.company as customer_company,
       s.name as service_name,
       s.price_cents as service_price_cents
     FROM bookings b
     JOIN customers c ON b.customer_id = c.id
     JOIN services s ON b.service_id = s.id
     WHERE b.id = ? AND b.user_id = ?`
  ).bind(id, userId).first<Booking>();

  if (!booking) {
    return jsonError(c, 'Booking not found', 404);
  }

  return jsonSuccess(c, booking);
});

// Create booking
bookingsRouter.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json().catch(() => null);
  const validation = validateBookingInput(body);

  if (!validation.isValid) {
    return jsonError(c, validation.error || 'Invalid booking data', 400);
  }

  // Validate customer belongs to user
  const customer = await c.env.DB.prepare(
    'SELECT id FROM customers WHERE id = ? AND user_id = ?'
  ).bind(body.customer_id, userId).first<Customer>();

  if (!customer) {
    return jsonError(c, 'Customer not found or unauthorized', 404);
  }

  // Validate service belongs to user
  const service = await c.env.DB.prepare(
    'SELECT * FROM services WHERE id = ? AND user_id = ?'
  ).bind(body.service_id, userId).first<Service>();

  if (!service) {
    return jsonError(c, 'Service not found or unauthorized', 404);
  }

  const duration_minutes = body.duration_minutes || service.duration_minutes || 60;
  const total_amount_cents = body.total_amount_cents !== undefined ? body.total_amount_cents : service.price_cents;
  const id = generateId('bk');
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    `INSERT INTO bookings (
       id, user_id, customer_id, service_id, booking_date, start_time, duration_minutes, status, total_amount_cents, notes, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    userId,
    body.customer_id,
    body.service_id,
    body.booking_date,
    body.start_time,
    duration_minutes,
    body.status || 'pending',
    total_amount_cents,
    body.notes?.trim() || null,
    now,
    now
  ).run();

  const created = await c.env.DB.prepare(
    `SELECT b.*, c.name as customer_name, s.name as service_name
     FROM bookings b
     JOIN customers c ON b.customer_id = c.id
     JOIN services s ON b.service_id = s.id
     WHERE b.id = ?`
  ).bind(id).first<Booking>();

  return jsonSuccess(c, created, undefined, 201);
});

// Update booking
bookingsRouter.put('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => null);

  const existing = await c.env.DB.prepare(
    'SELECT * FROM bookings WHERE id = ? AND user_id = ?'
  ).bind(id, userId).first<Booking>();

  if (!existing) {
    return jsonError(c, 'Booking not found', 404);
  }

  const booking_date = body.booking_date || existing.booking_date;
  const start_time = body.start_time || existing.start_time;
  const duration_minutes = body.duration_minutes || existing.duration_minutes;
  const status = body.status || existing.status;
  const total_amount_cents = body.total_amount_cents !== undefined ? body.total_amount_cents : existing.total_amount_cents;
  const notes = body.notes !== undefined ? body.notes : existing.notes;
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    `UPDATE bookings 
     SET booking_date = ?, start_time = ?, duration_minutes = ?, status = ?, total_amount_cents = ?, notes = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`
  ).bind(
    booking_date,
    start_time,
    duration_minutes,
    status,
    total_amount_cents,
    notes,
    now,
    id,
    userId
  ).run();

  const updated = await c.env.DB.prepare(
    `SELECT b.*, c.name as customer_name, s.name as service_name
     FROM bookings b
     JOIN customers c ON b.customer_id = c.id
     JOIN services s ON b.service_id = s.id
     WHERE b.id = ?`
  ).bind(id).first<Booking>();

  return jsonSuccess(c, updated);
});

// Delete/Cancel booking
bookingsRouter.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  const existing = await c.env.DB.prepare(
    'SELECT id FROM bookings WHERE id = ? AND user_id = ?'
  ).bind(id, userId).first();

  if (!existing) {
    return jsonError(c, 'Booking not found', 404);
  }

  await c.env.DB.prepare('DELETE FROM bookings WHERE id = ? AND user_id = ?').bind(id, userId).run();
  return jsonSuccess(c, { message: 'Booking deleted successfully' });
});
