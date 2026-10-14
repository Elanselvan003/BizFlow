import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { jsonSuccess } from '../utils/response';
import { authMiddleware } from '../middleware/auth';

export const dashboardRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();
dashboardRouter.use('*', authMiddleware);

dashboardRouter.get('/stats', async (c) => {
  const userId = c.get('userId');

  // Total customers
  const customersRes = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM customers WHERE user_id = ?'
  ).bind(userId).first<{ count: number }>();

  // Total bookings
  const bookingsRes = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM bookings WHERE user_id = ?'
  ).bind(userId).first<{ count: number }>();

  // Total revenue collected (from payments)
  const revenueRes = await c.env.DB.prepare(
    'SELECT COALESCE(SUM(amount_cents), 0) as total FROM payments WHERE user_id = ?'
  ).bind(userId).first<{ total: number }>();

  // Pending invoices
  const pendingInvoicesRes = await c.env.DB.prepare(
    `SELECT 
       COUNT(*) as count, 
       COALESCE(SUM(total_cents - paid_cents), 0) as amount 
     FROM invoices 
     WHERE user_id = ? AND status IN ('pending', 'overdue')`
  ).bind(userId).first<{ count: number; amount: number }>();

  // Booking status counts
  const bookingStatuses = await c.env.DB.prepare(
    `SELECT status, COUNT(*) as count 
     FROM bookings 
     WHERE user_id = ? 
     GROUP BY status`
  ).bind(userId).all<{ status: string; count: number }>();

  const statusMap: Record<string, number> = {
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0
  };
  bookingStatuses.results?.forEach(row => {
    statusMap[row.status] = row.count;
  });

  return jsonSuccess(c, {
    total_customers: customersRes?.count || 0,
    total_bookings: bookingsRes?.count || 0,
    total_revenue_cents: revenueRes?.total || 0,
    pending_invoices_count: pendingInvoicesRes?.count || 0,
    pending_invoices_amount_cents: pendingInvoicesRes?.amount || 0,
    booking_status_counts: statusMap
  });
});

dashboardRouter.get('/revenue', async (c) => {
  const userId = c.get('userId');

  // Revenue grouped by month for the last 6 months
  const monthlyRevenue = await c.env.DB.prepare(
    `SELECT 
       strftime('%Y-%m', payment_date) as month,
       COALESCE(SUM(amount_cents), 0) as total_cents
     FROM payments
     WHERE user_id = ? AND payment_date >= date('now', '-6 months')
     GROUP BY strftime('%Y-%m', payment_date)
     ORDER BY month ASC`
  ).bind(userId).all<{ month: string; total_cents: number }>();

  // Monthly invoiced total
  const monthlyInvoiced = await c.env.DB.prepare(
    `SELECT 
       strftime('%Y-%m', issue_date) as month,
       COALESCE(SUM(total_cents), 0) as total_cents
     FROM invoices
     WHERE user_id = ? AND issue_date >= date('now', '-6 months')
     GROUP BY strftime('%Y-%m', issue_date)
     ORDER BY month ASC`
  ).bind(userId).all<{ month: string; total_cents: number }>();

  return jsonSuccess(c, {
    collected: monthlyRevenue.results || [],
    invoiced: monthlyInvoiced.results || []
  });
});

dashboardRouter.get('/recent-activity', async (c) => {
  const userId = c.get('userId');

  // Recent 5 bookings
  const recentBookings = await c.env.DB.prepare(
    `SELECT 
       b.id, b.booking_date, b.start_time, b.status, b.total_amount_cents,
       c.name as customer_name,
       s.name as service_name
     FROM bookings b
     JOIN customers c ON b.customer_id = c.id
     JOIN services s ON b.service_id = s.id
     WHERE b.user_id = ?
     ORDER BY b.created_at DESC
     LIMIT 5`
  ).bind(userId).all();

  // Recent 5 invoices
  const recentInvoices = await c.env.DB.prepare(
    `SELECT 
       i.id, i.invoice_number, i.issue_date, i.due_date, i.status, i.total_cents, i.paid_cents,
       c.name as customer_name
     FROM invoices i
     JOIN customers c ON i.customer_id = c.id
     WHERE i.user_id = ?
     ORDER BY i.created_at DESC
     LIMIT 5`
  ).bind(userId).all();

  return jsonSuccess(c, {
    bookings: recentBookings.results || [],
    invoices: recentInvoices.results || []
  });
});
