# 🍽️ Sudarshan — QR Restaurant Order & Management System

> High-performance, multi-tenant digital dining platform featuring customer QR ordering, kitchen display system (KDS), restaurant management dashboard, and superadmin governance.

[![Deploy to GitHub Pages](https://github.com/Atharva1811/Resturant-Qr-Order-System/actions/workflows/deploy.yml/badge.svg)](https://github.com/Atharva1811/Resturant-Qr-Order-System/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/Live_Demo-GitHub_Pages-2ea44f?style=flat&logo=github)](https://atharva1811.github.io/Resturant-Qr-Order-System/)

---

## 🌐 Live GitHub Pages Demo

Explore the full application deployed live on GitHub Pages:
👉 **[https://atharva1811.github.io/Resturant-Qr-Order-System/](https://atharva1811.github.io/Resturant-Qr-Order-System/)**

### Quick Demo Navigation

| View | Path | Description |
| :--- | :--- | :--- |
| 📱 **Customer Mobile Ordering** | `/m/rustic-hearth/table-4` | Browse food items, dietary filters, cart, OTP email verification & live tracking |
| 👨‍🍳 **Kitchen Display (KDS)** | `/kitchen/orders` | Barista/chef touchscreen board with audio cue notifications and ticket timers |
| 📊 **Restaurant Admin Dashboard** | `/admin/dashboard` | Live revenue stats, order status kanban, menu editor, and table QR code generator |
| 🛡️ **Superadmin Control Center** | `/superadmin` | Multi-restaurant tenant provisioning, platform-wide metrics & settings |
| 🔑 **Demo Switcher / Login** | `/login` | Instant one-click persona switcher to jump between roles |

---

## ✨ System Architecture

The project is structured as a fullstack monorepo:

```
├── .github/workflows/deploy.yml  # Automated GitHub Actions deployment pipeline
├── shadcndashboard-main/         # Frontend Web Application (Vite + React 19 + TS + Tailwind)
│   ├── src/
│   │   ├── api/                  # API client, Socket.io client, MSW browser mocks
│   │   ├── components/           # UI components (Shadcn + Radix + Lucide)
│   │   ├── context/              # RestaurantContext, Cart state, ThemeContext
│   │   ├── routes/               # Central React Router v7 configuration
│   │   └── views/                # Customer, Kitchen, Admin, and Superadmin views
│   └── public/                   # Static assets & Mock Service Worker
└── server/                       # Backend API & WebSocket Engine (Express + TypeScript)
    ├── prisma/                   # PostgreSQL schema and database migrations
    └── src/
        ├── controllers/          # Superadmin, Admin, Order, Menu, OTP controllers
        ├── routes/               # Typed REST API endpoints
        ├── services/             # Prisma DB queries, Brevo Email OTP, QR generation
        └── sockets/              # Socket.IO rooms for instant kitchen/admin sync
```

---

## 🚀 Key Features

- **Dynamic Table QR Codes**: Instant SVG/PNG QR code generation with restaurant branding, deep-linking directly to specific table menus.
- **Client-Side Mock Fallback (MSW)**: Standalone demo works 100% in any static hosting environment (like GitHub Pages) with complete mock data, while auto-connecting to the Node.js backend when running.
- **Real-Time WebSocket Sync**: Instant order dispatch to the Kitchen Display System without page reloads.
- **Secure Email OTP Authentication**: 6-digit one-time passcode verification powered by Brevo (Sendinblue) with 5-minute expiry and attempt throttling.
- **Touch-Optimized KDS**: Audio alerts, elapsed ticket timers, high-contrast badges, and bump controls.
- **Role-Based Access**: Granular protection separating Customers, Waitstaff, Kitchen Staff, Restaurant Managers, and Superadmins.

---

## 💻 Local Setup & Development

### 1. Prerequisites
- **Node.js** v18+ or v20+
- **npm** v9+
- *(Optional for full backend)* **PostgreSQL** v14+

### 2. Frontend (Dashboard & Mobile Web App)

```bash
cd shadcndashboard-main
npm install
npm run dev
```

The app will start at `http://localhost:5173/`.

### 3. Backend Server (Optional for full API persistence)

```bash
cd server
npm install
cp .env.example .env
# Update DATABASE_URL and optional BREVO_API_KEY in .env
npx prisma migrate dev --name init
npm run dev
```

The server will run on `http://localhost:5000/api`.

---

## 📦 GitHub Pages Hosting

The repository is configured with automated GitHub Actions:
- **Automatic Build**: On every push to `main` or `master`, Vite compiles with the repository base path `/Resturant-Qr-Order-System/`.
- **SPA Routing Support**: Automatically generates `404.html` so direct deep links and page reloads work seamlessly without 404 errors.
- **Dual Deployment**: Pushes to `gh-pages` branch and publishes directly via GitHub Pages Actions.

To enable GitHub Pages in your fork or repository:
1. Go to repository **Settings** > **Pages**.
2. Under **Build and deployment > Source**, select either:
   - **GitHub Actions** (recommended), or
   - **Deploy from a branch** > branch: `gh-pages` / folder: `/(root)`.
3. Save, and your app will be live at `https://<your-username>.github.io/Resturant-Qr-Order-System/`!

---

## 📄 License
This project is licensed under the MIT License.
