# Servora — Database Architecture & Setup Guide

This guide details the PostgreSQL database architecture, Prisma ORM schema, migration workflows, and seed procedures for Servora.

---

## 1. Database Architecture & Technology Stack

- **Database Engine:** PostgreSQL 14+ (compatible with Supabase, Neon, Render PostgreSQL, AWS RDS).
- **ORM:** Prisma Client v5.22.0.
- **Data Strategy:** Multi-tenant shared database with row-level tenant keys (`restaurantId`), composite unique constraints, and cascade delete rules.
- **Snapshot Integrity:** Historical orders store immutable name, unit price, and customization snapshots to prevent historical reporting distortion when menu prices are updated.

---

## 2. Complete Model Entity Map

The schema is defined in [`server/prisma/schema.prisma`](file:///c:/Users/athar/OneDrive/Desktop/PROJECTS/Sudarshan/server/prisma/schema.prisma):

```mermaid
erDiagram
    Restaurant ||--o{ User : "has"
    Restaurant ||--o{ RestaurantStaff : "employs"
    Restaurant ||--o{ Table : "contains"
    Restaurant ||--o{ MenuCategory : "categorizes"
    Restaurant ||--o{ MenuItem : "serves"
    Restaurant ||--o{ Order : "receives"
    Restaurant ||--o{ Payment : "collects"
    Restaurant ||--o{ CustomerVerification : "verifies"
    Restaurant ||--o{ AuditEvent : "logs"

    User ||--o| RestaurantStaff : "linked to"
    User ||--o{ AuditEvent : "performs"

    MenuCategory ||--o{ MenuItem : "groups"
    MenuItem ||--o{ CustomizationGroup : "offers"
    CustomizationGroup ||--o{ CustomizationOption : "contains"

    Table ||--o{ Order : "placed at"
    Table ||--o{ CustomerVerification : "session"

    Order ||--o{ OrderItem : "contains"
    Order ||--o{ Payment : "paid via"
    Order ||--o{ AuditEvent : "tracks"
    OrderItem ||--o{ OrderItemCustomization : "customized by"
```

### Core Schema Highlights:
1. **`Restaurant`**: Central tenant entity with unique `slug`, business details, default currency, tax rate, and `RestaurantStatus` (`ACTIVE` | `SUSPENDED`).
2. **`User`**: Account identity storing `passwordHash` (bcrypt), `role` (`SUPERADMIN`, `RESTAURANT_ADMIN`, `KITCHEN_STAFF`, `WAITER`), and optional `restaurantId`.
3. **`Table`**: Dining table with unique `qrToken`, seating capacity, and composite unique constraint `@@unique([restaurantId, tableNumber])`.
4. **`MenuCategory` & `MenuItem`**: Menu items with boolean availability, dietary flags (`isVeg`), prep times, and relation to `CustomizationGroup`.
5. **`CustomerVerification`**: Stores ephemeral customer email OTP verification sessions. The OTP is stored as a cryptographic hash (`otpHash`), never in plaintext.
6. **`Order`**: Order header with `subtotal`, `tax`, `total`, `OrderStatus`, and table snapshots. Protected by composite unique key `@@unique([restaurantId, orderNumber])`.
7. **`OrderItem` & `OrderItemCustomization`**: Deep order tree capturing name and price deltas at the moment of order placement.
8. **`Payment`**: Financial reconciliation model with `idempotencyKey` and `transactionId`.
9. **`AuditEvent`**: Append-only security audit log tracking critical mutations with IP addresses.

---

## 3. Local Development Database Setup

### Step 1: Start PostgreSQL Locally
If using Docker, run:
```bash
docker run --name servora-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=servora_qr \
  -p 5432:5432 -d postgres:16-alpine
```

### Step 2: Configure Environment
In `server/.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/servora_qr?schema=public"
```

### Step 3: Initialize Database Schema
Run in the `server` directory:
```bash
# Generate the Prisma Client types
npm run prisma:generate

# Apply migrations to local database
npx prisma migrate dev --name init
```

### Step 4: Seed Development Data
Populate the database with sample restaurants (*The Rustic Hearth*, *Bella Italia*), tables, categories, items, and staff:
```bash
npm run prisma:seed
```

---

## 4. Production Migration Workflow

In production CI/CD or container deployments, **NEVER** run `prisma migrate dev` (which is interactive). Always use `prisma migrate deploy`:

```bash
# 1. Check pending migrations status
npx prisma migrate status

# 2. Safely apply pending migrations
npx prisma migrate deploy

# 3. Generate latest client
npx prisma generate
```

This ensures migrations execute within a transaction and halts deployment if schema conflicts occur.

---

## 5. Controlled Superadmin Provisioning

Servora never creates default administrative accounts automatically during server boot. To provision or update the primary `SUPERADMIN` account in PostgreSQL, use the controlled setup command:

```bash
# Syntax: npm run create:superadmin <email> <password> [name]
npm run create:superadmin superadmin@servora.app "ProductionSecurePass99!" "Global Superadmin"
```

*Command Features:*
- Validates password length (minimum 8 characters).
- Hashes password using bcrypt with 10 salt rounds.
- Uses `prisma.user.upsert` to safely create or update the user without duplicates.
- Sets role to `SUPERADMIN` and `isActive: true`.

---

## 6. Multi-Tenant Data Isolation Tests

The repository contains automated multi-tenancy isolation tests ([`server/src/tests/tenant-isolation.test.ts`](file:///c:/Users/athar/OneDrive/Desktop/PROJECTS/Sudarshan/server/src/tests/tenant-isolation.test.ts)):
1. **Menu Query Scoping:** Asserts that `GET /api/admin/menu` automatically appends `where: { restaurantId: req.user.restaurantId }`.
2. **Cross-Tenant Mutation Protection:** Asserts that kitchen staff of Tenant A cannot bump or cancel an order belonging to Tenant B (returns HTTP 403 Forbidden).
3. **Table Tamper Prevention:** Asserts that an order placed with a table number not belonging to the restaurant slug is rejected with HTTP 400.

Run isolation checks anytime with:
```bash
cd server
npm test src/tests/tenant-isolation.test.ts
```
