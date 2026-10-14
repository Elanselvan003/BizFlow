import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Bindings, Variables } from './types';
import { jsonSuccess, jsonError } from './utils/response';
import { authRouter } from './routes/auth';
import { dashboardRouter } from './routes/dashboard';
import { customersRouter } from './routes/customers';
import { servicesRouter } from './routes/services';
import { bookingsRouter } from './routes/bookings';
import { invoicesRouter } from './routes/invoices';
import { reportsRouter } from './routes/reports';
import { settingsRouter } from './routes/settings';
import { usersRouter } from './routes/users';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Enable CORS
app.use('*', async (c, next) => {
  const corsMiddleware = cors({
    origin: (origin) => {
      // Allow localhost dev servers and configured frontend URL
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return origin || '*';
      }
      if (c.env.FRONTEND_URL && origin === c.env.FRONTEND_URL) {
        return origin;
      }
      return '*'; // Allow client-side demo requests
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    maxAge: 86400,
    credentials: true
  });
  return corsMiddleware(c, next);
});

// Centralized error handler
app.onError((err, c) => {
  console.error('API Error:', err);
  return jsonError(c, err.message || 'Internal server error', 500);
});

// Health check
app.get('/api/health', (c) => {
  return jsonSuccess(c, {
    status: 'healthy',
    service: 'BizFlow API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mount modular feature routers
app.route('/api/auth', authRouter);
app.route('/api/dashboard', dashboardRouter);
app.route('/api/customers', customersRouter);
app.route('/api/services', servicesRouter);
app.route('/api/bookings', bookingsRouter);
app.route('/api/invoices', invoicesRouter);
app.route('/api/reports', reportsRouter);
app.route('/api/settings', settingsRouter);
app.route('/api/users', usersRouter);

// 404 handler
app.notFound((c) => {
  return jsonError(c, `Route not found: ${c.req.method} ${c.req.path}`, 404);
});

export default app;
