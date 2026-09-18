# Mindora — Agent Guidelines & Project Context

Welcome to the **Mindora** repository. This document serves as the primary orientation and operating guide for AI coding assistants and human developers working in this codebase.

---

## 1. Project Overview

Mindora is a specialized cognitive care and engagement platform designed for elderly individuals and early-stage dementia care, with cultural localization for India's North Eastern Region (NER). It pairs non-diagnostic, calming cognitive games with an adaptive difficulty engine, caregiver telemetry, routine reminders, and AI-assisted personalized recommendations.

---

## 2. Monorepo Architecture

Mindora is organized as a unified monorepo managed with **Bun** and **Turborepo**:

```text
mindora/
├── backend/               # Fastify backend service (@mindora/backend)
│   ├── src/
│   │   ├── index.ts       # Fastify server entry point
│   │   ├── auth.ts        # Better Auth initialization
│   │   ├── config.ts      # Environment configuration
│   │   ├── db/            # Neon PostgreSQL connection & Drizzle ORM
│   │   │   ├── index.ts   # Pool & Drizzle client
│   │   │   └── schema/    # auth.ts, games.ts, patients.ts, care.ts
│   │   ├── plugins/       # Fastify plugins (auth session decorators)
│   │   └── routes/        # auth, games, patients, reminders, alerts, ai
│   ├── drizzle.config.ts  # Drizzle Kit migration configuration
│   └── package.json
├── frontend/              # React 19 application (@mindora/frontend)
│   ├── src/
│   │   ├── components/    # games, caregiver, patient, landing, common
│   │   ├── services/      # api.ts, storage.ts, adaptiveEngine.ts, audioSpeech.ts, geminiClient.ts
│   │   ├── data/          # Mock data & cultural items
│   │   ├── utils/         # Translations & language helpers
│   │   └── types.ts       # TypeScript domain models
│   ├── vite.config.ts     # Vite configuration with API proxy to backend
│   └── package.json
├── packages/              # Reserved for shared packages / schemas
├── docs/                  # Architectural and technical documentation
│   ├── architecture.md    # System architecture, database, auth, telemetry
│   ├── games.md           # Game mechanics, cognitive targets, adaptive difficulty
│   └── api.md             # REST API endpoint specifications
├── neon.ts                # Neon cloud infrastructure policy (buckets, AI gateway)
├── turbo.json             # Turborepo task pipeline definition
├── package.json           # Root workspace configuration
└── bun.lock               # Workspace dependency lockfile
```

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| **Language & Runtime** | TypeScript 5+, Node.js (v22+), Bun (v1.4+) |
| **Monorepo Tooling** | Turborepo (`turbo`), Bun Workspaces, pnpm compatibility |
| **Frontend Framework** | React 19, Vite 8, Tailwind CSS v4 |
| **Animations & UI** | Motion (Framer Motion v12), Lucide React, Recharts, Canvas Confetti |
| **Backend Framework** | Fastify 5, `@fastify/cors`, `@fastify/cookie`, `@fastify/sensible` |
| **Database & ORM** | Neon Serverless PostgreSQL (AWS ap-southeast-1), Drizzle ORM |
| **Authentication** | Better Auth (`better-auth`, `@better-auth/drizzle-adapter`) |
| **Object Storage** | Neon Object Storage (S3 compatible, private `uploads` bucket) |
| **AI Recommendation** | Future FastAPI microservice (proxied via `/api/ai/*` with cultural fallback) |

---

## 4. Key Engineering Conventions

### 4.1 Non-Diagnostic & Respectful Language
- **Never** make clinical diagnosis claims (e.g. "cures Alzheimer's", "predicts dementia severity").
- The UI and prompts must remain gentle, positive, and affirming.
- Use encouraging wording: "Cognitive wellness", "Familiar memory activities", "Daily routine recall".

### 4.2 Offline-First Design
- The frontend operates seamlessly without an active internet connection.
- Local game sessions and reminder changes are cached in `localStorage` with `synced: false`.
- When connectivity is restored, the `StorageService` synchronizes pending records with `/api/games/sessions` on the Fastify backend.

### 4.3 Cultural Localization (Assam / North East India)
- Incorporate familiar cultural anchors: Muga silk, Bihu instruments (Dhol, Pepa), Kaziranga wildlife, tea gardens, traditional utensils (Xorai, Bota).
- Multilingual support: English (`en`), Hindi (`hi`), and Assamese (`as`).

### 4.4 Accessibility First
- High contrast options, large touch targets, simplified layouts.
- Built-in speech synthesis (`audioSpeech.ts`) for gentle auditory instructions in patient mode.

### 4.5 Dementia-Friendly Dual Authentication
- **Caregiver Persona**: Powered by Better Auth with standard email/password credentials and session cookies.
- **Patient Persona**: **Never** prompt elderly or dementia patients for passwords, alphanumeric codes, or CAPTCHAs. Always provide visual photographic cards with zero-friction entry, spoken audio welcomes, and persistent offline sessions.
- **Device Handover**: Provide a one-tap transition between Caregiver and Patient mode with gentle confirmation guards.

---

## 5. Standard Commands

```bash
# Install all dependencies across workspaces
bun install

# Run all workspaces in development (frontend on :3000, backend on :4000)
bun run dev

# Run individual workspaces
bun run dev:frontend
bun run dev:backend

# Build all workspaces
bun run build

# Type check all workspaces
bun run lint

# Database operations (Neon Cloud or Local Docker PostgreSQL)
bun run db:docker:up                          # Spin up local PostgreSQL container (port 5433/5432)
bun run db:docker:down                        # Stop local PostgreSQL container
bun run db:push                               # Push schema migrations to active database
bun run db:seed                               # Seed all 12 clinical & cultural CSV datasets
bun --filter @mindora/backend run db:studio   # Open Drizzle Studio web GUI

# AI Microservice (Python / FastAPI / Scikit-Learn / Groq Nemotron)
bun run ai:train                              # Train Scikit-Learn models from backend CSVs
bun run dev:ai                                # Start FastAPI AI microservice on :8000

# Neon Cloud deployment
neon deploy                                   # Deploy neon.ts policy
```

---

## 6. Rules for Agents

1. **Maintain Type Safety**: All database interactions must use Drizzle ORM models defined in `backend/src/db/schema/`. Never write raw unsanitized SQL.
2. **Preserve Offline Fallbacks**: Always provide local fallbacks when modifying network-dependent services.
3. **Keep Links Clickable**: In communications, reference files using standard markdown links (`file:///...`).
4. **Follow Waggle Automatic Memory**: Hydrate context before complex operations and observe turns containing decisions.
