# Servora — Automated Testing & Quality Verification Guide

This document records the automated testing suite execution, manual acceptance procedures, and empirical quality gate results for Servora.

---

## 1. Automated Test Suite Summary

The repository includes comprehensive automated test coverage implemented with **Vitest**. All tests execute in clean in-memory environments and do not require an active external database connection to validate logic.

### Test Execution Command
In the `server/` directory:
```bash
npm test
```

### Empirical Test Results (Latest Execution)
```text
 RUN  v2.1.9 C:/Users/athar/OneDrive/Desktop/PROJECTS/Sudarshan/server

 ✓ src/tests/production-qr-and-no-mock.test.ts (7 tests)
 ✓ src/tests/order-calc.unit.test.ts (3 tests)
 ✓ src/tests/qr-validation.test.ts (5 tests)
 ✓ src/tests/payment-webhook.unit.test.ts (3 tests)
 ✓ src/tests/state-machine.unit.test.ts (4 tests)
 ✓ src/tests/rbac-auth.test.ts (6 tests)
 ✓ src/tests/socket-auth.test.ts (4 tests)
 ✓ src/tests/otp.unit.test.ts (10 tests)
 ✓ src/tests/tenant-isolation.test.ts (3 tests)
 ✓ src/tests/critical-workflow.test.ts (16 tests)
 ✓ src/tests/production-audit.test.ts (14 tests)

 Test Files  11 passed (11)
      Tests  75 passed (75)
   Duration  3.11s
```

---

## 2. Test Suite Breakdown

| Test File | Test Count | Scope & Assertions |
| :--- | :---: | :--- |
| `production-qr-and-no-mock.test.ts` | **7** | Production QR URL construction with GitHub Pages base path, distinct table tokens, route isolation, anti-mock regression, and actionable network error diagnostics. |
| `critical-workflow.test.ts` | **16** | End-to-end registration transaction, table creation, QR token assignment, customer order calculation, and kitchen KDS event dispatch. |
| `production-audit.test.ts` | **14** | Authentication security, Argon2id verification, suspended tenant rejection, inactive account blocking, and order idempotency. |
| `otp.unit.test.ts` | **10** | HMAC-SHA256 OTP hashing, 5-minute expiration, max 5 attempts throttling, and customer session token issuance. |
| `rbac-auth.test.ts` | **6** | Server-side role boundaries (Superadmin, Restaurant Admin, Kitchen Staff, Waiter). |
| `qr-validation.test.ts` | **5** | 32-hex cryptographic randomness, URL tampering detection, and reserved table rejection. |
| `socket-auth.test.ts` | **4** | Real-time WebSocket room joins (`restaurant:<id>` & `order:<id>`), event authorization, and disconnect cleanup. |
| `state-machine.unit.test.ts` | **4** | Valid and invalid order status transitions (`NEW` -> `ACCEPTED` -> `PREPARING` -> `READY` -> `COMPLETED`). |
| `tenant-isolation.test.ts` | **3** | Cross-tenant access denial: Restaurant A cannot view, update, or delete Restaurant B's resources. |
| `payment-webhook.unit.test.ts` | **3** | Webhook HMAC signature validation, forged signature rejection, and idempotency key enforcement. |
| `order-calc.unit.test.ts` | **3** | Financial accuracy: subtotal calculation, modifier price deltas, tax computation, and currency precision. |

---

## 3. Manual Acceptance Testing Procedures

For testing with a live backend and PostgreSQL database:

### 3.1 Restaurant Registration & Table Provisioning
1. Open `/register` in the browser.
2. Complete restaurant information (Name, Cuisine, Address, Phone) and Admin account (Name, Email, Password).
3. Click "Create Restaurant".
4. Confirm navigation to `/admin/dashboard`.
5. Navigate to `/admin/tables`.
6. Click "Add Dining Table" and enter "Table 1" (capacity 4).
7. Confirm Table 1 card appears with a rendered QR code.
8. Click "Download QR Code" and verify SVG file downloads to disk.

### 3.2 Customer QR Ordering Flow
1. Copy the "Customer Direct Ordering URL" displayed on the Table 1 card.
2. Open the URL in an incognito window or mobile browser:
   `/m/<slug>/table-1?token=<32_hex_token>`
3. Confirm the green "Verified Stand" badge is displayed.
4. Add items to cart and select customization options.
5. Open cart sheet, click "Proceed to Checkout".
6. Enter customer name and email.
7. Enter the 6-digit OTP code received (or simulated code in development).
8. Select "Pay at Counter" and submit order.
9. Verify redirect to `/m/<slug>/table-1/track/<order_id>`.

### 3.3 Kitchen KDS Order Processing
1. Log in or switch to a user with `KITCHEN_STAFF` role.
2. Open `/kitchen/orders`.
3. Confirm the new order ticket appears in real time.
4. Advance the ticket through: `Accept Order` -> `Start Prep` -> `Mark Ready` -> `Complete Order`.
5. In the customer tracking window, verify the progress bar updates live via WebSockets.
