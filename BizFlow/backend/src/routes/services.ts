import { Hono } from 'hono';
import { Bindings, Variables, Service } from '../types';
import { generateId } from '../utils/id';
import { jsonSuccess, jsonError } from '../utils/response';
import { validateServiceInput } from '../validators';
import { authMiddleware } from '../middleware/auth';

export const servicesRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();
servicesRouter.use('*', authMiddleware);

// List services
servicesRouter.get('/', async (c) => {
  const userId = c.get('userId');
  const activeOnly = c.req.query('active') === 'true';

  let sql = 'SELECT * FROM services WHERE user_id = ?';
  const bindings: any[] = [userId];

  if (activeOnly) {
    sql += ' AND is_active = 1';
  }

  sql += ' ORDER BY created_at DESC';

  const services = await c.env.DB.prepare(sql).bind(...bindings).all<Service>();
  return jsonSuccess(c, services.results || []);
});

// Get single service
servicesRouter.get('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  const service = await c.env.DB.prepare(
    'SELECT * FROM services WHERE id = ? AND user_id = ?'
  ).bind(id, userId).first<Service>();

  if (!service) {
    return jsonError(c, 'Service not found', 404);
  }

  return jsonSuccess(c, service);
});

// Create service
servicesRouter.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json().catch(() => null);
  const validation = validateServiceInput(body);

  if (!validation.isValid) {
    return jsonError(c, validation.error || 'Invalid service data', 400);
  }

  const id = generateId('srv');
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    `INSERT INTO services (id, user_id, name, description, price_cents, duration_minutes, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    userId,
    body.name.trim(),
    body.description?.trim() || null,
    body.price_cents,
    body.duration_minutes,
    body.is_active !== undefined ? (body.is_active ? 1 : 0) : 1,
    now,
    now
  ).run();

  const created = await c.env.DB.prepare('SELECT * FROM services WHERE id = ?').bind(id).first<Service>();
  return jsonSuccess(c, created, undefined, 201);
});

// Update service
servicesRouter.put('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => null);
  const validation = validateServiceInput(body);

  if (!validation.isValid) {
    return jsonError(c, validation.error || 'Invalid service data', 400);
  }

  const existing = await c.env.DB.prepare(
    'SELECT id FROM services WHERE id = ? AND user_id = ?'
  ).bind(id, userId).first();

  if (!existing) {
    return jsonError(c, 'Service not found', 404);
  }

  const now = new Date().toISOString();
  await c.env.DB.prepare(
    `UPDATE services
     SET name = ?, description = ?, price_cents = ?, duration_minutes = ?, is_active = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`
  ).bind(
    body.name.trim(),
    body.description?.trim() || null,
    body.price_cents,
    body.duration_minutes,
    body.is_active !== undefined ? (body.is_active ? 1 : 0) : 1,
    now,
    id,
    userId
  ).run();

  const updated = await c.env.DB.prepare('SELECT * FROM services WHERE id = ?').bind(id).first<Service>();
  return jsonSuccess(c, updated);
});

// Delete service
servicesRouter.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  const service = await c.env.DB.prepare(
    'SELECT id FROM services WHERE id = ? AND user_id = ?'
  ).bind(id, userId).first();

  if (!service) {
    return jsonError(c, 'Service not found', 404);
  }

  // Check if referenced by bookings or invoice items
  const bookingsCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM bookings WHERE service_id = ?'
  ).bind(id).first<{ count: number }>();

  if ((bookingsCount?.count || 0) > 0) {
    return jsonError(
      c,
      `Cannot delete service referenced in ${bookingsCount?.count || 0} booking(s). Deactivate the service instead.`,
      400
    );
  }

  await c.env.DB.prepare(
    'DELETE FROM services WHERE id = ? AND user_id = ?'
  ).bind(id, userId).run();

  return jsonSuccess(c, { message: 'Service deleted successfully' });
});
