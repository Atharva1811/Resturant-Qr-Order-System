# Servora — Architecture & Technical Specifications

> **Provisional Product Name:** Servora  
> **Tagline:** Restaurant ordering, simplified  
> **Architecture Style:** Clean Multi-Tenant SaaS with Client-Server Separation  
> **Primary Interfaces:** Customer Mobile Web (QR), Kitchen Display System (KDS), Restaurant Admin Portal, Platform Superadmin Directory  

---

## 1. High-Level Architectural Overview

Servora is designed as an enterprise-grade, multi-tenant QR restaurant ordering and operations platform. It adheres strictly to modern web architecture principles:

1. **Client-Server Decoupling:** The frontend SPA (`shadcndashboard-main`) communicates with the backend solely via HTTPS REST endpoints and WSS Socket.IO channels. The browser code **never** connects directly to the PostgreSQL database.
2. **Fail-Closed Tenant Isolation:** Every restaurant tenant has an isolated data scope. Server-side middleware validates JWT claims and enforces tenant boundaries on all reads and writes.
3. **Dual Session Architecture:**
   - **Staff & Admin Sessions:** 7-day cryptographically signed JWT bearer tokens for restaurant personnel, scoped to their tenant and role.
   - **Customer Dining Sessions:** Ephemeral 4-hour tokens obtained via OTP email verification, bound strictly to a verified table and restaurant slug.
4. **Real-Time Event Distribution:** Order creation, status transitions, and kitchen ticket bumping propagate instantaneously via an event-driven Socket.IO engine.

```
                      ┌──────────────────────────────────────────┐
                      │          Browsers / Mobile Clients       │
                      │  • Customer QR Ordering (/m/:slug/:table)│
                      │  • Kitchen Display System (/kitchen)     │
                      │  • Restaurant Admin (/admin)             │
                      │  • Superadmin Portal (/superadmin)       │
                      └─────────────────────┬────────────────────┘
                                            │
                             HTTPS REST     │  WSS WebSockets
                                            ▼
                      ┌──────────────────────────────────────────┐
                      │         Servora Node.js Backend          │
                      │  • Express 4 API + Helmet Security       │
                      │  • Rate Limiters (Login, OTP, Orders)    │
                      │  • JWT Auth & Multi-Tenant Middleware    │
                      │  • Socket.IO Real-Time Engine            │
                      │  • Order State Machine & Pricing Logic   │
                      └─────────────┬───────────────────┬────────┘
                                    │                   │
                     Prisma ORM     │                   │ HTTPS API
                                    ▼                   ▼
                      ┌──────────────────────┐  ┌────────────────┐
                      │ PostgreSQL Database  │  │ Brevo API      │
                      │ • Multi-tenant Data  │  │ • Transactional│
                      │ • Relational Models  │  │   Email OTP    │
                      │ • Audit Event Log    │  └────────────────┘
                      └──────────────────────┘
```

---

## 2. Repository Structure

