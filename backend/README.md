# Mindora Backend Service

Fastify backend for Mindora, built with TypeScript, Neon PostgreSQL, Drizzle ORM, and Better Auth.

## Architecture

```text
backend/
├── src/
│   ├── index.ts               # Fastify server initialization & route registration
│   ├── auth.ts                # Better Auth setup with Drizzle adapter
│   ├── config.ts              # Environment configuration
│   ├── db/
│   │   ├── index.ts           # PostgreSQL / NeonDB connection pool & Drizzle ORM
│   │   └── schema/
│   │       ├── index.ts       # Central schema export
│   │       ├── auth.ts        # Better Auth tables (user, session, account, verification)
│   │       ├── games.ts       # Game session tracking & adaptive difficulty
│   │       ├── patients.ts    # Patient & Caregiver profiles
│   │       └── care.ts        # Reminders & Caregiver alerts
│   ├── plugins/
│   │   └── auth.ts            # Fastify session & authentication helpers
│   └── routes/
│       ├── auth.ts            # /api/auth/* Better Auth handler
│       ├── games.ts           # /api/games (sessions, analytics, adaptive difficulty)
│       ├── patients.ts        # /api/patients
│       ├── reminders.ts       # /api/reminders
│       ├── alerts.ts          # /api/alerts
│       └── ai.ts              # /api/ai (proxy to future FastAPI service + fallback)
├── drizzle.config.ts          # Drizzle Kit configuration for migrations
├── package.json
└── tsconfig.json
```

## Features

- **PostgreSQL on NeonDB**: High-performance connection pooling with SSL support.
- **Game Tracking & Analytics**:
  - Store game sessions (Memory, Attention, Pattern, Routine) with scores, accuracy, response times, and attempts.
  - Automatic **Adaptive Difficulty Engine** dynamically updates patient difficulty based on multi-session performance.
  - Automatic **Caregiver Alerts** triggered on sudden accuracy drops or notable achievements.
- **Better Auth Authentication**:
  - Full user authentication, credentials (email/password), sessions, accounts, and verification tokens.
  - Drizzle ORM adapter for PostgreSQL.
- **FastAPI AI Recommendation Readiness**:
  - `/api/ai` endpoints designed to proxy requests to an upcoming FastAPI recommendation service via `FASTAPI_SERVICE_URL`.
  - Built-in cultural fallback engine when the FastAPI service is not yet running.

## Environment Configuration

Create a `.env` file in the `backend/` directory (or use `.env.local`):

```bash
cp .env.example .env
```

Key environment variables:
- `DATABASE_URL`: Your Neon PostgreSQL connection string (e.g. `postgresql://...neon.tech/neondb?sslmode=require`).
- `BETTER_AUTH_SECRET`: Secret key for Better Auth tokens (min 32 characters).
- `BETTER_AUTH_URL`: Backend URL (e.g. `http://localhost:4000`).
- `PORT`: Fastify server port (defaults to `4000`).
- `FASTAPI_SERVICE_URL`: URL to future FastAPI service (e.g. `http://localhost:8000`).

## Database Migrations

Push schema directly to your Neon database:

```bash
bun run db:push
```

Or generate and run migrations:

```bash
bun run db:generate
bun run db:migrate
```

Launch Drizzle Studio GUI:

```bash
bun run db:studio
```

## Running the Server

From the monorepo root:

```bash
bun run dev:backend
```

Or from within `backend/`:

```bash
bun run dev
```
