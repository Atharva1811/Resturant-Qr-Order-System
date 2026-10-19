# Servora Frontend Application

Modern responsive web application for **Servora** — Restaurant Ordering, Simplified.

Built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS v4**, **Radix UI**, and **React Router v7**.

## Core Views & Capabilities

- **Customer QR Menu (`/m/:slug/:table`)**: Interactive mobile menu with search, category filtering, customizations, cart drawer, and email OTP verification.
- **Order Tracking (`/m/:slug/:table/track/:orderId`)**: Real-time status tracker subscribed to server-sent Socket.IO events.
- **Kitchen Display System (`/kitchen/orders`)**: High-contrast, touch-first queue management with audio chimes and ticket age indicators.
- **Restaurant Management (`/admin/*`)**: Complete admin suite covering orders, menu categories & items, tables & QR generation, staff roles, settings, and sales analytics.
- **Platform Superadmin (`/superadmin/*`)**: Tenant provisioning and global platform oversight.

## Branding Configuration

Product name, taglines, legal info, and storage keys are centralized in:
[`src/config/brand.config.ts`](./src/config/brand.config.ts)

## Scripts

```bash
npm run dev      # Start local development server (http://localhost:5173/)
npm run build    # Typecheck and compile production bundle into dist/
npm run lint     # Run ESLint quality checks
npm run preview  # Preview production build locally
```

## Environment Variables

| Variable | Description |
| :--- | :--- |
| `VITE_API_URL` | Base REST API URL (e.g. `https://servora-api.onrender.com/api`) |
| `VITE_SOCKET_URL` | Base WebSocket server URL (e.g. `https://servora-api.onrender.com`) |
| `VITE_BASE_PATH` | Base subpath for GitHub Pages (`/Resturant-Qr-Order-System/`) |

## License
MIT