```
.
├── .github/
│   └── workflows/
│       └── deploy.yml              # CI/CD: Automated tests & GitHub Pages deployment
├── docs/                           # Developer handover documentation
│   ├── ARCHITECTURE.md             # This document
│   ├── DEPLOYMENT.md               # Production deployment manual
│   ├── ENVIRONMENT_VARIABLES.md    # Complete environment variable dictionary
│   ├── DATABASE_SETUP.md           # Database setup, migrations, and schema guide
│   ├── TESTING_AND_ACCEPTANCE.md   # Quality matrix and verification evidence
│   └── HANDOVER_CHECKLIST.md       # Operational transfer and sign-off checklist
├── render.yaml                     # Render Blueprints infrastructure definition
├── server/                         # Backend Express + Prisma service
│   ├── prisma/
│   │   ├── migrations/             # Safe PostgreSQL migrations
│   │   ├── schema.prisma           # Relational schema definition
│   │   └── seed.ts                 # Idempotent development seed script
│   ├── src/
│   │   ├── config/                 # Environment & configuration parser
│   │   ├── controllers/            # Request handlers (auth, admin, customer, public, etc.)
│   │   ├── lib/                    # Shared singletons (prisma client)
│   │   ├── middleware/             # Security, rate-limiters, JWT & RBAC guards
│   │   ├── routes/                 # Express router definitions
│   │   ├── scripts/                # Administrative utilities (create-superadmin CLI)
│   │   ├── services/               # Core business services (socket, email, payments)
│   │   ├── tests/                  # Automated integration & unit test suites (Vitest)
│   │   ├── types/                  # TypeScript interfaces & JWT payloads
│   │   ├── app.ts                  # Express application factory & middleware stack
│   │   └── index.ts                # HTTP + Socket.IO server bootstrap
│   ├── Dockerfile                  # Multi-stage production container build
│   ├── package.json
│   └── tsconfig.json
└── shadcndashboard-main/           # Frontend React + Vite application
    ├── public/
    │   └── favicon.svg             # Custom Servora vector favicon
    ├── src/
    │   ├── api/                    # HTTP (api-client) & WebSocket (socket-client) drivers
    │   ├── assets/                 # Vector SVG logos (darklogo, whitelogo, logoicon)
    │   ├── components/             # Reusable UI primitives (dialogs, tables, buttons)
    │   ├── config/                 # Central brand settings (brand.config.ts)
    │   ├── context/                # RestaurantContext (catalog, state, cart, active user)
    │   ├── layouts/                # Layout shells (FullLayout with sidebar, BlankLayout)
    │   ├── routes/                 # Route definitions (Router.tsx)
    │   ├── views/                  # Primary page views:
    │   │   ├── admin/              # Dashboard, orders, menu, tables, staff, settings
    │   │   ├── auth/               # Single Login.tsx & HTTP error status pages
    │   │   ├── customer/           # Mobile QR menu and live order tracker
    │   │   ├── kitchen/            # Live Kitchen Display System (KDS)
    │   │   └── superadmin/         # Tenant directory and multi-restaurant overview
    │   ├── main.tsx                # React entry point with Sonner toast provider
    │   └── index.css               # Design system tokens and styling
    ├── index.html
    ├── vite.config.ts
    ├── package.json
    └── tsconfig.json
```

---

## 3. Frontend Technology Stack & Design System

