# Servora — Environment Variables Reference

This document provides a comprehensive inventory of all environment variables referenced across the Servora codebase (`server` and `shadcndashboard-main`).

> [!CAUTION]
> **Security Rule:** Any variable prefixed with `VITE_` is baked directly into the static JavaScript bundle during frontend compilation. It is **publicly readable by anyone** viewing the website in their browser. **NEVER** place database connection strings, JWT signing keys, private API keys, or payment secrets in `VITE_` variables or in the `shadcndashboard-main` folder.

---

## 1. Backend Service (`server`) Variables

These variables are consumed by the Node.js / Express backend runtime. They must be configured in `server/.env` (for local development) or in your hosting provider's dashboard (e.g., Render Environment Variables):

| Variable Name | Required? | Secret? | Default / Example | Purpose | How to Obtain / Configure |
| :--- | :---: | :---: | :--- | :--- | :--- |
| `PORT` | Optional | No | `5000` | Port on which the HTTP & Socket.IO server listens. | Assigned automatically by Render or set manually in local `.env`. |
| `NODE_ENV` | Required | No | `development` / `production` | Environment mode; toggles verbose logging, rate limiting, and dev bypasses. | Set to `production` on live hosting. |
| `DATABASE_URL` | **Required** | **YES** | `postgresql://user:pass@host:5432/db?sslmode=require` | PostgreSQL connection string utilized by Prisma Client & migrations. | Obtained from your PostgreSQL provider (Supabase, Neon, Render DB). |
| `JWT_SECRET` | **Required** | **YES** | *Secure random string* | Secret key for signing and verifying staff and customer JWT session tokens. | Generate via `openssl rand -hex 32` or node crypto. |
| `JWT_EXPIRES_IN` | Optional | No | `7d` | Token lifetime for staff and administrator authentication tokens. | Set desired expiry duration (e.g. `24h`, `7d`). |
| `FRONTEND_URL` | **Required** | No | `http://localhost:5173` | Allowed CORS origin and Socket.IO handshake origin. | Set to the exact deployed frontend URL (e.g. `https://<owner>.github.io/Resturant-Qr-Order-System`). |
| `BREVO_API_KEY` | Optional | **YES** | `xkeysib-...` | Brevo API key for delivering 6-digit transactional email OTP codes to customers. | Generated from your [Brevo Dashboard](https://app.brevo.com/settings/keys/api). If left empty, runs in safe mock mode without logging secrets. |
| `BREVO_SENDER_EMAIL` | Optional | No | `orders@servora.app` | Verified sender email address used for Brevo transactional dispatches. | Must be a verified sender/domain in your Brevo account. |
| `BREVO_SENDER_NAME` | Optional | No | `Servora QR Ordering` | Sender display name appearing in customer inboxes. | Free-form brand string. |
| `PAYMENT_WEBHOOK_SECRET` | Optional | **YES** | *Secure random string* | HMAC secret used to verify payment provider webhook signatures. | Configured in your payment provider dashboard. |
| `RAZORPAY_KEY_ID` | Optional | No | `rzp_test_...` | Optional payment gateway key identifier for online orders. | From Razorpay developer settings. |
| `RAZORPAY_KEY_SECRET` | Optional | **YES** | *Secret string* | Optional payment gateway secret for online orders. | From Razorpay developer settings. |
| `SEED_ADMIN_PASSWORD` | Optional | **YES** | `DevAdminPass123!` | Password used when executing the seed script `npm run prisma:seed`. | Set in local development or CI before seeding. |
| `SUPERADMIN_EMAIL` | Optional | No | `admin@servora.app` | Email passed to `npm run create:superadmin`. | Target email for initial superadmin provisioning. |
| `SUPERADMIN_PASSWORD` | Optional | **YES** | *Minimum 8 chars* | Password passed to `npm run create:superadmin`. | Initial superadmin password. |
| `SUPERADMIN_NAME` | Optional | No | `Platform Superadmin` | Display name for the initial superadmin. | Free-form name string. |
| `ENABLE_DEV_OTP_BYPASS` | Optional | No | `false` | Development-only guard. If true and `NODE_ENV !== 'production'`, allows static OTP. | Strictly disabled / ignored in production. |
| `DEV_STATIC_OTP` | Optional | No | `123456` | Static test code when `ENABLE_DEV_OTP_BYPASS` is true. | For automated UI testing in development only. |

---

## 2. Frontend Application (`shadcndashboard-main`) Variables

These variables configure the React single-page application. They are read by Vite at compile time:

| Variable Name | Required? | Secret? | Default / Example | Purpose | Where to Configure |
| :--- | :---: | :---: | :--- | :--- | :--- |
| `VITE_API_URL` | **Required** | **NO** | `https://servora-restaurant-server.onrender.com/api` | Backend API base URL accessible from user browsers. | GitHub Actions Secrets or `.env.production`. |
| `VITE_API_BASE_URL` | Optional | **NO** | `http://localhost:5000/api` | Fallback alias for `VITE_API_URL`. | `shadcndashboard-main/.env`. |
| `VITE_SOCKET_URL` | **Required** | **NO** | `https://servora-restaurant-server.onrender.com` | Base URL for Socket.IO WebSocket real-time connections. | GitHub Actions Secrets or `.env.production`. |
| `VITE_BASE_PATH` | Optional | **NO** | `/Resturant-Qr-Order-System/` | Base URL path for Vite bundle assets and SPA routing. | Set in `.github/workflows/deploy.yml` or `vite.config.ts`. Set to `/` if using a custom root domain. |

---

## 3. Environment Template Verification

Both services provide safe, non-secret `.env.example` templates:
- **Backend Template:** [`server/.env.example`](file:///c:/Users/athar/OneDrive/Desktop/PROJECTS/Sudarshan/server/.env.example)
- **Frontend Template:** [`shadcndashboard-main/.env.example`](file:///c:/Users/athar/OneDrive/Desktop/PROJECTS/Sudarshan/shadcndashboard-main/.env.example)

### Local Development Setup:
```bash
# 1. Setup backend environment
cp server/.env.example server/.env

# 2. Setup frontend environment
cp shadcndashboard-main/.env.example shadcndashboard-main/.env
```
