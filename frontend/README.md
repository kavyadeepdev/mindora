# Mindora Frontend Application

Accessible, culturally localized cognitive care and engagement web application designed for elderly individuals, early-stage dementia care, caregivers, and clinicians. Built with React 19, TypeScript, Vite 8, Tailwind CSS v4, and Motion.

## Architecture

```text
frontend/
├── src/
│   ├── components/
│   │   ├── common/            # Header, Navigation, LanguageSelector, AccessibilityControls
│   │   ├── patient/           # Zero-friction patient mode, VoiceAssistantModal, device pairing
│   │   ├── caregiver/         # CaregiverDashboard, telemetry analytics, reminders, alerts
│   │   ├── doctor/            # DoctorPortal, clinical regimen planning, patient monitoring
│   │   ├── landing/           # Mindora landing page & portal entry
│   │   └── games/             # Cognitive engagement games
│   │       ├── MemoryMatchGame.tsx
│   │       ├── AttentionChallengeGame.tsx
│   │       ├── PatternRecognitionGame.tsx
│   │       └── RoutineRecallGame.tsx
│   ├── services/
│   │   ├── api.ts             # Backend REST API client (@mindora/backend)
│   │   ├── storage.ts         # Offline-first local storage & sync queue
│   │   ├── adaptiveEngine.ts  # Dynamic difficulty adjustment based on performance
│   │   ├── audioSpeech.ts     # Multilingual Web Speech synthesis
│   │   └── aiAssistant.ts     # Assistant recommendations & caregiver summaries
│   ├── data/                  # Familiar cultural anchors, mock datasets, default regimens
│   ├── utils/                 # Translations (English, Assamese, Hindi, Bengali, Kannada)
│   ├── types.ts               # Domain models & TypeScript interfaces
│   ├── App.tsx                # Subdomain & pathname portal router
│   └── main.tsx               # React root mounting
├── server.ts                  # Express server for Vite middleware & backend proxying
├── vite.config.ts             # Vite 8 configuration with Fastify API proxy
└── package.json
```

## Features

- **Tripartite Subdomain Portals**:
  - **Doctor Portal** (`doctor.mindora.app` / `/doctor`): Regimen prescription, activity sequencing, difficulty ceilings, and longitudinal telemetry oversight.
  - **Caretaker Portal** (`caretaker.mindora.app` / `/caretaker`): Daily routine adherence, device pairing approvals, medication reminders, and cognitive engagement briefings.
  - **Patient Mode** (`patient.mindora.app` / `/patient`): Calming, zero-password interface with large touch targets, simplified layouts, and spoken audio instructions.
  - **Landing Portal** (`mindora.app` / `/`): Orientation, portal directory, and system onboarding.
- **Culturally Localized Cognitive Games**:
  - **Memory Match**: Familiar regional anchors (tea garden flora, traditional utensils, wildlife).
  - **Attention Challenge**: Active focus stimulation through rhythmic patterns and instruments.
  - **Pattern Recognition**: Logical sequence recall with traditional weaving motifs and border designs.
  - **Daily Routine Recall**: Procedural recall for activities of daily living (morning tea, hydration, walking).
- **Offline-First Architecture**:
  - Full application functionality persists without network connectivity.
  - Gameplay sessions and reminder updates queue in `localStorage` and automatically sync to the Fastify backend when online.
- **Multilingual Speech & Accessibility**:
  - Built-in speech synthesis (`AudioSpeechService`) for warm auditory guidance.
  - Multilingual support for Assamese (`as`), Hindi (`hi`), Bengali (`bn`), Kannada (`kn`), and English (`en`).
  - High-contrast toggle, adjustable text sizing, and reduced-motion settings.
- **AI-Assisted Caregiver Briefings**:
  - Non-diagnostic daily briefings and routine suggestions proxied through `/api/ai/*`.

## Environment Configuration

Create a `.env` file in the `frontend/` directory (or configure via root `.env`):

```bash
cp .env.example .env
```

Key environment variables:
- `BACKEND_URL`: URL to the Fastify backend service (defaults to `http://localhost:4000`).
- `PORT`: Frontend development/production server port (defaults to `3000`).
- `NODE_ENV`: Runtime environment (`development` | `production`).

## Running the Application

From the monorepo root:

```bash
# Run both frontend and backend concurrently
bun run dev

# Run frontend only (starts on port 3000)
bun run dev:frontend
```

Or from within `frontend/`:

```bash
# Start development server
bun run dev

# Build production bundle
bun run build

# Start production server
bun run start

# Type check
bun run lint
```
