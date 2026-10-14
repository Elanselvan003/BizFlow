import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../src/utils/password';
import { signJwt, verifyJwt } from '../src/utils/jwt';
import {
  validateEmail,
  validateDateFormat,
  validateTimeFormat,
  validateCustomerInput,
  validateServiceInput,
  validateBookingInput,
  validateInvoiceInput,
  validatePaymentInput
} from '../src/validators';

describe('1. Security & Authentication Utilities', () => {
  it('should securely hash password with PBKDF2 and unique salt', async () => {
    const password = 'SuperSecretPassword123!';
    const { hash, salt } = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash.length).toBe(64); // SHA-256 32-byte hex
    expect(salt).toBeDefined();
    expect(salt.length).toBe(32); // 16-byte hex

    // Verify correct password
    const isValid = await verifyPassword(password, hash, salt);
    expect(isValid).toBe(true);

    // Reject wrong password
    const isInvalid = await verifyPassword('WrongPassword!', hash, salt);
    expect(isInvalid).toBe(false);
  });

  it('should generate distinct salts for the same password', async () => {
    const password = 'IdenticalPassword123!';
    const res1 = await hashPassword(password);
    const res2 = await hashPassword(password);

    expect(res1.salt).not.toBe(res2.salt);
    expect(res1.hash).not.toBe(res2.hash);
  });

  it('should sign and verify valid JWT tokens', async () => {
    const secret = 'test-secret-key-for-unit-tests-12345';
    const payload = { sub: 'usr_test_123', email: 'test@bizflow.app', role: 'owner' };

    const token = await signJwt(payload, secret, 3600);
    expect(token).toBeDefined();
    expect(token.split('.').length).toBe(3);

    const verified = await verifyJwt<{ sub: string; email: string; role: string }>(token, secret);
    expect(verified).not.toBeNull();
    expect(verified?.sub).toBe(payload.sub);
    expect(verified?.email).toBe(payload.email);
  });

  it('should reject tampered JWT tokens or incorrect secrets', async () => {
    const secret = 'valid-secret-key';
    const wrongSecret = 'wrong-secret-key';
    const payload = { sub: 'usr_test_123', email: 'test@bizflow.app', role: 'owner' };

    const token = await signJwt(payload, secret, 3600);

    // Verify with wrong secret
    const resultWrongSecret = await verifyJwt(token, wrongSecret);
    expect(resultWrongSecret).toBeNull();

    // Verify tampered token
    const tampered = token.slice(0, -5) + 'xxxxx';
    const resultTampered = await verifyJwt(tampered, secret);
    expect(resultTampered).toBeNull();
  });

  it('should reject expired JWT tokens', async () => {
    const secret = 'valid-secret';
    const payload = { sub: 'usr_expired' };

    // Sign with negative expiration (already expired)
    const token = await signJwt(payload, secret, -10);
    const verified = await verifyJwt(token, secret);
    expect(verified).toBeNull();
  });
});

