# Servora — Troubleshooting Guide

This guide provides actionable solutions for common deployment, connection, and runtime issues.

---

## 1. Network Issues: "Failed to fetch" & API Connectivity

### Symptom: Browser displays "Cannot reach Servora API" or "Failed to fetch"

#### Cause 1: Backend Server is Offline or Not Started
- **Diagnosis:** The browser attempts to make HTTP requests to `http://localhost:5000/api` or the deployed Render URL, but no process is listening.
- **Fix:**
  - In local development: start the server via `cd server && npm run dev`.
  - In production: verify that your Render web service is in the **Live** state and the health check at `/api/health` returns `{"status":"UP"}`.

#### Cause 2: Unconfigured API URL in Production
- **Diagnosis:** The frontend was built without `VITE_API_URL` or `VITE_API_BASE_URL`.
- **Fix:** Set the GitHub secret `VITE_API_URL` to your live backend endpoint (e.g., `https://servora-restaurant-server.onrender.com/api`) and trigger a new deployment.

#### Cause 3: Mixed Content Block (HTTPS -> HTTP)
- **Diagnosis:** Frontend hosted on HTTPS (`https://atharva1811.github.io`) connects to an unencrypted `http://` backend URL. The browser blocks the request under security policies.
- **Fix:** Ensure the backend is served over valid SSL/HTTPS (e.g., using Render's automatic TLS certificates) and configure `VITE_API_BASE_URL` with `https://`.

---

## 2. Database & Prisma Errors

### Symptom: `P1001: Can't reach database server at ...`
- **Cause:** Network unreachable, invalid credentials, or incorrect Supabase connection pooling configuration.
- **Fix:**
  - Verify your `DATABASE_URL` in `server/.env`.
  - For Supabase:
    - Use the **Transaction Pooler** connection string (port `6543`) with `?pgbouncer=true` if connecting in serverless or container environments.
    - Or use the **Session Mode** / Direct connection string (port `5432`) for running `npx prisma migrate deploy`.

### Symptom: `P2002: Unique constraint failed on the fields: (tableNumber, restaurantId)`
- **Cause:** Attempting to create a duplicate table number within the same restaurant.
- **Fix:** Table numbers must be unique per restaurant tenant. Change the table number (e.g., "Table 1B").

---

## 3. QR Code & Table Verification Issues

### Symptom: Customer sees "Table Stand Verification Notice: Invalid or expired QR code token"
- **Cause:** The QR code URL contains a token that does not match the active `qrToken` in the database for that table. This happens if an administrator regenerated the QR token after the physical QR code was printed.
- **Fix:** Open the Admin Dashboard -> Tables view, click "View QR Code" on the affected table, and re-print or re-download the new stand QR code.

### Symptom: Customer sees "Table is currently reserved"
- **Cause:** The table's status in the database is set to `RESERVED`.
- **Fix:** In the Admin Dashboard -> Tables view, edit the table and change its status back to `AVAILABLE`.

---

## 4. Email OTP Delivery Issues

### Symptom: Customer does not receive 6-digit verification code in their email inbox
- **Cause 1:** `BREVO_API_KEY` is not configured in `server/.env`.
  - In development mode without an API key, the server safely runs in mock delivery mode and logs:
    `[Brevo Service] Simulated email OTP dispatch to ...`
  - In mock mode, check the server console logs for the simulated delivery.
- **Cause 2:** Sender email is not verified.
  - In Brevo, the `BREVO_SENDER_EMAIL` (e.g. `orders@servora.app`) must be added to your verified senders list in your Brevo account dashboard.
- **Cause 3:** Rate limiting.
  - If more than 5 attempts are made within 15 minutes, requests are throttled with HTTP 429. Wait 15 minutes or test with another email address.

---

## 5. GitHub Pages Deep Route 404 on Refresh

### Symptom: Refreshing a route like `/m/rustic-hearth/table-1` returns GitHub 404 page
- **Cause:** GitHub Pages is a static file host and looks for a physical directory matching the path.
- **Fix:** The repository automatically compiles `dist/404.html` as a copy of `dist/index.html` during the Vite production build (`copy404Plugin` in `vite.config.ts`), and `.github/workflows/deploy.yml` ensures `404.html` and `.nojekyll` are present. Ensure you do not remove this plugin or file.
