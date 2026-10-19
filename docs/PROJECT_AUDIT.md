# Servora — Comprehensive Project Audit & Feature Inventory

**Project Name:** Servora  
**Repository:** [Atharva1811/Resturant-Qr-Order-System](https://github.com/Atharva1811/Resturant-Qr-Order-System.git)  
**Date:** October 2026  
**Status:** Clean Production-Ready Codebase (Mock Test Mode Fully Removed)

---

## 1. Executive Summary

Servora is a dual-tier, multi-tenant digital restaurant management and QR ordering platform:
- **Frontend:** Single-page React 19 application built with Vite, TypeScript, and Tailwind CSS. Hosted on GitHub Pages with subpath `/Resturant-Qr-Order-System/`.
- **Backend:** Express & Node.js 20 server utilizing dual-protocol HTTP REST APIs and real-time Socket.IO event streaming. Configured for Render container hosting.
- **Database:** Supabase PostgreSQL managed through Prisma ORM with strict foreign keys, cascade policies, and row-level multi-tenant isolation.
- **Email Delivery:** Brevo transactional email API with HMAC-SHA256 hashed one-time passwords for customer session verification.

All temporary mock test modes, fake database fallbacks, and sample preview bypasses have been completely eradicated. Network calls now interact strictly with real backend endpoints and propagate clear, actionable errors if the backend is unreachable.

---

## 2. Feature Inventory

| Feature Area | Implementation Status | Evidence / Verification | Live Service Dependency |
| :--- | :---: | :--- | :--- |
| **Tenant Registration** | **Verified in Code & Tests** | `POST /api/auth/register-restaurant` creates restaurant + admin user transactionally. | PostgreSQL database |
| **Authentication & Sessions** | **Verified in Code & Tests** | Argon2id password hashing, JWT signing (8h expiry), `authenticateJwt` middleware. | PostgreSQL database |
| **Role-Based Access Control** | **Verified in Code & Tests** | Strict server-side role checks (`SUPERADMIN`, `RESTAURANT_ADMIN`, `KITCHEN_STAFF`). | None (middleware verified) |
| **Table QR Code Generation** | **Verified in Code & Tests** | 32-hex cryptographic token generation; high-resolution SVG generation via `qrcode.react`. | Backend running |
| **Public Customer Menu** | **Verified in Code & Tests** | Isolated mobile layout at `/m/:slug/:table`; dietary filters; modifier customization groups. | Backend running |
| **Table Token Verification** | **Verified in Code & Tests** | `GET /api/public/tables/verify` validates table existence, active status, and matching token. | PostgreSQL database |
| **Customer Email OTP** | **Verified in Code & Tests** | HMAC-SHA256 OTP hashing; 5-min expiration; 5-attempt brute-force throttling. | Brevo API key for live inbox delivery |
| **Customer Order Creation** | **Verified in Code & Tests** | Server-side price recalculation; tax rate computation; PostgreSQL order snapshot. | PostgreSQL database |
| **Real-Time Kitchen KDS** | **Verified in Code & Tests** | WebSocket room `restaurant:<id>` broadcasts `order:created` and `order:status_updated`. | Backend Socket server |
| **Admin Dashboard & Analytics**| **Verified in Code & Tests** | Financial summary, order counts, charts via Recharts, CSV export. | PostgreSQL database |
| **Superadmin Oversight** | **Verified in Code & Tests** | Platform-wide tenant management and account suspension controls. | PostgreSQL database |
| **Payment Integration** | **Verified in Code & Tests** | Counter pay cash flow + HMAC-SHA256 signed online webhook verification. | Payment Gateway Webhook |

---

## 3. Codebase Structure

```
├── .github/workflows/
│   └── deploy.yml              # GitHub Actions CI/CD: Server vitest suite -> GitHub Pages deploy
├── docs/                       # Comprehensive architectural & handover documentation
├── render.yaml                 # Infrastructure-as-code for Render backend deployment
├── server/                     # Node.js + Express backend
│   ├── prisma/
│   │   ├── schema.prisma       # Prisma data model (12 tables, strict relational constraints)
│   │   └── seed.ts             # Initial superadmin & sample restaurant seed script
│   └── src/
│       ├── config/             # Environment validation with Zod
│       ├── controllers/        # Domain controllers (auth, public, admin, kitchen, superadmin)
│       ├── middleware/         # JWT verification, tenant scoping, RBAC, error handling
│       ├── routes/             # Express route declarations
│       ├── services/           # Business logic: QR token service, Brevo email, Socket.IO
│       └── tests/              # 11 Vitest test suites (75 automated unit & integration tests)
└── shadcndashboard-main/       # React 19 + Vite frontend
    ├── src/
    │   ├── api/                # Real API & Socket.IO clients (zero mock fallbacks)
    │   ├── components/ui/      # Tailwind UI component primitives
    │   ├── config/             # Brand config and API base URL resolution
    │   ├── context/            # React context managing cart, tables, orders, auth state
    │   ├── layouts/            # FullLayout (Admin/KDS) and BlankLayout (Customer/Auth)
    │   └── views/              # Page views for Admin, Kitchen, Customer, and Superadmin
    └── vite.config.ts          # SPA base path configuration + 404.html fallback generation
```

---

## 4. Known Limitations & Outstanding Live Verification Requirements

1. **Live PostgreSQL Connection:** While the entire database layer and Prisma schema pass schema validation and test fixtures, real data persistence requires the owner to supply a valid `DATABASE_URL` pointing to their Supabase/PostgreSQL instance.
2. **Transactional Email Inbox Delivery:** While HMAC generation, hashing, rate limiting, and simulation pass all 10 unit tests, live delivery into real customer inboxes requires setting a valid `BREVO_API_KEY` on the backend.
3. **Payment Provider Webhook Keys:** Online checkout is architected for webhook confirmation via `PAYMENT_WEBHOOK_SECRET`. Counter pay (cash) is fully operational out of the box.
