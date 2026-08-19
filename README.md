# BertaHub (frontend)

Frontend client for BertaHub — a multi-tenant estate operations platform. This repository contains the Next.js App Router client delivering the admin and resident dashboards, public marketing pages, and light API routes (e.g. `book-demo`). The frontend expects a separate BertaHub API as the source of truth.

| Environment | URL |
| --- | --- |
| Production | https://berta-hub-app.vercel.app |
| Development | https://dev-bertahub.vercel.app |

---

## Quick start

Prerequisites:

- Node.js 18+ (20 LTS recommended)
- npm (this repo uses `package-lock.json`)

Clone and run locally:

```bash
git clone https://github.com/BertAndre-Dev/Dev_environ.git
cd Dev_environ
npm install
# copy or create environment file
cp .env.example .env.local || true
npm run dev
```

Open http://localhost:3000

Notes:

- The app proxies browser requests to the backend using rewrites configured in `next.config.ts`. Set `NEXT_PUBLIC_API_BASE_URL` to your API origin for SSR and rewrites.

---

## Environment variables

Create `.env.local` (do not commit secrets). Common variables used by the app:

```env
NEXT_PUBLIC_API_BASE_URL=https://bertahubdev.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_MAPS_JAVASCRIPT_API=your_google_maps_key
SENDGRID_API_KEY=your_sendgrid_key
```

See the `.env.example` (if present) and configure these keys in Vercel for production/preview.

---

## Scripts

Use the npm scripts defined in `package.json`:

- `npm run dev` — Start local dev server (Next.js with webpack flag used in this repo)
- `npm run build` — Create a production build
- `npm start` — Serve the production build
- `npm run lint` — Run ESLint

Run `npm run` to list available scripts.

---

## Tech stack (high level)

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS, shadcn/ui, Radix UI
- Redux Toolkit + redux-persist
- Axios for HTTP with CSRF + refresh interceptors
- Socket.IO client for realtime
- Recharts for charts, `@react-google-maps/api` for maps
- Hosted on Vercel

---

## Project structure

Top-level layout (abridged):

```
. 
├── app/                # Next.js App Router (marketing + dashboard routes)
├── components/         # UI components (domain + shared)
├── lib/                # Helpers: maps, sockets, charts, seo
├── redux/              # Store, slices, RTK APIs
├── utils/              # Axios instance, CSRF, store accessor
├── public/             # Static assets
├── package.json
└── next.config.ts
```

Use `@/` path alias as configured in `tsconfig.json`.

---

## Architecture notes

- Role-based dashboards live under `app/dashboard/<role>/…` with a shared layout in `app/dashboard/layout.tsx`.
- Role → route mapping is in `lib/auth-dashboard-path.ts`.
- Redux slices live under `redux/slice/` and are organized by domain/role.
- The frontend relies on the API at `/api/v1/*`; rewrites map these to the backend origin so cookies remain first-party.

---

## Deployment

This project is deployed on Vercel. Typical flow:

1. Merge to the branch configured in the Vercel project.
2. Ensure required environment variables are set in Vercel for the environment.
3. Vercel builds with `npm run build` and serves the site.

---

## Contributing

1. Branch from the team's integration branch (e.g. `main`).
2. Keep changes focused and follow existing patterns for slices, components, and pages.
3. Run `npm run lint` before opening a PR.
4. Include a short description of **why** the change exists and how to verify it.

Do not commit `.env*` or local build artifacts.

---

## License

Proprietary. All rights reserved.

---

**BertaHub** · Frontend
