# MediTrack Pro

A caregiver dashboard for a connected IoT pill dispenser — medication
schedules, stock and adherence tracking, a shared "Care Circle" of
caregivers per patient, and zero-login emergency profile QR codes.

## Features

- **Medications** — add, edit, and remove prescriptions, with per-funnel
  assignment and stock levels
- **Stock Monitor** — days-remaining and low-stock alerts per medication
- **Dispenser** — pair a device, view funnel status, trigger a manual
  dispense with caregiver PIN authorization
- **Adherence** — trends and logs of taken/missed/overdue doses
- **Emergency QR** — a printable, no-login patient card for first responders
- **Care Circle** — invite other caregivers to a shared patient profile

## Stack

- **Monorepo:** npm workspaces, TypeScript 5.9, Node.js 20+
- **Frontend** (`apps/web`): React 19, Vite, Tailwind CSS, TanStack Query, wouter
- **API** (`apps/api`): Express 5, bearer-token auth
- **Database** (`packages/db`): PostgreSQL + Drizzle ORM
- **API contract** (`packages/api-spec`): OpenAPI spec, codegen'd via Orval into
  `packages/api-zod` (Zod schemas) and `packages/api-client-react` (typed
  React Query hooks) — the frontend and backend both consume these generated
  packages instead of hand-written fetch calls or duplicated types.

## Getting started

Requires Node.js 20+, npm 10+, and a PostgreSQL database.

```bash
npm install

# Point the API at your database (copy the example and edit it)
cp apps/api/.env.example apps/api/.env
# then set DATABASE_URL in apps/api/.env

# Push the schema to your database
npm run push --workspace @meditrack/db

# Run the API and frontend together
npm run dev
```

This starts the API on `http://localhost:4000` and the frontend on
`http://localhost:5173`. The frontend's dev server proxies `/api/*` requests
to the API, so no manual CORS or origin setup is needed locally.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Run the API and frontend together, with hot reload |
| `npm run typecheck` | Typecheck every package and app |
| `npm run build` | Typecheck, then build every package and app |
| `npm run format` | Format the repo with Prettier |
| `npm run push --workspace @meditrack/db` | Push the Drizzle schema to your database |
| `npm run codegen --workspace @meditrack/api-spec` | Regenerate `api-zod` and `api-client-react` from `openapi.yaml` |

## Known limitations

Not yet production-ready — flagging these so nothing ships by surprise:

- **Sessions are in-memory** (`apps/api/src/routes/auth.ts`). Every restart
  or redeploy logs everyone out, and it won't work behind more than one
  server instance. Swap for JWTs or a DB-backed session table before a real
  multi-instance deploy.
- **Forgot-password is a no-op.** `/auth/forgot-password` always returns
  success but never sends an email or generates a reset token — there's no
  working reset flow yet.
- **Caregiver invites don't send anything.** Inviting a caregiver by email
  who has no account creates a user row with a `"placeholder"` password
  hash and no way to activate it — they can never actually log in until an
  invite/activation email flow is built.
- **`/watch` is a static design preview**, not wired to real data (mock
  time and a hardcoded "Losartan 50mg" dose) — useful for showing the
  smartwatch companion concept, not a working feature.

## Production

`apps/api` serves the built frontend directly, so the whole app is a single
deployable process:

```bash
npm run build
NODE_ENV=production DATABASE_URL=... npm run start --workspace @meditrack/api
```

## Project structure

```
apps/
  api/                Express API server
  web/                React frontend
packages/
  db/                 Drizzle schema + database client
  api-spec/           Source OpenAPI spec + codegen config
  api-zod/            Generated Zod schemas (do not edit — regenerate instead)
  api-client-react/   Generated React Query hooks (do not edit — regenerate instead)
```
