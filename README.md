# Mindora

A modern cognitive care and engagement application, organized as a monorepo.

## Workspace Structure

```text
mindora/
├── backend/               # Reserved for the backend service
├── frontend/              # Web application (@mindora/frontend)
│   ├── src/               # React application source
│   ├── server.ts          # Express + Vite server
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

Configure the frontend environment file:

```bash
cp frontend/.env.example frontend/.env.local
```

Set `GEMINI_API_KEY` in `frontend/.env.local` to your Gemini API key.

### Development

Run all development servers:

```bash
bun run dev
```

Or run frontend directly:

```bash
bun run dev:frontend
```

### Build

Build all workspaces:

```bash
bun run build
```

Or build frontend specifically:

```bash
bun run build:frontend
```

### Type Checking & Linting

Type check all workspaces:

```bash
bun run lint
```

## Adding the Backend

When you are ready to add the backend service into `backend/`:

1. Place your backend code inside the [backend/](backend/) directory.
2. If it is a Node/TypeScript service:
   - Include a `package.json` inside `backend/` (e.g. `"name": "@mindora/backend"`).
   - Add `"backend"` into the `workspaces` array in [package.json](package.json) and [pnpm-workspace.yaml](pnpm-workspace.yaml).
   - Run `bun install`.
3. If it is a Python or Go service, maintain its environment/dependencies inside `backend/` and optionally add proxying in `frontend/vite.config.ts`.
