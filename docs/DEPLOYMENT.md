# Servora — Production Deployment Manual

This guide provides end-to-end instructions for deploying Servora to production using **PostgreSQL (Supabase / Render)**, **Render Web Services** for the backend, and **GitHub Pages** (or any static host) for the frontend SPA.

---

## 1. Prerequisites & Required Accounts

Before beginning deployment, ensure you have:
1. **GitHub Account** with admin access to the repository (`https://github.com/<owner>/Resturant-Qr-Order-System`).
2. **PostgreSQL Provider** (e.g. [Supabase](https://supabase.com), [Neon](https://neon.tech), or Render PostgreSQL).
3. **Render Account** ([render.com](https://render.com)) for hosting the Node.js / Express backend.
4. **Brevo Account** ([brevo.com](https://brevo.com)) for transactional customer email OTP dispatch.

---

## 2. Step 1: Provision the PostgreSQL Database

1. Create a new PostgreSQL instance on **Supabase** or **Neon**.
2. Retrieve the **Direct Connection String** (URI format):
   ```text
   postgresql://postgres:[YOUR-PASSWORD]@[YOUR-DB-HOST]:5432/postgres?sslmode=require
   ```
3. *Note on Connection Pooling:* If using Supabase, use the Transaction Pooler (port `6543`) or Session Pooler (port `5432`) for application traffic, but ensure direct connection on port `5432` is available for running migrations (`prisma migrate deploy`).

---

## 3. Step 2: Deploy the Backend to Render

### Option A: Automated Blueprint Deployment (Recommended)
The repository includes a ready-to-use [`render.yaml`](file:///c:/Users/athar/OneDrive/Desktop/PROJECTS/Sudarshan/render.yaml) file.

1. Log into your Render dashboard and navigate to **Blueprints**.
2. Click **New Blueprint Instance** and connect the repository.
3. Render will detect `render.yaml` and configure the web service `servora-restaurant-server`.
4. Fill in the required environment variables:
   - `DATABASE_URL`: Your production PostgreSQL connection string.
   - `BREVO_API_KEY`: Your Brevo transactional email key (optional for development).
   - `FRONTEND_URL`: URL of the deployed frontend (e.g., `https://<owner>.github.io/Resturant-Qr-Order-System`).
5. Click **Apply**.

### Option B: Manual Web Service Creation
1. Go to **Dashboard &rarr; New &rarr; Web Service**.
2. Select your repository.
3. Configure the settings:
   - **Name:** `servora-restaurant-server`
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Region:** Choose the region closest to your database.
   - **Branch:** `main`
   - **Build Command:**
     ```bash
     npm install && npx prisma generate && npm run build
     ```
   - **Start Command:**
     ```bash
     npx prisma migrate deploy && npm start
     ```
   - **Health Check Path:** `/api/health`
4. In the **Environment Variables** tab, add:
   - `NODE_ENV` = `production`
   - `PORT` = `5000`
   - `DATABASE_URL` = `postgresql://...`
   - `JWT_SECRET` = `[Generate a secure 64-character random string]`
   - `JWT_EXPIRES_IN` = `7d`
   - `FRONTEND_URL` = `https://<owner>.github.io/Resturant-Qr-Order-System`
   - `BREVO_API_KEY` = `xkeysib-...` (from your Brevo dashboard)
   - `BREVO_SENDER_EMAIL` = `orders@servora.app`
   - `BREVO_SENDER_NAME` = `Servora QR Ordering`
   - `PAYMENT_WEBHOOK_SECRET` = `[Generate a secure random string]`
5. Click **Create Web Service**.

---

## 4. Step 3: Provision the Initial Superadmin Account

Once the backend is deployed and migrations are applied, run the controlled provisioning script via the Render Web Shell (or locally connected to the production DB):

```bash
# In the server directory on the server / container:
npm run create:superadmin admin@servora.app "SuperSecretPassword123!" "Platform Superadmin"
```

*Expected output:*
```text
🔐 Provisioning privileged SUPERADMIN account for: admin@servora.app
✅ SUPERADMIN account successfully provisioned: [uuid] admin@servora.app
```

---

## 5. Step 4: Deploy the Frontend to GitHub Pages

The repository contains an automated GitHub Actions deployment workflow: [`.github/workflows/deploy.yml`](file:///c:/Users/athar/OneDrive/Desktop/PROJECTS/Sudarshan/.github/workflows/deploy.yml).

### 1. Configure Repository Settings
1. Go to your GitHub repository: **Settings &rarr; Pages**.
2. Under **Build and deployment &rarr; Source**, select **GitHub Actions**.

### 2. Configure GitHub Secrets
1. Go to **Settings &rarr; Secrets and variables &rarr; Actions**.
2. Add the following repository secrets:
   - `VITE_API_URL`: The URL of your deployed Render backend with `/api` path.  
     *Example:* `https://servora-restaurant-server.onrender.com/api`
   - `VITE_SOCKET_URL`: The base URL of your deployed Render backend without trailing slash.  
     *Example:* `https://servora-restaurant-server.onrender.com`

### 3. Base Path Configuration
- **GitHub Pages Subpath:** The workflow automatically sets `VITE_BASE_PATH: /Resturant-Qr-Order-System/`.
- **Custom Domain:** If deploying to a custom domain (e.g., `https://app.servora.com`), change `VITE_BASE_PATH: /` in `.github/workflows/deploy.yml` and add your `CNAME` file.

### 4. Trigger Deployment
Push any commit to `main` or trigger manually under **Actions &rarr; Deploy Servora to GitHub Pages &rarr; Run workflow**.

The workflow will:
1. Run the backend integration test suite (`npm test`).
2. Run frontend ESLint quality checks (`npm run lint`).
3. Compile the production bundle (`npm run build`).
4. Generate `.nojekyll` and `404.html` (SPA routing fallback).
5. Deploy to GitHub Pages.

---

## 6. Step 5: Verification & Post-Deployment Checklist

Execute these checks after deployment:

1. **Backend Health Check:**
   ```bash
   curl -i https://servora-restaurant-server.onrender.com/api/health
   ```
   *Expected Response:* HTTP 200 with `{"status":"UP","service":"Servora QR Backend","version":"1.0.0"}`.

2. **Frontend Loading:**
   Navigate to `https://<owner>.github.io/Resturant-Qr-Order-System/`. Verify that the page loads without 404s and assets are delivered.

3. **Login Test:**
   Navigate to `/login` and authenticate with your provisioned `SUPERADMIN` credentials. Verify redirection to `/superadmin`.

4. **Customer QR Menu:**
   Navigate to `/m/rustic-hearth/T-01`. Verify menu items, categories, and customization options display correctly.

5. **Live Kitchen KDS:**
   Open `/kitchen/orders` in one tab and place an order from `/m/rustic-hearth/T-01` in another tab. Verify the new order card appears instantly on the KDS board without manual refresh.

---

## 7. Troubleshooting Common Issues

| Issue | Cause | Resolution |
| :--- | :--- | :--- |
| **CORS Error in Browser** | `FRONTEND_URL` on Render does not match actual origin | Update `FRONTEND_URL` on Render to match your exact frontend domain (including protocol and no trailing slash). |
| **404 on Page Refresh (SPA)** | GitHub Pages does not route paths to index.html | Verify that `404.html` exists in `dist/` (handled automatically by `.github/workflows/deploy.yml`). |
| **Socket.IO Fails to Connect** | Mixed content (HTTP vs HTTPS) or wrong socket URL | Ensure `VITE_SOCKET_URL` uses `https://` in production and points to the Render host. |
| **Prisma Migration Error** | Connection pooler port used for migration | Ensure `DATABASE_URL` connects directly to port `5432` during build/migration step. |
| **Rate Limit 429 on Login** | More than 10 failed login attempts within 15 mins | Wait 15 minutes or restart the backend process to flush in-memory rate limits. |
