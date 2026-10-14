// BizFlow Frontend Data Models

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status?: 'active' | 'deactivated';
}

export interface UserAccount {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: 'active' | 'deactivated';
  created_at: string;
  updated_at: string;
  business_name?: string;
  currency?: string;
  currency_symbol?: string;
  customer_count?: number;
  booking_count?: number;
  invoice_count?: number;
}

export interface BusinessSettings {
  id: string;
  user_id: string;
  business_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  currency: string;
  currency_symbol: string;
  timezone: string;
  tax_rate: number;
  invoice_prefix: string;
}

export interface Customer {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  notes: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  booking_count?: number;
  total_invoiced_cents?: number;
}

export interface Service {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  duration_minutes: number;
  is_active: number;
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  customer_id: string;
  service_id: string;
  booking_date: string;
  start_time: string;
  duration_minutes: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  total_amount_cents: number;
  notes: string | null;
  created_at: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  service_name?: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  customer_id: string;
  booking_id: string | null;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  subtotal_cents: number;
  discount_cents: number;
  tax_rate: number;
  tax_cents: number;
  total_cents: number;
  paid_cents: number;
  notes: string | null;
  created_at: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_company?: string;
  customer_address?: string;
  items?: InvoiceItem[];
  payments?: Payment[];
  business?: BusinessSettings;
}

export interface InvoiceItem {
  id?: string;
  invoice_id?: string;
  service_id?: string | null;
  description: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
}

export interface Payment {
  id: string;
  user_id: string;
  invoice_id: string;
  amount_cents: number;
  payment_date: string;
  payment_method: 'credit_card' | 'bank_transfer' | 'cash' | 'stripe' | 'other';
  notes: string | null;
  created_at: string;
}

export interface DashboardStats {
  total_customers: number;
  total_bookings: number;
  total_revenue_cents: number;
  pending_invoices_count: number;
  pending_invoices_amount_cents: number;
  booking_status_counts: {
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
}

export interface RevenueAnalytics {
  collected: Array<{ month: string; total_cents: number }>;
  invoiced: Array<{ month: string; total_cents: number }>;
}

export interface RecentActivity {
  bookings: Booking[];
  invoices: Invoice[];
}

export interface RevenueReport {
  period: string;
  total_collected_cents: number;
  total_invoiced_cents: number;
  total_invoices_count: number;
  average_invoice_cents: number;
  outstanding_cents: number;
  payment_methods: Array<{ payment_method: string; count: number; total_cents: number }>;
  timeline: Array<{ date: string; amount_cents: number }>;
}

export interface BookingsReport {
  period: string;
  total_bookings: number;
  completion_rate: number;
  by_status: Array<{ status: string; count: number; total_cents: number }>;
  by_service: Array<{ id: string; name: string; booking_count: number; revenue_cents: number }>;
}

export interface CustomersReport {
  status_summary: Array<{ status: string; count: number }>;
  top_customers: Array<{
    id: string;
    name: string;
    company: string | null;
    email: string | null;
    total_bookings: number;
    total_invoiced_cents: number;
    total_paid_cents: number;
  }>;
}
