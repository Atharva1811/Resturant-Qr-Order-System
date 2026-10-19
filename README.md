# 🍽️ Servora — Restaurant Ordering, Simplified

> Enterprise multi-tenant digital dining platform featuring customer QR ordering, live Kitchen Display System (KDS), restaurant operations management, and multi-tenant superadmin governance.

[![Deploy to GitHub Pages](https://github.com/Atharva1811/Resturant-Qr-Order-System/actions/workflows/deploy.yml/badge.svg)](https://github.com/Atharva1811/Resturant-Qr-Order-System/actions/workflows/deploy.yml)
[![Live Application](https://img.shields.io/badge/Live_App-GitHub_Pages-2ea44f?style=flat&logo=github)](https://atharva1811.github.io/Resturant-Qr-Order-System/)
[![Backend Tests](https://img.shields.io/badge/Tests-52%20Passed-brightgreen)](file:///c:/Users/athar/OneDrive/Desktop/PROJECTS/Sudarshan/docs/TESTING_AND_ACCEPTANCE.md)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20%2B%20Prisma-blue)](file:///c:/Users/athar/OneDrive/Desktop/PROJECTS/Sudarshan/docs/DATABASE_SETUP.md)

---

## 📚 Handover Documentation Index

For complete architectural specifications, deployment manuals, and verification evidence, see the dedicated documentation in [`docs/`](./docs/):

- 🏛️ **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** — Core responsibilities, directory structure, JWT & OTP auth flows, real-time Socket.IO protocols, and tenant isolation rules.
- 🚀 **[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)** — Step-by-step production deployment manual for PostgreSQL, Render Web Service, and GitHub Pages.
- 🔐 **[docs/ENVIRONMENT_VARIABLES.md](./docs/ENVIRONMENT_VARIABLES.md)** — Complete dictionary of all backend and frontend environment variables, secret classifications, and setup guides.
- 🗄️ **[docs/DATABASE_SETUP.md](./docs/DATABASE_SETUP.md)** — PostgreSQL & Prisma schema, ER diagrams, migration workflows, seed data, and initial superadmin provisioning.
- ✅ **[docs/TESTING_AND_ACCEPTANCE.md](./docs/TESTING_AND_ACCEPTANCE.md)** — Acceptance test matrix, Vitest test execution outputs, build evidence, and quality audit results.
- 📋 **[docs/HANDOVER_CHECKLIST.md](./docs/HANDOVER_CHECKLIST.md)** — Developer onboarding, service account transfer checklist, and operational sign-off fields.

---

## 🌐 Live GitHub Pages Deployment

- **Application URL:** [https://atharva1811.github.io/Resturant-Qr-Order-System/](https://atharva1811.github.io/Resturant-Qr-Order-System/)
- **Backend API Service:** Render Node.js runtime with PostgreSQL.

### Core Product Modules

| Module | Route | Purpose |
| :--- | :--- | :--- |
| 📱 **Customer Mobile Ordering** | `/m/:slug/:table` | Contactless QR ordering: live menu categories, dish customization, cart, email OTP, and order submission |
| 📍 **Live Order Tracker** | `/m/:slug/:table/track/:orderId` | Customer tracking page connected to real-time status updates via WebSocket |
| 👨‍🍳 **Kitchen Display (KDS)** | `/kitchen/orders` | Barista/chef touchscreen board with Web Audio alerts, ticket timers, and bump controls |
| 📊 **Restaurant Admin Dashboard** | `/admin/dashboard` | Live revenue metrics, real order history, menu category manager, and table QR code generator |
| 📋 **Orders Management** | `/admin/orders` | Filterable order queue with status transitions (Pending, Preparing, Ready, Delivered, Cancelled) |
| 🍽️ **Menu & Pricing** | `/admin/menu` | Multi-category item catalog with availability toggles and customization groups |
| 🪑 **Tables & QR Generator** | `/admin/tables` | Table capacity configuration, live QR preview, and printable table cards |
| 👥 **Staff Management** | `/admin/staff` | Role-based restaurant staff roster (Admin, Kitchen Staff, Waiter) |
| 📈 **Sales Analytics** | `/admin/analytics` | Dynamic revenue, average ticket size, and bestselling item analytics |
| ⚙️ **Restaurant Settings** | `/admin/settings` | Restaurant profile, dining room parameters, tax rate, and currency configuration |
| 🛡️ **Platform Superadmin** | `/superadmin` | Multi-tenant governance, restaurant provisioning, and platform health |
| 🔑 **Authentication** | `/login` | Secure JWT authentication against PostgreSQL with server-side role-based routing |

---

## ⚡ Quickstart: Local Development in 5 Minutes

### 1. Prerequisites
- **Node.js** v20.x or later
- **npm** v10.x or later
- **PostgreSQL** v14+ (or Docker)

### 2. Clone and Configure Environment
```bash
# Clone the repository
git clone https://github.com/Atharva1811/Resturant-Qr-Order-System.git
cd Resturant-Qr-Order-System

# Create environment files from templates
cp server/.env.example server/.env
cp shadcndashboard-main/.env.example shadcndashboard-main/.env
```

### 3. Setup Database & Backend
```bash
cd server

# Install dependencies
npm install

# Generate Prisma client and apply migrations
npm run prisma:generate
npx prisma migrate dev --name init

# (Optional) Seed development demo restaurant & menu data
npm run prisma:seed

# (Optional) Provision custom Superadmin
npm run create:superadmin admin@servora.app "SuperSecretPassword123!" "Platform Superadmin"

# Start backend dev server (port 5000)
npm run dev
```

### 4. Setup & Start Frontend
In a separate terminal:
```bash
cd shadcndashboard-main

# Install dependencies
npm install

# Start frontend dev server (port 5173)
npm run dev
```

Visit `http://localhost:5173/` in your browser.

---

## 🛠️ Complete Scripts Reference

### Backend (`server/package.json`)
| Script | Command | Purpose |
| :--- | :--- | :--- |
| `npm run dev` | `tsx watch src/index.ts` | Runs backend in development mode with hot reload. |
| `npm run build` | `tsc` | Compiles TypeScript source to `dist/`. |
| `npm start` | `node dist/index.js` | Runs compiled production server. |
| `npm test` | `vitest run` | Executes all 52 unit and integration tests. |
| `npm run prisma:generate` | `prisma generate` | Regenerates Prisma Client typings. |
| `npm run prisma:push` | `prisma db push` | Pushes schema directly to database (rapid prototyping). |
| `npm run prisma:migrate:deploy` | `prisma migrate deploy` | Safely executes pending database migrations in production. |
| `npm run prisma:migrate:status` | `prisma migrate status` | Checks migration synchronization status. |
| `npm run prisma:seed` | `tsx prisma/seed.ts` | Populates database with initial restaurants and menus. |
| `npm run create:superadmin` | `tsx src/scripts/create-superadmin.ts` | Provisions a privileged superadmin account in PostgreSQL. |

### Frontend (`shadcndashboard-main/package.json`)
| Script | Command | Purpose |
| :--- | :--- | :--- |
| `npm run dev` | `vite` | Starts local development server on port 5173 with HMR. |
| `npm run build` | `tsc && vite build` | Type-checks and builds optimized production bundle in `dist/`. |
| `npm run preview` | `vite preview` | Serves local production build preview. |
| `npm run lint` | `eslint . --ext ts,tsx` | Runs ESLint across all TypeScript and TSX files. |

---

## 🔒 Security & Data Isolation Guarantees

1. **No Direct Database Access from Browsers:** Browser code communicates exclusively via REST and WebSocket endpoints. `DATABASE_URL` is never exposed to the frontend.
2. **Server-Side Authorization:** Role authorization (`requireRole`) and tenant boundary enforcement (`requireTenant`) are executed on Express routes. Frontend role routing is strictly a UI convenience; the API fails closed if authorization tokens are forged or unauthorized.
3. **Password Hashing:** Passwords are never stored in plaintext and are hashed using bcrypt with 10 salt rounds. `passwordHash` is never returned in API payloads.
4. **Idempotent Order Handling:** Orders are protected by an in-memory hash verification window to prevent accidental duplicate submission.

---

## 📄 License & Attribution

Servora is open-source software licensed under the [MIT License](./LICENSE). Reusable UI layout foundation incorporates open-source components from the shadcn/ui community.
