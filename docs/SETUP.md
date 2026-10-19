# Servora — Local Development & Setup Guide

This guide details the exact steps required to configure, install, and run the Servora platform locally.

---

## 1. Prerequisites

- **Node.js:** v20.x or higher LTS
- **Package Manager:** `npm` v10.x or higher
- **Database:** PostgreSQL v15+ (local instance or free cloud Supabase instance)
- **Git:** Standard CLI

---

## 2. Backend Setup (`server/`)

### 2.1 Install Dependencies
Open a terminal in the root and navigate to `server`:
```bash
cd server
npm install
```

### 2.2 Configure Environment Variables
Copy the example environment file to `.env`:
```bash
cp .env.example .env
```

Edit `server/.env` with your actual development values:
```ini
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/servora_db?schema=public
JWT_SECRET=generate_a_random_32_character_string_here
BREVO_API_KEY=xkeysib-optional-mock-mode-if-empty
BREVO_SENDER_EMAIL=orders@servora.app
BREVO_SENDER_NAME="Servora QR Ordering"
PAYMENT_WEBHOOK_SECRET=generate_a_random_32_character_string_here
```

### 2.3 Initialize Database with Prisma
Run the Prisma client generator and apply database migrations:
```bash
# Generate the TypeScript Prisma client
npx prisma generate

# Apply migrations to your local or Supabase database
npx prisma migrate deploy
```

### 2.4 Seed Initial Data & Superadmin
The repository provides an idempotent seeding script to bootstrap a default Superadmin and initial restaurant tenant:
```bash
# Run the seed script
npx tsx prisma/seed.ts
```
> [!NOTE]
> The seed script hashes passwords securely with Argon2id. You can customize the administrator credentials in `server/prisma/seed.ts` prior to running or change the password immediately after logging in.

### 2.5 Start Backend Server
```bash
# Development server with automatic hot-reloading
npm run dev
```
The backend API is now running at `http://localhost:5000` with health check available at `http://localhost:5000/api/health`.

---

## 3. Frontend Setup (`shadcndashboard-main/`)

### 3.1 Install Dependencies
Open a second terminal window and navigate to `shadcndashboard-main`:
```bash
cd shadcndashboard-main
npm install
```

### 3.2 Configure Environment Variables
Copy the example environment template:
```bash
cp .env.example .env
```

Edit `shadcndashboard-main/.env`:
```ini
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 3.3 Start Frontend Development Server
```bash
npm run dev
```
The frontend interface is now running at `http://localhost:5173`.

---

## 4. Verification & Testing

### 4.1 Run Backend Tests
In the `server/` directory:
```bash
npm test
```
All 75 automated unit and integration tests should pass with 100% success.

### 4.2 Run Frontend Linter & Build
In the `shadcndashboard-main/` directory:
```bash
# Linting check
npm run lint

# Production build check
npm run build
```
The build should succeed without warnings and output the compiled bundle into `dist/`.
