import { Hono, Context } from 'hono';
import { Bindings, Variables, User } from '../types';
import { jsonSuccess, jsonError } from '../utils/response';
import { authMiddleware } from '../middleware/auth';

export const usersRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();
usersRouter.use('*', authMiddleware);

// Only the primary platform administrator can access user management
const PRIMARY_ADMIN_EMAIL = 'elanselvan1997@gmail.com';

function isSystemAdmin(userEmail?: string): boolean {
  return typeof userEmail === 'string' && userEmail.toLowerCase().trim() === PRIMARY_ADMIN_EMAIL;
}

// 1. GET /api/users - List all registered user accounts with business details
usersRouter.get('/', async (c) => {
  const callerEmail = c.get('userEmail');

  if (!isSystemAdmin(callerEmail)) {
    return jsonError(c, 'Access restricted to system administrator (elanselvan1997@gmail.com)', 403);
  }

  const query = `
    SELECT 
      u.id, 
      u.email, 
      u.full_name, 
      u.role, 
      COALESCE(u.status, 'active') as status, 
      u.created_at, 
      u.updated_at,
      bs.business_name,
      bs.currency,
      bs.currency_symbol,
      (SELECT COUNT(*) FROM customers c WHERE c.user_id = u.id) as customer_count,
      (SELECT COUNT(*) FROM bookings b WHERE b.user_id = u.id) as booking_count,
      (SELECT COUNT(*) FROM invoices i WHERE i.user_id = u.id) as invoice_count
    FROM users u
    LEFT JOIN business_settings bs ON bs.user_id = u.id
    ORDER BY u.created_at DESC
  `;

  const results = await c.env.DB.prepare(query).all();

  return jsonSuccess(c, results.results || []);
});

// 2. PATCH & PUT /api/users/:id/status - Toggle user status (active / deactivated)
const handleStatusUpdate = async (c: Context<{ Bindings: Bindings; Variables: Variables }>) => {
  const callerId = c.get('userId');
  const callerEmail = c.get('userEmail');
  const targetId = c.req.param('id');

  if (!isSystemAdmin(callerEmail)) {
    return jsonError(c, 'Access restricted to system administrator (elanselvan1997@gmail.com)', 403);
  }

  const body = await c.req.json().catch(() => null);
  if (!body || !body.status) {
    return jsonError(c, 'Status field is required (active or deactivated)', 400);
  }

  const newStatus = body.status.toLowerCase().trim();
  if (!['active', 'deactivated'].includes(newStatus)) {
    return jsonError(c, 'Invalid status value. Must be "active" or "deactivated"', 400);
  }

  // Find target user
  const targetUser = await c.env.DB.prepare(
    'SELECT id, email, full_name, role, status FROM users WHERE id = ?'
  ).bind(targetId).first<User>();

  if (!targetUser) {
    return jsonError(c, 'User account not found', 404);
  }

  // Safety check: Cannot deactivate oneself
  if (targetId === callerId && newStatus === 'deactivated') {
    return jsonError(c, 'You cannot deactivate your own administrator account', 400);
  }

  // Also prevent deactivating the primary platform administrator
  if (targetUser.email.toLowerCase().trim() === PRIMARY_ADMIN_EMAIL && newStatus === 'deactivated') {
    return jsonError(c, 'The primary platform administrator account cannot be deactivated', 400);
  }

  const now = new Date().toISOString();
  await c.env.DB.prepare(
    'UPDATE users SET status = ?, updated_at = ? WHERE id = ?'
  ).bind(newStatus, now, targetId).run();

  return jsonSuccess(c, {
    id: targetUser.id,
    email: targetUser.email,
    full_name: targetUser.full_name,
    role: targetUser.role,
    status: newStatus,
    updated_at: now
  });
};

usersRouter.patch('/:id/status', handleStatusUpdate);
usersRouter.put('/:id/status', handleStatusUpdate);
