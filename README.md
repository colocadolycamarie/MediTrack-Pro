# MediTrack Pro

A caregiver dashboard for the PULSO IoT pill dispenser — medication schedules,
adherence tracking, a shared "Care Circle" of caregivers per patient, and
emergency profile QR codes.

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
  api/            Express API server
  web/             React frontend
packages/
  db/              Drizzle schema + database client
  api-spec/        Source OpenAPI spec + codegen config
  api-zod/         Generated Zod schemas (do not edit — regenerate instead)
  api-client-react/  Generated React Query hooks (do not edit — regenerate instead)
docs/
  design-system.md  UI/UX design system reference
```
