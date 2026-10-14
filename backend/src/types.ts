// BizFlow Backend Types & Environment Interfaces

export interface Bindings {
  DB: D1Database;
  JWT_SECRET: string;
  ENVIRONMENT: string;
  FRONTEND_URL: string;
}

export interface Variables {
  userId: string;
  userEmail: string;
  userRole: string;
}

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
  password_hash: string;
  salt: string;
  full_name: string;
  role: string;
  created_at: string;
  updated_at: string;
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
  created_at: string;
  updated_at: string;
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
  updated_at: string;
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
  updated_at: string;
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
  updated_at: string;
  // Joins
  customer_name?: string;
  customer_email?: string;
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
  updated_at: string;
  // Joins
  customer_name?: string;
  customer_email?: string;
  customer_company?: string;
  items?: InvoiceItem[];
  payments?: Payment[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  service_id: string | null;
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
