# 🍽️ Servora — Restaurant Ordering, Simplified

> Enterprise multi-tenant digital dining platform featuring customer QR ordering, live Kitchen Display System (KDS), restaurant operations management, and multi-tenant superadmin governance.

[![Deploy to GitHub Pages](https://github.com/Atharva1811/Resturant-Qr-Order-System/actions/workflows/deploy.yml/badge.svg)](https://github.com/Atharva1811/Resturant-Qr-Order-System/actions/workflows/deploy.yml)
[![Live Application](https://img.shields.io/badge/Live_App-GitHub_Pages-2ea44f?style=flat&logo=github)](https://atharva1811.github.io/Resturant-Qr-Order-System/)
[![Backend Tests](https://img.shields.io/badge/Tests-75%20Passed-brightgreen)](./docs/TESTING.md)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20%2B%20Prisma-blue)](./docs/DATABASE_SETUP.md)

---

## 📚 Handover Documentation Package

For complete specifications, guides, and manuals, consult the documentation in [`docs/`](./docs/):

1. 📋 **[`docs/PROJECT_AUDIT.md`](./docs/PROJECT_AUDIT.md)** — Comprehensive project feature inventory, verified modules, and status classification.
2. 🏛️ **[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)** — Frontend/backend/database architecture, WebSocket protocols, and data flows.
3. 🛠️ **[`docs/SETUP.md`](./docs/SETUP.md)** — Step-by-step local setup, required software, environment templates, and seeding commands.
4. 🚀 **[`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)** — Production deployment manual for PostgreSQL, Render, and GitHub Pages.
5. 📱 **[`docs/QR_WORKFLOW.md`](./docs/QR_WORKFLOW.md)** — End-to-end QR code lifecycle, cryptographic token rotation, and customer routing.
6. 🔐 **[`docs/SECURITY.md`](./docs/SECURITY.md)** — Authentication, RBAC matrix, row-level tenant isolation, and secret hygiene.
7. ✅ **[`docs/TESTING.md`](./docs/TESTING.md)** — Vitest test execution outputs (75 tests), test suites, and manual acceptance test steps.
8. 🔧 **[`docs/TROUBLESHOOTING.md`](./docs/TROUBLESHOOTING.md)** — Diagnostic guides for "Failed to fetch", Mixed Content, Supabase pooling, and QR scanning.
9. ⚙️ **[`docs/ENVIRONMENT_VARIABLES.md`](./docs/ENVIRONMENT_VARIABLES.md)** — Complete dictionary of all environment variables and secrets.

---

## 🌐 Application Architecture & Live URLs

- **Frontend Deployment (GitHub Pages):** [https://atharva1811.github.io/Resturant-Qr-Order-System/](https://atharva1811.github.io/Resturant-Qr-Order-System/)
- **Backend API Service:** Render Node.js runtime with PostgreSQL.

### Core Product Modules

| Module | Route | Purpose |
| :--- | :--- | :--- |
| 📱 **Customer Mobile Ordering** | `/m/:slug/:table` | Contactless QR ordering: live menu categories, dish customization, cart, email OTP, and order submission |
| 📍 **Live Order Tracker** | `/m/:slug/:table/track/:orderId` | Customer tracking page connected to real-time status updates via WebSocket |
| 👨‍🍳 **Kitchen Display (KDS)** | `/kitchen/orders` | Barista/chef touchscreen board with Web Audio alerts, ticket timers, and bump controls |
| 📊 **Restaurant Admin Dashboard** | `/admin/dashboard` | Live revenue metrics, real order history, menu category manager, and table QR code generator |
| 📋 **Orders Management** | `/admin/orders` | Filterable order queue with status transitions (New, Accepted, Preparing, Ready, Completed) |
| 🍽️ **Menu & Pricing** | `/admin/menu` | Multi-category item catalog with availability toggles and customization groups |
| 🪑 **Tables & QR Generator** | `/admin/tables` | Table capacity configuration, live QR preview, printable cards, and token rotation |
| 👥 **Staff Management** | `/admin/staff` | Role-based restaurant staff roster (Admin, Kitchen Staff, Waiter) |
| 📈 **Sales Analytics** | `/admin/analytics` | Dynamic revenue, average ticket size, and bestselling item analytics |
| ⚙️ **Restaurant Settings** | `/admin/settings` | Restaurant profile, dining room parameters, tax rate, and currency configuration |
| 🛡️ **Platform Superadmin** | `/superadmin` | Multi-tenant governance, restaurant provisioning, and platform health |
| 🔑 **Authentication** | `/login` | Secure JWT authentication against PostgreSQL with server-side role-based routing |

---

## ⚡ Quickstart: Local Development

### 1. Backend Setup (`server/`)
```bash
cd server
npm install
cp .env.example .env

# Generate Prisma client and deploy migrations
npx prisma generate
npx prisma migrate deploy

# Seed database and provision initial Superadmin
npx tsx prisma/seed.ts

# Start development server on port 5000
npm run dev
```

### 2. Frontend Setup (`shadcndashboard-main/`)
In a separate terminal:
```bash
cd shadcndashboard-main
npm install
cp .env.example .env

# Start frontend dev server on port 5173
npm run dev
```

---

## 📋 Developer Handover Checklist

- [x] **Mock/test QR mode fully removed:** Zero mock fallbacks; failed requests produce meaningful errors.
- [x] **No fake production authentication or persistence:** Argon2id + PostgreSQL verification required.
- [x] **Frontend production build passes:** `tsc && vite build` builds in ~1.3s with zero type errors.
- [x] **Real backend API configuration verified:** No hardcoded localhost or invented fake URLs in production.
- [x] **Restaurant registration and login verified:** Transactional multi-tenant user and tenant provisioning.
- [x] **Table creation and QR generation verified:** 32-hex cryptographic random tokens with high entropy.
- [x] **QR opens the correct public customer page:** Canonical `/m/:slug/:table?token=...` with base path.
- [x] **Orders persist and map to correct restaurant/table:** Server-side price recalculation & tax application.
- [x] **Authorization and tenant isolation tested:** 11 Vitest test suites, 75 passing automated tests.
- [x] **Deployment and environment instructions complete:** Comprehensive guides in `docs/`.
- [x] **Known issues and unverified items disclosed:** Transparent reporting of live service dependencies.
