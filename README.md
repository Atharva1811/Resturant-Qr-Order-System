# 🍽️ Servora — Restaurant Ordering, Simplified

> Enterprise multi-tenant digital dining platform featuring customer QR ordering, live kitchen display system (KDS), restaurant operations management, and multi-tenant superadmin governance.

[![Deploy to GitHub Pages](https://github.com/Atharva1811/Resturant-Qr-Order-System/actions/workflows/deploy.yml/badge.svg)](https://github.com/Atharva1811/Resturant-Qr-Order-System/actions/workflows/deploy.yml)
[![Live Application](https://img.shields.io/badge/Live_App-GitHub_Pages-2ea44f?style=flat&logo=github)](https://atharva1811.github.io/Resturant-Qr-Order-System/)

---

## 🌐 Live GitHub Pages Deployment

Explore the full application deployed live on GitHub Pages:
👉 **[https://atharva1811.github.io/Resturant-Qr-Order-System/](https://atharva1811.github.io/Resturant-Qr-Order-System/)**

### Core Product Modules

| Module | Route | Purpose |
| :--- | :--- | :--- |
| 📱 **Customer Mobile Ordering** | `/m/rustic-hearth/table-4` | Contactless QR ordering: live menu categories, dish customization, cart, email OTP, and order submission |
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
| 🔑 **Authentication** | `/login` | Secure JWT authentication with server-side role-based routing |

---

## ✨ System Architecture

Servora is structured as a fullstack monorepo:

```
├── .github/workflows/deploy.yml  # Automated GitHub Actions deployment pipeline
├── render.yaml                   # Render Web Service deployment blueprint
├── shadcndashboard-main/         # Frontend Web Application (Vite + React 19 + TypeScript + Tailwind)
│   ├── src/
│   │   ├── api/                  # REST & Socket.io client with production fallbacks
│   │   ├── assets/               # Servora vector branding & icons
│   │   ├── components/           # Reusable Radix UI & Tailwind design primitives
│   │   ├── config/               # Centralized branding configuration (brand.config.ts)
│   │   ├── context/              # RestaurantContext, Cart state, ThemeContext
│   │   ├── routes/               # Central React Router v7 configuration with basename
│   │   └── views/                # Customer, Kitchen, Admin, and Superadmin views
│   └── public/                   # Static assets, favicon.svg & 404 fallback
└── server/                       # Backend API & WebSocket Engine (Express + TypeScript + Prisma)
    ├── prisma/                   # PostgreSQL schema and migration scripts
    ├── Dockerfile                # Production multi-stage Alpine Docker container
    └── src/
        ├── controllers/          # Superadmin, Admin, Order, Menu, OTP controllers
        ├── routes/               # Typed REST API endpoints
        ├── services/             # Prisma DB queries, Brevo Email OTP, Socket.IO rooms
        └── tests/                # Automated Vitest unit and integration test suite
```

---

## 🚀 Key Features

- **Dynamic Table QR Codes**: Instant SVG/PNG QR code generation with deep links directly to table menus with repository base path support.
- **Fail-Closed Security**: Customer orders, staff mutations, and dashboard analytics operate on real database records and authorized server sessions.
- **Real-Time WebSocket Sync**: Instant order dispatch to the Kitchen Display System without page reloads using Socket.IO.
- **Transactional Email OTP**: 6-digit one-time passcode verification powered by Brevo with HMAC-SHA256 hashed storage, 5-minute expiry, and attempt throttling.
- **Touch-Optimized KDS**: Audio alerts via Web Audio API, elapsed ticket timers, high-contrast badges, and bump controls.
- **Multi-Tenant Isolation**: Tenant boundaries enforced on all database queries and real-time room events.

---

## 💻 Local Setup & Development

### 1. Prerequisites
- **Node.js** v20+
- **npm** v10+
- **PostgreSQL** v14+ (or Supabase instance)

### 2. Frontend Development

```bash
cd shadcndashboard-main
npm install
npm run dev
```

The frontend will run at `http://localhost:5173/`.

### 3. Backend Server

```bash
cd server
npm install
cp .env.example .env
# Configure DATABASE_URL and optional BREVO_API_KEY in .env
npx prisma generate
npx prisma migrate deploy
npm run dev
```

The server will run at `http://localhost:5000/api`.

---

## 📦 GitHub Pages Hosting

The repository includes an automated GitHub Actions workflow:
- **Build**: Compiles production static assets with Vite using base path `/Resturant-Qr-Order-System/`.
- **SPA Routing**: Automatically generates `404.html` and `.nojekyll` so direct URL navigation and page refreshes work without 404 errors.
- **Dual Deployment**: Deploys to `gh-pages` branch and publishes directly to GitHub Pages Actions.

To activate:
1. Open repository **Settings** > **Pages**.
2. Under **Build and deployment > Source**, select **GitHub Actions** (or **Deploy from a branch** > `gh-pages`).
3. Save, and your app will be live at `https://<your-username>.github.io/Resturant-Qr-Order-System/`!

---

## 📄 License
This project is licensed under the MIT License.
