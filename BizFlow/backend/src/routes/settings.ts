import { Hono } from 'hono';
import { Bindings, Variables, BusinessSettings, User } from '../types';
import { jsonSuccess, jsonError } from '../utils/response';
import { hashPassword, verifyPassword } from '../utils/password';
import { validateEmail } from '../validators';
import { authMiddleware } from '../middleware/auth';

export const settingsRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();
settingsRouter.use('*', authMiddleware);

// Get business settings
settingsRouter.get('/', async (c) => {
  const userId = c.get('userId');

  const settings = await c.env.DB.prepare(
    'SELECT * FROM business_settings WHERE user_id = ?'
  ).bind(userId).first<BusinessSettings>();

  if (!settings) {
    return jsonError(c, 'Settings not found', 404);
  }

  return jsonSuccess(c, settings);
});

// Update business settings
settingsRouter.put('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json().catch(() => null);

  if (!body || typeof body !== 'object') {
    return jsonError(c, 'Invalid payload', 400);
  }

  const existing = await c.env.DB.prepare(
    'SELECT * FROM business_settings WHERE user_id = ?'
  ).bind(userId).first<BusinessSettings>();

  if (!existing) {
    return jsonError(c, 'Settings not found', 404);
  }

  const business_name = body.business_name?.trim() || existing.business_name;
  const email = body.email !== undefined ? body.email?.trim() || null : existing.email;
  const phone = body.phone !== undefined ? body.phone?.trim() || null : existing.phone;
  const address = body.address !== undefined ? body.address?.trim() || null : existing.address;
  const currency = body.currency?.trim() || existing.currency;
  const currency_symbol = body.currency_symbol?.trim() || existing.currency_symbol;
  const timezone = body.timezone?.trim() || existing.timezone;
  const tax_rate = typeof body.tax_rate === 'number' ? Math.max(0, body.tax_rate) : existing.tax_rate;
  const invoice_prefix = body.invoice_prefix?.trim() || existing.invoice_prefix;
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    `UPDATE business_settings
     SET business_name = ?, email = ?, phone = ?, address = ?,
         currency = ?, currency_symbol = ?, timezone = ?, tax_rate = ?, invoice_prefix = ?, updated_at = ?
     WHERE user_id = ?`
  ).bind(
    business_name,
    email,
    phone,
    address,
    currency,
    currency_symbol,
    timezone,
    tax_rate,
    invoice_prefix,
    now,
    userId
  ).run();

  const updated = await c.env.DB.prepare(
    'SELECT * FROM business_settings WHERE user_id = ?'
  ).bind(userId).first<BusinessSettings>();

  return jsonSuccess(c, updated);
});

// Update user profile
settingsRouter.put('/profile', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json().catch(() => null);

  if (!body || typeof body !== 'object') {
    return jsonError(c, 'Invalid payload', 400);
  }

  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE id = ?'
  ).bind(userId).first<User>();

  if (!user) {
    return jsonError(c, 'User not found', 404);
  }

  const full_name = body.full_name?.trim() || user.full_name;
  const email = body.email?.toLowerCase().trim() || user.email;

  if (body.email && !validateEmail(email)) {
    return jsonError(c, 'Invalid email address', 400);
  }

  // Check email uniqueness if changed
  if (email !== user.email) {
    const dup = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ? AND id != ?'
    ).bind(email, userId).first();

    if (dup) {
      return jsonError(c, 'Email address already in use by another account', 409);
    }
  }

  let password_hash = user.password_hash;
  let salt = user.salt;

  if (body.new_password) {
    if (!body.current_password) {
      return jsonError(c, 'Current password is required to change password', 400);
    }
    const isCurrentValid = await verifyPassword(body.current_password, user.password_hash, user.salt);
    if (!isCurrentValid) {
      return jsonError(c, 'Current password is incorrect', 400);
    }
    if (typeof body.new_password !== 'string' || body.new_password.length < 8) {
      return jsonError(c, 'New password must be at least 8 characters long', 400);
    }
    const hashed = await hashPassword(body.new_password);
    password_hash = hashed.hash;
    salt = hashed.salt;
  }

  const now = new Date().toISOString();
  await c.env.DB.prepare(
    `UPDATE users
     SET full_name = ?, email = ?, password_hash = ?, salt = ?, updated_at = ?
     WHERE id = ?`
  ).bind(full_name, email, password_hash, salt, now, userId).run();

  const updatedUser = await c.env.DB.prepare(
    'SELECT id, email, full_name, role, updated_at FROM users WHERE id = ?'
  ).bind(userId).first();

  return jsonSuccess(c, updatedUser);
});
