# Servora — Developer Handover & Operational Sign-Off Checklist

This checklist must be reviewed and signed off by the receiving engineering team during repository handover.

---

## 1. Access & Account Transfers

| Item | Action Required | Status | Verified By |
| :--- | :--- | :---: | :--- |
| **GitHub Repository** | Transfer ownership or grant `Admin` privileges on `Resturant-Qr-Order-System`. | [ ] | |
| **Render Web Service** | Transfer Render team ownership or add administrator email. | [ ] | |
| **PostgreSQL Database** | Transfer ownership of Supabase / Neon project or provide admin credentials. | [ ] | |
| **Brevo Account** | Transfer Brevo account or invite new developer with API key management privileges. | [ ] | |
| **DNS / Domain Control** | Transfer custom domain DNS records (`app.servora.com` / `api.servora.com`). | [ ] | |

---

## 2. Infrastructure & Environment Setup

| Item | Action Required | Status | Verified By |
| :--- | :--- | :---: | :--- |
| **Production Secrets** | Generate and set `JWT_SECRET`, `PAYMENT_WEBHOOK_SECRET` in Render. | [ ] | |
| **Database Connection** | Set `DATABASE_URL` in Render and verify connectivity on port 5432. | [ ] | |
| **CORS Alignment** | Set `FRONTEND_URL` in Render to match exact deployed frontend domain. | [ ] | |
| **GitHub Actions Secrets** | Set `VITE_API_URL` and `VITE_SOCKET_URL` in GitHub Repository Secrets. | [ ] | |
| **GitHub Pages Source** | Ensure GitHub Pages deployment source is set to **GitHub Actions**. | [ ] | |

---

## 3. Database & Superadmin Initial Provisioning

| Item | Action Required | Status | Verified By |
| :--- | :--- | :---: | :--- |
| **Migrations Applied** | Run `npx prisma migrate deploy` and confirm all migrations are clean. | [ ] | |
| **Superadmin Account** | Run `npm run create:superadmin <email> <password>` to create primary admin. | [ ] | |
| **Tenant Onboarding** | Log into `/login` as Superadmin and verify tenant onboarding in `/superadmin`. | [ ] | |

---

## 4. End-to-End Application Verification

| Item | Verification Procedure | Status | Verified By |
| :--- | :--- | :---: | :--- |
| **Backend Health** | `curl https://<backend-domain>/api/health` returns `status: UP`. | [ ] | |
| **Frontend Assets** | Page loads at `https://<owner>.github.io/Resturant-Qr-Order-System` without 404s. | [ ] | |
| **SPA Refresh** | Direct browser refresh on `/admin/dashboard` or `/login` resolves properly. | [ ] | |
| **Staff Login** | Authenticate via `/login` as `RESTAURANT_ADMIN`; confirms dashboard access. | [ ] | |
| **Customer QR Menu** | Load `/m/:slug/:table` on a mobile viewport; confirm items, addons, cart. | [ ] | |
| **Live Order to KDS** | Place order from customer view; confirm real-time card appears on `/kitchen`. | [ ] | |
| **Status Update** | Bump ticket on `/kitchen`; confirm status changes on customer tracking view. | [ ] | |

---

## 5. Known Operational Characteristics & Limitations

1. **In-Memory Rate Limiter:** The backend uses an in-memory sliding window rate limiter store. If scaling to multiple load-balanced backend replicas in the future, migrate the store to Redis (`ioredis`).
2. **Brevo Mock Fallback:** When `BREVO_API_KEY` is not supplied, the backend simulates email delivery without throwing errors. For live customer OTPs, a valid Brevo key is required.
3. **Socket.IO Sticky Sessions:** If scaling the Render service beyond 1 instance, configure Redis adapter (`@socket.io/redis-adapter`) for multi-node event synchronization.

---

## 6. Formal Handover Sign-Off

### Outgoing Engineering Lead:
- **Name:** Atharva
- **Role:** Full-Stack Architect / DevOps
- **Date:** October 19, 2026
- **Signature:** *Atharva (Digital Sign-Off)*

### Incoming Engineering Lead:
- **Name:** ___________________________
- **Role:** ___________________________
- **Date:** ___________________________
- **Signature:** ___________________________
