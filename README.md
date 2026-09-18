# Mindora

A modern cognitive care and engagement application, organized as a monorepo.

## Workspace Structure

```text
mindora/
├── backend/               # Fastify backend (@mindora/backend) with Better Auth & Neon Postgres
│   ├── src/               # API routes, Drizzle schemas, auth & database pool
│   └── package.json       # Backend dependencies & migration scripts
├── frontend/              # Web application (@mindora/frontend)
│   ├── src/               # React application source
│   └── package.json       # Frontend dependencies & scripts
├── packages/              # Shared libraries, types, or configurations
├── package.json           # Monorepo root configuration & scripts
├── turbo.json             # Turborepo task orchestration
├── pnpm-workspace.yaml    # pnpm workspace configuration
└── bun.lock               # Workspace lockfile (Bun)
```

## Getting Started

### Prerequisites

- **Bun** (recommended) or **Node.js** (v18+) with `npm` / `pnpm`

### Installation

Install dependencies for all workspaces from the monorepo root:

```bash
bun install
```

*(or `pnpm install` / `npm install`)*

### Environment Variables

1. **Frontend**:
```bash
cp frontend/.env.example frontend/.env.local
```

2. **Backend**:
```bash
cp backend/.env.example backend/.env
```
Provide your Neon connection string (`DATABASE_URL`) and `BETTER_AUTH_SECRET`.

### Development

Run all development servers (frontend + backend) in parallel:

```bash
bun run dev
```

Or run individual workspaces:

```bash
bun run dev:frontend    # Starts frontend on port 3000
bun run dev:backend     # Starts Fastify backend on port 4000
```

### Build

Build all workspaces:

```bash
bun run build
```

Or build individually:

```bash
bun run build:frontend
bun run build:backend
```

### Type Checking & Linting

Type check all workspaces:

```bash
bun run lint
```

### Database Migrations

Push schema to Neon PostgreSQL:

```bash
bun --filter @mindora/backend run db:push
```

Or generate and run migrations:

```bash
bun --filter @mindora/backend run db:generate
bun --filter @mindora/backend run db:migrate
```

Launch Drizzle Studio:

```bash
bun --filter @mindora/backend run db:studio
```

## AI Recommendation Service (FastAPI)

The backend is pre-configured to connect to an upcoming FastAPI recommendation service via `FASTAPI_SERVICE_URL` in `backend/.env`. When online, `/api/ai/recommendation` automatically proxies to FastAPI; if unavailable, a gentle cultural fallback engine serves personalized activities.
