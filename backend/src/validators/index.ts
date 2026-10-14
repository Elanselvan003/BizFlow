// Input validation functions for BizFlow

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateDateFormat(dateStr: string): boolean {
  // YYYY-MM-DD
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

export function validateTimeFormat(timeStr: string): boolean {
  // HH:MM (24-hour format)
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return regex.test(timeStr);
}

export function validateCustomerInput(data: any): { isValid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Invalid payload' };
  }
  if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
    return { isValid: false, error: 'Customer name is required' };
  }
  if (data.email && (!validateEmail(data.email) || data.email.length > 255)) {
    return { isValid: false, error: 'Invalid email address' };
  }
  if (data.status && !['active', 'inactive'].includes(data.status)) {
    return { isValid: false, error: 'Status must be active or inactive' };
  }
  return { isValid: true };
}

export function validateServiceInput(data: any): { isValid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Invalid payload' };
  }
  if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
    return { isValid: false, error: 'Service name is required' };
  }
  if (typeof data.price_cents !== 'number' || data.price_cents < 0 || !Number.isInteger(data.price_cents)) {
    return { isValid: false, error: 'Price must be a non-negative integer in cents' };
  }
  if (typeof data.duration_minutes !== 'number' || data.duration_minutes <= 0 || !Number.isInteger(data.duration_minutes)) {
    return { isValid: false, error: 'Duration must be a positive integer in minutes' };
  }
  return { isValid: true };
}

export function validateBookingInput(data: any): { isValid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Invalid payload' };
  }
  if (!data.customer_id || typeof data.customer_id !== 'string') {
    return { isValid: false, error: 'Customer is required' };
  }
  if (!data.service_id || typeof data.service_id !== 'string') {
    return { isValid: false, error: 'Service is required' };
  }
  if (!data.booking_date || !validateDateFormat(data.booking_date)) {
    return { isValid: false, error: 'Valid booking date (YYYY-MM-DD) is required' };
  }
  if (!data.start_time || !validateTimeFormat(data.start_time)) {
    return { isValid: false, error: 'Valid start time (HH:MM) is required' };
  }
  if (data.duration_minutes && (typeof data.duration_minutes !== 'number' || data.duration_minutes <= 0)) {
    return { isValid: false, error: 'Duration must be a positive integer in minutes' };
  }
  if (data.status && !['pending', 'confirmed', 'completed', 'cancelled'].includes(data.status)) {
    return { isValid: false, error: 'Invalid booking status' };
  }
  return { isValid: true };
}

export function validateInvoiceInput(data: any): { isValid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Invalid payload' };
  }
  if (!data.customer_id || typeof data.customer_id !== 'string') {
    return { isValid: false, error: 'Customer is required' };
  }
  if (!data.issue_date || !validateDateFormat(data.issue_date)) {
    return { isValid: false, error: 'Valid issue date (YYYY-MM-DD) is required' };
  }
  if (!data.due_date || !validateDateFormat(data.due_date)) {
    return { isValid: false, error: 'Valid due date (YYYY-MM-DD) is required' };
  }
  if (!Array.isArray(data.items) || data.items.length === 0) {
    return { isValid: false, error: 'Invoice must contain at least one line item' };
  }
  for (const item of data.items) {
    if (!item.description || typeof item.description !== 'string' || !item.description.trim()) {
      return { isValid: false, error: 'Item description is required' };
    }
    if (typeof item.quantity !== 'number' || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      return { isValid: false, error: 'Item quantity must be a positive integer' };
    }
    if (typeof item.unit_price_cents !== 'number' || item.unit_price_cents < 0 || !Number.isInteger(item.unit_price_cents)) {
      return { isValid: false, error: 'Item unit price must be a non-negative integer in cents' };
    }
  }
  if (data.status && !['draft', 'pending', 'paid', 'overdue', 'cancelled'].includes(data.status)) {
    return { isValid: false, error: 'Invalid invoice status' };
  }
  return { isValid: true };
}

export function validatePaymentInput(data: any): { isValid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Invalid payload' };
  }
  if (typeof data.amount_cents !== 'number' || data.amount_cents <= 0 || !Number.isInteger(data.amount_cents)) {
    return { isValid: false, error: 'Amount must be a positive integer in cents' };
  }
  if (data.payment_date && !validateDateFormat(data.payment_date)) {
    return { isValid: false, error: 'Valid payment date (YYYY-MM-DD) is required' };
  }
  if (data.payment_method && !['credit_card', 'bank_transfer', 'cash', 'stripe', 'other'].includes(data.payment_method)) {
    return { isValid: false, error: 'Invalid payment method' };
  }
  return { isValid: true };
}
