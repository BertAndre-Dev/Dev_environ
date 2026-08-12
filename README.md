# BertaHub

Frontend for **BertaHub** — a multi-tenant estate operations platform for residential estates, serviced apartments, and property managers. Admins run billing, energy, maintenance, and resident communication from one dashboard; residents pay bills, vend power, manage visitors, and submit requests.

| Environment | URL |
| --- | --- |
| Production | [https://berta-hub-app.vercel.app](https://berta-hub-app.vercel.app/) |
| Development | [https://dev-bertahub.vercel.app](https://dev-bertahub.vercel.app/) |

---

## Table of contents

- [Overview](#overview)
- [Roles](#roles)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [API & auth](#api--auth)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

BertaHub centralizes day-to-day estate operations:

- **Billing & payments** — rent, service charges, wallets, transaction history
- **Energy intelligence** — smart meters, prepaid vending, usage analytics
- **Visitor management** — registration, verification, activity logs
- **Maintenance** — resident complaints and staff assignment workflows
- **Communication** — announcements, community chat, support
- **Assets & finance** — asset registers, expense/revenue heads, operational reporting
- **Marketplace** — estate marketplace surfaces for admins and residents
- **Maps** — Google Maps–backed estate map views

The app is a Next.js App Router client that talks to a separate BertaHub API. Browser requests to `/api/v1/*` are proxied through Next.js so auth cookies stay same-origin.

---

## Roles

Access is role-based. After login, users land on a role-specific dashboard path.

| Role | Default path | Primary responsibilities |
| --- | --- | --- |
| Super Admin | `/dashboard/super-admin/dashboard` | Estates, companies, users, meters, transactions, marketplace, energy providers |
| Admin | `/dashboard/admin/user` | Estate users, addresses, bills, meters, visitors, assets, finance, announcements |
| Estate Admin | `/dashboard/estate-admin/transactions` | Wallet, transactions, analytics, reports, announcements, chat |
| Company | `/dashboard/company/asset` | Multi-estate assets, meters, finance, operations, marketplace |
| Energy Provider | `/dashboard/energy-provider/wallet` | Provider wallet, estates, addresses, users, transactions |
| Resident | `/dashboard/resident/bills` | Bills, meters, wallet, visitors, maintenance, rent, community |
| Security | `/dashboard/security/visitor-management` | Visitor verification and activity logs |
| Staff | `/dashboard/staff/maintenance` | Maintenance, community, announcements, support |

Users may belong to multiple memberships; switching membership remaps the current route to the equivalent path under the new role when possible.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | [Next.js](https://nextjs.org/) 16 (App Router) |
| UI | React 19, TypeScript (strict) |
| Styling | Tailwind CSS 4, shadcn/ui, Radix UI |
| State | Redux Toolkit, Redux Persist (session storage) |
| Forms | React Hook Form, Zod |
| HTTP | Axios (credentials + CSRF + token refresh) |
| Realtime | Socket.IO client |
| Charts | Recharts |
| Maps | `@react-google-maps/api` |
| Hosting | Vercel (+ Analytics) |

---

## Prerequisites

- **Node.js** 18+ (20 LTS recommended)
- **npm** (lockfile is `package-lock.json`; yarn/pnpm/bun may work but are not the primary path)
- Access to a running BertaHub API (or the shared dev API)
- Git

---

## Getting started

```bash
git clone https://github.com/BertAndre-Dev/Dev_environ.git
cd Dev_environ
npm install
cp .env.example .env.local   # if present; otherwise create .env.local manually
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> The Next.js rewrite proxy uses `NEXT_PUBLIC_API_BASE_URL`. Without it, the config falls back to `https://bertahubdev.com`.

---

## Environment variables

Create `.env.local` in the project root (never commit secrets). `.env*` is gitignored.

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Backend origin, e.g. `https://bertahubdev.com` (no trailing path). Used for SSR, rewrites, and sockets. |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical site URL for SEO/metadata (production/preview). |
| `NEXT_PUBLIC_MAPS_JAVASCRIPT_API` | For maps | Google Maps JavaScript API key (resident map views). |
| `NEXT_PUBLIC_PLACE_API` | Optional | Places / geocoding key fallback used by map helpers. |
| `SENDGRID_API_KEY` | For book-demo | Server-only key for the `/api/book-demo` route. |

Example:

```env
NEXT_PUBLIC_API_BASE_URL=https://bertahubdev.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_MAPS_JAVASCRIPT_API=your_google_maps_key
SENDGRID_API_KEY=your_sendgrid_key
```

Configure the same keys in the Vercel project settings for each environment.

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Local dev server (Webpack) |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |

---

## Architecture

### App Router & role dashboards

- Marketing and legal pages live under `app/` (`landing`, blog, privacy, terms, book-demo).
- Authenticated product UI lives under `app/dashboard/<role>/…`.
- Shared dashboard chrome is in `app/dashboard/layout.tsx`.
- Role → home path mapping is centralized in `lib/auth-dashboard-path.ts`.

### State management

- Feature domains are Redux Toolkit slices under `redux/slice/`, organized by role/domain (`admin`, `resident`, `company`, `super-admin`, etc.).
- Auth and related client state are persisted with **Redux Persist** using **session storage** (tab-scoped).
- The store is injected into Axios helpers via `utils/store-accessor.ts` so interceptors can read tokens without circular imports.

### API proxy (same-origin cookies)

`next.config.ts` rewrites browser traffic so cookies remain first-party:

```
/api/v1/*     →  ${NEXT_PUBLIC_API_BASE_URL}/api/v1/*
/iec/*        →  ${NEXT_PUBLIC_API_BASE_URL}/iec/*
/analytics/*  →  ${NEXT_PUBLIC_API_BASE_URL}/analytics/*
```

On the client, Axios uses a relative base URL (`""`). On the server, it calls the absolute API origin.

### Auth flow (high level)

1. User authenticates via `/auth/login` (or signup / invite verification / password reset).
2. Access token is held in Redux; refresh uses HTTP-only cookies through the same-origin proxy.
3. Request interceptor attaches `Authorization: Bearer <token>` and CSRF headers on unsafe methods.
4. Response interceptor handles token refresh; on hard auth failure, local session is cleared and the user is sent to login.

---

## Project structure

```
.
├── app/                      # Next.js App Router
│   ├── api/                  # Route handlers (e.g. book-demo)
│   ├── auth/                 # Login, signup, password, invite verify
│   ├── blog/                 # Marketing blog
│   ├── dashboard/            # Role-scoped product UI
│   │   ├── admin/
│   │   ├── company/
│   │   ├── energy-provider/
│   │   ├── estate-admin/
│   │   ├── resident/
│   │   ├── security/
│   │   ├── staff/
│   │   └── super-admin/
│   ├── book-demo/
│   └── …                     # Landing, legal, robots, sitemap
├── components/               # UI by domain + shared `ui/` (shadcn)
├── data/                     # Static / config data
├── hooks/                    # Shared React hooks
├── lib/                      # Domain helpers, charts, SEO, sockets, maps
├── public/                   # Static assets
├── redux/
│   ├── api/                  # RTK Query APIs (e.g. maps)
│   ├── slice/                # Feature slices by role/domain
│   └── store.ts
├── types/                    # Shared TypeScript types
├── utils/                    # Axios, CSRF, auth storage, store accessor
├── next.config.ts
├── package.json
└── tsconfig.json             # `@/*` path alias → project root
```

Path alias: import with `@/…` (see `tsconfig.json`).

---

## API & auth

| Concern | Location |
| --- | --- |
| Axios client | `utils/axiosInstance.ts` |
| CSRF helpers | `utils/csrf.ts` |
| Auth slice | `redux/slice/auth-mgt/` |
| Socket URL helper | `lib/socket-api-url.ts` |

Expected backend shape: REST under `/api/v1/…`. Frontend does not own business persistence; treat the API as the source of truth.

---

## Deployment

Deployed on **Vercel**.

Typical flow:

1. Merge to the branch wired to the Vercel project (production vs preview).
2. Ensure environment variables are set for that environment.
3. Vercel builds with `npm run build` and serves with `npm start`.

Image hosts (e.g. Cloudinary) are allowlisted in `next.config.ts` (`images.remotePatterns`).

---

## Contributing

1. Branch from the active integration branch (`main` / team convention).
2. Keep changes focused; match existing patterns for slices, pages, and components.
3. Prefer TypeScript, functional components, and shared helpers in `lib/` / `utils/` over one-off copies.
4. Run `npm run lint` before opening a PR.
5. Open a pull request with a short summary of **why** the change exists and how to verify it.

Do not commit `.env*`, credentials, or local tooling artifacts (e.g. virtualenvs, `.next`).

---

## License

Proprietary. All rights reserved. Unauthorized copying or distribution is prohibited.

---

**BertaHub** · Frontend · v0.1.0
