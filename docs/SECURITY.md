# Servora — Security & Multi-Tenancy Architecture

This document outlines the security architecture, authentication mechanisms, authorization policies, and tenant isolation controls implemented across Servora.

---

## 1. Authentication Architecture

### 1.1 Password Hashing
All user passwords are encrypted using **Argon2id** (via the `argon2` npm package) with memory-hard parameters configured to resist GPU/ASIC brute-force attacks:
- Algorithms: Argon2id
- Password Minimum Length: 8 characters enforced at both frontend form level and backend Zod schema validation.

### 1.2 JSON Web Tokens (JWT)
Upon successful authentication, the server signs a cryptographic JWT using the server's private `JWT_SECRET`:
- **Algorithm:** HS256
- **Token Expiry:** 8 hours
- **Payload Contents:** `userId`, `email`, `role`, and `restaurantId` (omitted for Superadmin).
- **Client Storage:** Stored in browser `localStorage` under `servora_auth_token`.

---

## 2. Role-Based Access Control (RBAC)

Authorization is authoritatively enforced on the backend via Express middleware in [`server/src/middleware/auth.middleware.ts`](file:///c:/Users/athar/OneDrive/Desktop/PROJECTS/Sudarshan/server/src/middleware/auth.middleware.ts). Client-side UI visibility controls are purely cosmetic and never trusted for security.

| Role | Scope | Permitted Endpoints & Actions |
| :--- | :--- | :--- |
| **`SUPERADMIN`** | Platform-wide | Manage all restaurants, suspend/activate tenants, view aggregate GMV and system metrics. |
| **`RESTAURANT_ADMIN`** | Single Tenant | Manage menu categories, items, dining tables, QR tokens, staff invitations, and view restaurant analytics. |
| **`KITCHEN_STAFF`** | Single Tenant | View live KDS orders, update order statuses (`ACCEPTED`, `PREPARING`, `READY`, `COMPLETED`). |
| **`WAITER`** | Single Tenant | View table orders and assist dining guests. |
| **`CUSTOMER`** | Public Scan | View public digital menu, verify table stand, request email OTP, and place orders for their scanned table. |

---

## 3. Multi-Tenant Isolation

Servora utilizes a shared-database, shared-schema architecture with row-level tenant foreign keys:

1. **Authoritative Context:** `req.restaurantId` is extracted directly from the verified JWT payload, not from client request parameters.
2. **Database Scoping:** All Prisma mutations and queries scope by `where: { restaurantId }`:
   ```typescript
   // Example from admin.controller.ts
   const tables = await prisma.table.findMany({
     where: { restaurantId: req.restaurantId },
   });
   ```
3. **Tenant Boundary Tests:** The automated test suite [`server/src/tests/tenant-isolation.test.ts`](file:///c:/Users/athar/OneDrive/Desktop/PROJECTS/Sudarshan/server/src/tests/tenant-isolation.test.ts) verifies that an administrator from Tenant A receives HTTP 404 or HTTP 403 if they attempt to view, edit, or delete items belonging to Tenant B.

---

## 4. Secrets & Environment Variable Hygiene

To prevent data leaks and accidental credential exposure:
1. **Frontend Isolation:** No database strings, JWT secrets, Brevo keys, or payment webhook secrets are ever provided to `VITE_*` variables.
2. **Git Hygiene:** All `.env` and `.env.local` files are excluded in `.gitignore`. Only `.env.example` templates with generic placeholders are committed.
3. **Report Redaction:** Real credentials and tokens must never be logged or printed in audit reports.

---

## 5. Network Security & HTTP Headers

1. **Helmet:** Automatically sets HTTP security headers:
   - `Content-Security-Policy`
   - `X-Frame-Options: SAMEORIGIN` (prevents clickjacking)
   - `X-Content-Type-Options: nosniff` (prevents MIME-type sniffing)
   - `Strict-Transport-Security` (enforces HTTPS)
2. **CORS:** Only explicitly allowed origins can interact with the API:
   - GitHub Pages: `https://atharva1811.github.io`
   - Configured `FRONTEND_URL` from environment
   - Local development: `http://localhost:5173` and `http://127.0.0.1:5173`
3. **Mixed Content Prevention:** When the frontend is hosted on GitHub Pages (HTTPS), the backend must be deployed over HTTPS (e.g., Render SSL) to prevent browser mixed-content blocks.
