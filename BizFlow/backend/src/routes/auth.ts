import { Hono } from 'hono';
import { Bindings, Variables, User, BusinessSettings } from '../types';
import { hashPassword, verifyPassword } from '../utils/password';
import { signJwt } from '../utils/jwt';
import { generateId } from '../utils/id';
import { jsonSuccess, jsonError } from '../utils/response';
import { validateEmail } from '../validators';
import { authMiddleware } from '../middleware/auth';

export const authRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Register new account
authRouter.post('/register', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) return jsonError(c, 'Invalid JSON body', 400);

  const { email, password, full_name, business_name } = body;

  if (!email || !validateEmail(email)) {
    return jsonError(c, 'A valid email address is required', 400);
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return jsonError(c, 'Password must be at least 8 characters long', 400);
  }
  if (!full_name || typeof full_name !== 'string' || !full_name.trim()) {
    return jsonError(c, 'Full name is required', 400);
  }

  // Check if user already exists
  const existingUser = await c.env.DB.prepare(
    'SELECT id FROM users WHERE email = ?'
  ).bind(email.toLowerCase().trim()).first();

  if (existingUser) {
    return jsonError(c, 'An account with this email already exists', 409);
  }

  const userId = generateId('usr');
  const settingsId = generateId('bs');
  const { hash, salt } = await hashPassword(password);
  const now = new Date().toISOString();

  // Create user & initial business settings
  const batchRes = await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO users (id, email, password_hash, salt, full_name, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'owner', ?, ?)`
    ).bind(userId, email.toLowerCase().trim(), hash, salt, full_name.trim(), now, now),
    c.env.DB.prepare(
      `INSERT INTO business_settings (id, user_id, business_name, email, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(settingsId, userId, business_name?.trim() || `${full_name.trim()}'s Business`, email.toLowerCase().trim(), now, now)
  ]);

  const token = await signJwt(
    { sub: userId, email: email.toLowerCase().trim(), role: 'owner' },
    c.env.JWT_SECRET || 'bizflow_default_dev_secret_key_12345'
  );

  return jsonSuccess(c, {
    token,
    user: {
      id: userId,
      email: email.toLowerCase().trim(),
      full_name: full_name.trim(),
      role: 'owner'
    },
    settings: {
      id: settingsId,
      user_id: userId,
      business_name: business_name?.trim() || `${full_name.trim()}'s Business`,
      currency: 'INR',
      currency_symbol: '₹',
      timezone: 'Asia/Kolkata',
      tax_rate: 8.5
    }
  }, undefined, 201);
});

// Login
authRouter.post('/login', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) return jsonError(c, 'Invalid JSON body', 400);

  const { email, password } = body;
  if (!email || !password) {
    return jsonError(c, 'Email and password are required', 400);
  }

  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE email = ?'
  ).bind(email.toLowerCase().trim()).first<User>();

  if (!user) {
    return jsonError(c, 'Invalid email or password', 401);
  }

  const isValid = await verifyPassword(password, user.password_hash, user.salt);
  if (!isValid) {
    return jsonError(c, 'Invalid email or password', 401);
  }

  // Fetch business settings
  const settings = await c.env.DB.prepare(
    'SELECT * FROM business_settings WHERE user_id = ?'
  ).bind(user.id).first<BusinessSettings>();

  const token = await signJwt(
    { sub: user.id, email: user.email, role: user.role },
    c.env.JWT_SECRET || 'bizflow_default_dev_secret_key_12345'
  );

  return jsonSuccess(c, {
    token,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role
    },
    settings
  });
});

// Logout
authRouter.post('/logout', async (c) => {
  return jsonSuccess(c, { message: 'Logged out successfully' });
});

// Get current profile
authRouter.get('/me', authMiddleware, async (c) => {
  const userId = c.get('userId');

  const user = await c.env.DB.prepare(
    'SELECT id, email, full_name, role, created_at, updated_at FROM users WHERE id = ?'
  ).bind(userId).first();

  if (!user) {
    return jsonError(c, 'User not found', 404);
  }

  const settings = await c.env.DB.prepare(
    'SELECT * FROM business_settings WHERE user_id = ?'
  ).bind(userId).first<BusinessSettings>();

  return jsonSuccess(c, { user, settings });
});
