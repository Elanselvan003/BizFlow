import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { jsonSuccess } from '../utils/response';
import { authMiddleware } from '../middleware/auth';

export const reportsRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();
reportsRouter.use('*', authMiddleware);

function getDateFilter(period?: string): string {
  switch (period) {
    case '7d':
      return "date('now', '-7 days')";
    case '30d':
      return "date('now', '-30 days')";
    case '90d':
      return "date('now', '-90 days')";
    case '1y':
      return "date('now', '-1 year')";
    default:
      return "date('now', '-30 days')";
  }
}

// Revenue report
reportsRouter.get('/revenue', async (c) => {
  const userId = c.get('userId');
  const period = c.req.query('period') || '30d';
  const dateLimit = getDateFilter(period);

  // Total collected
  const totalCollectedRes = await c.env.DB.prepare(
    `SELECT COALESCE(SUM(amount_cents), 0) as total FROM payments 
     WHERE user_id = ? AND payment_date >= ${dateLimit}`
  ).bind(userId).first<{ total: number }>();

  // Total invoiced
  const totalInvoicedRes = await c.env.DB.prepare(
    `SELECT 
       COALESCE(SUM(total_cents), 0) as total,
       COUNT(*) as count,
       COALESCE(AVG(total_cents), 0) as average
     FROM invoices 
     WHERE user_id = ? AND issue_date >= ${dateLimit}`
  ).bind(userId).first<{ total: number; count: number; average: number }>();

  // Outstanding unpaid
  const outstandingRes = await c.env.DB.prepare(
    `SELECT COALESCE(SUM(total_cents - paid_cents), 0) as total FROM invoices 
     WHERE user_id = ? AND status IN ('pending', 'overdue')`
  ).bind(userId).first<{ total: number }>();

  // Breakdown by payment method
  const methodBreakdown = await c.env.DB.prepare(
    `SELECT payment_method, COUNT(*) as count, COALESCE(SUM(amount_cents), 0) as total_cents
     FROM payments
     WHERE user_id = ? AND payment_date >= ${dateLimit}
     GROUP BY payment_method`
  ).bind(userId).all();

  // Daily timeline
  const timeline = await c.env.DB.prepare(
    `SELECT payment_date as date, COALESCE(SUM(amount_cents), 0) as amount_cents
     FROM payments
     WHERE user_id = ? AND payment_date >= ${dateLimit}
     GROUP BY payment_date
     ORDER BY payment_date ASC`
  ).bind(userId).all();

  return jsonSuccess(c, {
    period,
    total_collected_cents: totalCollectedRes?.total || 0,
    total_invoiced_cents: totalInvoicedRes?.total || 0,
    total_invoices_count: totalInvoicedRes?.count || 0,
    average_invoice_cents: Math.round(totalInvoicedRes?.average || 0),
    outstanding_cents: outstandingRes?.total || 0,
    payment_methods: methodBreakdown.results || [],
    timeline: timeline.results || []
  });
});

// Bookings report
reportsRouter.get('/bookings', async (c) => {
  const userId = c.get('userId');
  const period = c.req.query('period') || '30d';
  const dateLimit = getDateFilter(period);

  // Status breakdown
  const statusCounts = await c.env.DB.prepare(
    `SELECT status, COUNT(*) as count, COALESCE(SUM(total_amount_cents), 0) as total_cents
     FROM bookings
     WHERE user_id = ? AND booking_date >= ${dateLimit}
     GROUP BY status`
  ).bind(userId).all<{ status: string; count: number; total_cents: number }>();

  // Service popular breakdown
  const servicePopularity = await c.env.DB.prepare(
    `SELECT 
       s.id, s.name, 
       COUNT(b.id) as booking_count,
       COALESCE(SUM(b.total_amount_cents), 0) as revenue_cents
     FROM services s
     LEFT JOIN bookings b ON b.service_id = s.id AND b.booking_date >= ${dateLimit}
     WHERE s.user_id = ?
     GROUP BY s.id, s.name
     ORDER BY booking_count DESC`
  ).bind(userId).all();

  const totalBookings = statusCounts.results?.reduce((acc, row) => acc + row.count, 0) || 0;
  const completedCount = statusCounts.results?.find(r => r.status === 'completed')?.count || 0;
  const completionRate = totalBookings > 0 ? Math.round((completedCount / totalBookings) * 100) : 0;

  return jsonSuccess(c, {
    period,
    total_bookings: totalBookings,
    completion_rate: completionRate,
    by_status: statusCounts.results || [],
    by_service: servicePopularity.results || []
  });
});

// Customers report
reportsRouter.get('/customers', async (c) => {
  const userId = c.get('userId');

  // Customer status breakdown
  const statusRes = await c.env.DB.prepare(
    `SELECT status, COUNT(*) as count 
     FROM customers 
     WHERE user_id = ? 
     GROUP BY status`
  ).bind(userId).all<{ status: string; count: number }>();

  // Top 5 customers by revenue
  const topCustomers = await c.env.DB.prepare(
    `SELECT 
       c.id, c.name, c.company, c.email,
       COUNT(DISTINCT b.id) as total_bookings,
       COALESCE(SUM(i.total_cents), 0) as total_invoiced_cents,
       COALESCE(SUM(i.paid_cents), 0) as total_paid_cents
     FROM customers c
     LEFT JOIN bookings b ON b.customer_id = c.id
     LEFT JOIN invoices i ON i.customer_id = c.id
     WHERE c.user_id = ?
     GROUP BY c.id
     ORDER BY total_paid_cents DESC
     LIMIT 5`
  ).bind(userId).all();

  return jsonSuccess(c, {
    status_summary: statusRes.results || [],
    top_customers: topCustomers.results || []
  });
});
