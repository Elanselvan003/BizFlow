# BizFlow Automated Testing Guide

BizFlow includes comprehensive testing suites across both frontend and backend layers to verify security, calculations, validations, and UI interactions.

---

## 1. Backend Automated Tests (Vitest)

The backend test suite covers:
- **Security & Password Hashing**: PBKDF2 SHA-256 derivation, salts, valid and invalid password verification.
- **JWT Authentication**: Token generation, signature validation, expired token rejection, tampered token prevention.
- **Runtime Validators**: Customer, service, booking, invoice, payment input validation; ISO date checking; 24h time validation.
- **Financial Precision**: Subtotal calculation, discount deduction, rounding of tax percentages, and status transitions upon payment.

### Running Backend Tests
```bash
cd backend
npm test
# Or run with type checking:
npm run typecheck && npm test
```

Expected Output:
```
✓ tests/api.test.ts (13 tests)
Test Files  1 passed (1)
Tests       13 passed (13)
```

---

## 2. Frontend Automated Tests (Angular & Vitest)

The frontend test suite covers:
- **Component Lifecycle**: App root bootstrap and router configuration.
- **Custom Pipes**: `MoneyPipe` integer cents to dollar string conversions and custom currency symbols.
- **Reactive Notification Signals**: `NotificationService` toast list manipulation.

### Running Frontend Tests
```bash
cd frontend
npm test -- --watch=false
```

Expected Output:
```
✓ |frontend| src/app/core/services/notification.service.spec.ts (3 tests)
✓ |frontend| src/app/shared/pipes/money.pipe.spec.ts (3 tests)
✓ |frontend| src/app/app.spec.ts (1 test)
Test Files  3 passed (3)
Tests       7 passed (7)
```

---

## 3. Production Build Validation

Verify TypeScript compilation, asset optimization, and budget limits:
```bash
cd frontend
npm run build
```

Expected Output:
```
Application bundle generation complete.
Output location: dist/frontend
```

---

## 4. End-to-End Visual Verification

During development, BizFlow's end-to-end flows were verified using Chrome DevTools automated browser testing, including:
1. Authentication with pre-seeded demo credentials.
2. Dashboard live rendering with Apache ECharts.
3. Customer creation and details viewing.
4. Services and pricing configuration.
5. Appointment scheduling and status updates.
6. Multi-line invoice generation, print layout view, and payment recording.
7. Reports timeline aggregation across time periods.
8. Application and profile settings updates.