- **Framework:** React 19 with TypeScript.
- **Build Tool:** Vite 8 (optimized module bundling, sub-second HMR and production builds).
- **Styling:** Tailwind CSS with CSS custom variables for dark/light themes.
- **Component Primitives:** Radix UI primitives (`@radix-ui/*`) and shadcn-compatible accessible controls (Dialog, DropdownMenu, Tabs, Sheet, InputOTP, Tooltip, Badge).
- **Icons:** Lucide React and Tabler Icons (`@tabler/icons-react`).
- **Data Visualization:** ApexCharts / Recharts for administrative revenue and order volume analytics.
- **Notifications:** Sonner for toasts.
- **Centralized Brand Module:** [`src/config/brand.config.ts`](file:///c:/Users/athar/OneDrive/Desktop/PROJECTS/Sudarshan/shadcndashboard-main/src/config/brand.config.ts) defines brand title, tagline, support email, storage keys, and canonical routes in one location.

---

## 4. Backend Technology Stack & Security Architecture

- **Runtime:** Node.js 20+ with TypeScript.
- **Framework:** Express 4.
- **Database ORM:** Prisma Client 5.
- **Database Engine:** PostgreSQL 14+.
- **Security Middlewares:**
  - `helmet`: Sets HTTP security headers (HSTS, X-Content-Type-Options, Frameguard).
  - `cors`: Dynamic origin validation supporting local development, GitHub Pages (`.github.io`), and configured production domains.
  - Specialized rate limiting (`createRateLimiter`):
    - `loginLimiter`: 10 failed attempts / 15 minutes per IP + email.
    - `otpRequestLimiter`: 3 OTP requests / 5 minutes per email + IP.
    - `otpVerifyLimiter`: 5 verify attempts / 10 minutes.
- **Password Hashing:** `bcryptjs` with 10 salt rounds.
- **Tokens:** `jsonwebtoken` with HS256 algorithm and strict payload validation.

---

## 5. Authentication, Roles & Authorization

### User Roles
The platform defines four distinct user roles in the database enum `UserRole`:

1. **`SUPERADMIN`**: Platform-level operator. Can view platform-wide revenue metrics, onboard new restaurant tenants, and suspend/reactivate tenant accounts.
2. **`RESTAURANT_ADMIN`**: Full administrative authority over a specific restaurant tenant (menu categories, items, prices, availability, tables, staff accounts, tax rates, and sales analytics).
3. **`KITCHEN_STAFF`**: Operational authority over kitchen tickets. Views the Kitchen Display System (KDS) and updates ticket states (`PREPARING`, `READY`, `COMPLETED`).
4. **`WAITER`**: Floor staff. Views active table orders and records counter payments.

### Server-Side Route Protection
Route protection is enforced via chained Express middleware:
- **`authenticateJwt`**: Validates the `Authorization: Bearer <token>` header, decodes user identity, and populates `req.user`.
- **`requireRole(...roles)`**: Asserts that `req.user.role` matches one of the allowed roles (superadmin has universal bypass).
- **`requireTenant`**: Ensures non-superadmin users are restricted strictly to their assigned `restaurantId`. Superadmins can supply `x-restaurant-id` to act on behalf of a tenant.

### Ephemeral Customer Verification
Customers dining at tables verify their session without requiring permanent account registration:
1. Customer scans table QR code: `/m/:slug/:tableNumber`.
2. Frontend queries `GET /api/public/tables/verify?slug=...&table=...&token=...` to validate physical table token against PostgreSQL.
3. Customer enters email during checkout &rarr; backend creates a 6-digit cryptographic OTP, hashes it using HMAC-SHA256, and dispatches via Brevo transactional email.
4. Customer verifies OTP &rarr; backend issues an ephemeral 4-hour `CUSTOMER_SESSION` token.
5. All subsequent order creation requests require this token, ensuring orders cannot be spoofed or placed outside an active table session.

---

## 6. Real-Time Engine (Socket.IO)

The backend runs a dual-protocol HTTP + WebSocket server ([`socket.service.ts`](file:///c:/Users/athar/OneDrive/Desktop/PROJECTS/Sudarshan/server/src/services/socket.service.ts)):

- **Room Partitioning:**
  - `restaurant:{restaurantId}`: Joined by authorized staff and kitchen terminals. Receives all new orders and order status changes for that restaurant.
  - `order:{orderId}`: Joined by customer order tracking pages (`/m/:slug/:table/track/:orderId`). Receives real-time status transitions (`ACCEPTED`, `PREPARING`, `READY`, `COMPLETED`).
- **Server Events:**
  - `order:created`: Emitted when an order is submitted to the kitchen.
  - `order:status_updated`: Emitted when staff changes the state of an order.

---

## 7. Order State Machine & Integrity

Orders move through a deterministic state machine:
```
[ NEW ] ────────► [ ACCEPTED ] ────────► [ PREPARING ] ────────► [ READY ] ────────► [ COMPLETED ]
   │                     │                     │
   └─────────────────────┴─────────────────────┴───────────────────────────────► [ CANCELLED ]
```

- **Price Snapshot Integrity:** When an order is placed, line-item names, unit prices, customization options, and tax amounts are snapshotted into the `OrderItem` and `OrderItemCustomization` tables. Subsequent menu edits or price changes never alter historical orders.
- **Idempotency Protection:** Order creation endpoints check for duplicate submissions within a 5-second window using composite hashes of `[restaurantId, tableId, customerEmail, subtotal, itemsHash]`. Duplicate network retries return the original order without double-charging or creating duplicate kitchen tickets.
