import { Context, Next } from 'hono';
import { verifyJwt } from '../utils/jwt';
import { jsonError } from '../utils/response';
import { Bindings, Variables } from '../types';

export async function authMiddleware(c: Context<{ Bindings: Bindings; Variables: Variables }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonError(c, 'Authorization token required', 401);
  }

  const token = authHeader.substring(7).trim();
  const secret = c.env.JWT_SECRET || 'bizflow_default_dev_secret_key_12345';
  const payload = await verifyJwt<{ sub: string; email: string; role: string }>(token, secret);

  if (!payload || !payload.sub) {
    return jsonError(c, 'Invalid or expired token', 401);
  }

  c.set('userId', payload.sub);
  c.set('userEmail', payload.email);
  c.set('userRole', payload.role);

  await next();
}
