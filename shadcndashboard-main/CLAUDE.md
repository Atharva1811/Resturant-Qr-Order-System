# CLAUDE.md

This is the frontend single-page application for **Servora** — Restaurant Ordering, Simplified.

## Stack

- **Framework & Language**: React 19 + TypeScript (Vite 5)
- **Routing**: `react-router` v7 with `basename: import.meta.env.BASE_URL`
- **UI & Styling**: Radix UI / Base UI, Tailwind CSS v4, Lucide React, Lucide icons
- **State Management**: `RestaurantContext` for active tenant, cart, live orders, staff, tables, and role authorization
- **Real-Time Engine**: `socket.io-client` with automatic order room subscription
- **API Communication**: Typed REST API client (`src/api/api-client.ts`) with JWT bearer tokens

## Project Structure

- `src/components/ui` — Reusable Radix UI & Tailwind component library
- `src/config/brand.config.ts` — Centralized Servora branding, tagline, and metadata configuration
- `src/context/restaurant-context` — Central restaurant operational state
- `src/layouts` — App layouts (`FullLayout` with sidebar, `BlankLayout` for customer ordering)
- `src/routes/Router.tsx` — Client-side route registration
- `src/views/customer` — Customer QR menu and live order tracking
- `src/views/admin` — Orders, menu catalog, tables/QR, staff, analytics, and settings
- `src/views/kitchen` — Kitchen Display System (KDS)
- `src/views/superadmin` — Platform overview and tenant directory
- `src/views/auth` — Login and error pages

## Quality Checks

- `npm run lint`: Runs ESLint with zero tolerance for errors
- `npm run build`: Typechecks with `tsc` and bundles with Vite (generates `404.html` and `.nojekyll` for GitHub Pages)