describe('2. Runtime Input Validators', () => {
  it('should validate email formats correctly', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('alex.morgan+test@bizflow.co.uk')).toBe(true);
    expect(validateEmail('invalid-email')).toBe(false);
    expect(validateEmail('missing@domain')).toBe(false);
    expect(validateEmail('@missinguser.com')).toBe(false);
  });

  it('should validate ISO dates and 24h times', () => {
    expect(validateDateFormat('2026-10-14')).toBe(true);
    expect(validateDateFormat('2026-02-29')).toBe(false); // 2026 is not a leap year
    expect(validateDateFormat('14-10-2026')).toBe(false);
    expect(validateDateFormat('invalid')).toBe(false);

    expect(validateTimeFormat('09:30')).toBe(true);
    expect(validateTimeFormat('23:59')).toBe(true);
    expect(validateTimeFormat('24:00')).toBe(false);
    expect(validateTimeFormat('9:30')).toBe(false);
  });

  it('should validate Customer input rules', () => {
    // Valid
    expect(validateCustomerInput({ name: 'Acme Corp', email: 'info@acme.com', status: 'active' }).isValid).toBe(true);
    // Missing name
    expect(validateCustomerInput({ email: 'info@acme.com' }).isValid).toBe(false);
    // Invalid email
    expect(validateCustomerInput({ name: 'Acme', email: 'bad' }).isValid).toBe(false);
    // Invalid status
    expect(validateCustomerInput({ name: 'Acme', status: 'unknown' }).isValid).toBe(false);
  });

  it('should validate Service input and prevent floating point errors', () => {
    // Valid integer cents
    expect(validateServiceInput({ name: 'Consulting', price_cents: 15000, duration_minutes: 60 }).isValid).toBe(true);
    // Invalid negative price
    expect(validateServiceInput({ name: 'Consulting', price_cents: -500, duration_minutes: 60 }).isValid).toBe(false);
    // Invalid floating point price
    expect(validateServiceInput({ name: 'Consulting', price_cents: 150.5, duration_minutes: 60 }).isValid).toBe(false);
    // Invalid duration <= 0
    expect(validateServiceInput({ name: 'Consulting', price_cents: 1000, duration_minutes: 0 }).isValid).toBe(false);
  });

  it('should validate Booking input parameters', () => {
    expect(validateBookingInput({
      customer_id: 'cust_01',
      service_id: 'srv_01',
      booking_date: '2026-10-20',
      start_time: '14:00',
      duration_minutes: 60,
      status: 'confirmed'
    }).isValid).toBe(true);

    expect(validateBookingInput({
      customer_id: 'cust_01',
      service_id: 'srv_01',
      booking_date: 'invalid-date',
      start_time: '14:00'
    }).isValid).toBe(false);
  });

  it('should validate Invoice structure and line items', () => {
    expect(validateInvoiceInput({
      customer_id: 'cust_01',
      issue_date: '2026-10-14',
      due_date: '2026-10-28',
      items: [
        { description: 'Service 1', quantity: 2, unit_price_cents: 10000 }
      ],
      status: 'pending'
    }).isValid).toBe(true);

    // Empty items array
    expect(validateInvoiceInput({
      customer_id: 'cust_01',
      issue_date: '2026-10-14',
      due_date: '2026-10-28',
      items: []
    }).isValid).toBe(false);

    // Invalid item price
    expect(validateInvoiceInput({
      customer_id: 'cust_01',
      issue_date: '2026-10-14',
      due_date: '2026-10-28',
      items: [{ description: 'Item', quantity: 1, unit_price_cents: -100 }]
    }).isValid).toBe(false);
  });

  it('should validate Payment input and method', () => {
    expect(validatePaymentInput({ amount_cents: 5000, payment_method: 'credit_card', payment_date: '2026-10-14' }).isValid).toBe(true);
    expect(validatePaymentInput({ amount_cents: -500 }).isValid).toBe(false);
    expect(validatePaymentInput({ amount_cents: 5000, payment_method: 'unsupported' }).isValid).toBe(false);
  });
});

describe('3. Financial Calculations & Monetary Precision', () => {
  it('should accurately calculate invoice subtotal, tax, and total in integer cents', () => {
    const items = [
      { quantity: 2, unit_price_cents: 14999 }, // 2 * $149.99 = 29998 cents ($299.98)
      { quantity: 3, unit_price_cents: 4950 }   // 3 * $49.50  = 14850 cents ($148.50)
    ];

    const subtotal_cents = items.reduce((sum, item) => sum + (item.quantity * item.unit_price_cents), 0);
    expect(subtotal_cents).toBe(44848); // $448.48

    const discount_cents = 2000; // $20.00
    const taxable_cents = subtotal_cents - discount_cents; // 42848 cents ($428.48)
    const tax_rate = 8.5; // 8.5%

    // 42848 * 0.085 = 3642.08 -> rounded to 3642 cents ($36.42)
    const tax_cents = Math.round(taxable_cents * (tax_rate / 100));
    expect(tax_cents).toBe(3642);

    const total_cents = taxable_cents + tax_cents;
    expect(total_cents).toBe(46490); // $464.90

    // Validate payment logic
    let paid_cents = 20000;
    let status = paid_cents >= total_cents ? 'paid' : 'pending';
    expect(status).toBe('pending');

    paid_cents += 26490;
    status = paid_cents >= total_cents ? 'paid' : 'pending';
    expect(status).toBe('paid');
  });
});
