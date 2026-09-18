# Mindora System Architecture

This document provides a comprehensive technical overview of Mindora's architecture, engineering choices, database schemas, telemetry pipeline, multi-portal routing, clinical control engine, zero-friction authentication, and integration boundaries.

---

## 1. High-Level Architecture & Tripartite Portals

Mindora is designed around a **tripartite multi-portal architecture** where clinical oversight, daily family care, and elderly engagement operate with zero friction across dedicated subdomains:

```mermaid
flowchart TD
    subgraph Portals ["Tripartite Subdomain Portals"]
        DoctorPortal["doctor.mindora.app\nClinician Dashboard"]
        CaretakerPortal["caretaker.mindora.app\nFamily Caretaker Portal"]
        PatientPortal["patient.mindora.app\nDementia-Friendly Display"]
        LandingPortal["mindora.app\nPlatform Gateway"]
    end

    subgraph CoreFrontend ["Frontend Client (React 19 / Vite)"]
        SubdomainRouter["Subdomain / Pathname Router"]
        DevicePairingEngine["WhatsApp Web Device Pairing Manager"]
        PrescriptionEngine["Doctor Regimen & Round Configurator"]
        OfflineSync["Offline-First Cache & Queue"]
    end

    subgraph BackendGateway ["Core Backend (Fastify 5)"]
        FastifyServer["Fastify HTTP Server (:4000)"]
        AuthHandler["Better Auth Plugin (/api/auth/*)"]
        TelemetryEngine["Game Telemetry & Adaptive Engine"]
        CaregiverAPI["Patients, Reminders & Alerts API"]
        AIProxy["AI Gateway / Fallback Engine"]
    end

    subgraph NeonCloud ["Neon Serverless Cloud"]
        PostgresDB[("Neon Lakebase Postgres (AWS ap-southeast-1)")]
        ObjectStorage[("Neon S3 Bucket: 'uploads' (Private)")]
    end

    DoctorPortal --> SubdomainRouter
    CaretakerPortal --> SubdomainRouter
    PatientPortal --> SubdomainRouter
    LandingPortal --> SubdomainRouter

    SubdomainRouter --> DevicePairingEngine
    SubdomainRouter --> PrescriptionEngine
    SubdomainRouter --> OfflineSync

    OfflineSync -->|Read/Write Online| FastifyServer
    FastifyServer --> AuthHandler
    FastifyServer --> TelemetryEngine
    FastifyServer --> CaregiverAPI
    FastifyServer --> AIProxy

    AuthHandler --> PostgresDB
    TelemetryEngine --> PostgresDB
    CaregiverAPI --> PostgresDB
    FastifyServer --> ObjectStorage
```

---

## 2. Dedicated Subdomain Architecture

To ensure total cognitive clarity and avoid mode confusion, the application is segmented into isolated portals:

| Portal | Subdomain | Pathname Fallback | Role & Purpose |
|---|---|---|---|
| **Landing Gateway** | `mindora.app` | `/` or `/landing` | High-level platform introduction and direct portal entry points. |
| **Doctor Portal** | `doctor.mindora.app` | `/doctor` | Neurologist/clinician control center: multi-patient cohort management, activity prescriptions (enable/disable, sequencing, rounds), medical reminders, and clinical telemetry. |
| **Caretaker Portal** | `caretaker.mindora.app` | `/caretaker` | Family and nursing dashboard: routine reminders, WhatsApp Web device pairing authorizations, cognitive adherence tracking, and AI daily briefings. |
| **Patient Screen** | `patient.mindora.app` | `/patient` | Zero-password, distraction-free interface for elderly individuals; automatically loads doctor-prescribed activity sequence and spoken reminders. |

> [!NOTE]
> The top navigation bar intentionally contains **zero mode-switching buttons** (`overview`, `patient mode`, `caretaker`). Users interact with their dedicated portal, and patient screens remain completely unencumbered by administrative controls.

---

## 3. WhatsApp Web-Style Zero-Friction Patient Pairing

Dementia patients and elderly individuals cannot be expected to remember alphanumeric passwords, navigate multi-factor auth, or enter verification codes. Mindora resolves this through a **WhatsApp Web-style device authorization pattern**:

```mermaid
sequenceDiagram
    participant P as Patient Screen (Tablet/TV)
    participant S as Storage / Central Cloud
    participant D as Doctor / Caregiver Dashboard

    P->>P: Opens patient.mindora.app
    P->>S: Registers pending DevicePairingRequest (e.g. "MND-842")
    P->>P: Displays large QR Code & Code with audio guidance
    Note over P: Patient device polls every 2 seconds

    D->>D: Opens Doctor or Caretaker Dashboard ("Devices" tab)
    D->>S: Sees pending request: "Patient Living Room Screen (MND-842)"
    D->>S: Clicks "Approve & Link Screen" to patient (e.g. Anima Devi)

    S-->>P: Next poll detects status === 'approved'
    P->>P: Plays gentle chime, speaks warm welcome
    P->>P: Transitions automatically to PatientHome with prescribed games
```

### 3.1 Device Revocation & Security
- Doctors and Caretakers can review all active linked screens at any time and revoke them with a single tap.
- Revocation immediately returns the patient screen to the standby pairing state.

---

## 4. Doctor Clinical Control & Activity Prescription Engine

Doctors possess clinical authority over each patient's cognitive regimen:

1. **Activity Selection**: The doctor can enable or disable any of the 4 cognitive activities based on the patient's individual clinical profile (e.g., disable Pattern Recognition if visual sequencing causes fatigue).
2. **Step Sequencing**: The doctor determines the execution order (1st Step $\to$ 2nd Step $\to$ 3rd Step $\to$ 4th Step).
3. **Round Counts**: The doctor configures the number of rounds per activity (**3, 5, or 7 rounds**).
4. **Clinical Directives**: Doctors can attach specific clinical goals and per-activity notes (e.g. *"Encourage slow visual scanning; focus on hibiscus and familiar tea cup"*).
5. **Transparency**: The Caretaker portal provides a read-only *"Doctor's Regimen"* tab ensuring the family understands the clinical rationale.

---

## 5. Multi-Patient Cohort Architecture

Both Doctor and Caregiver dashboards support managing multiple patients:

- **Patient Profiles**: Stored with individualized language preferences, cognitive baseline scores, and clinical diagnoses.
- **Active Patient Context**: Switching active patients seamlessly refreshes all telemetry charts, pending reminders, activity prescriptions, and linked devices.

---

## 6. Telemetry & Non-Diagnostic Principles

### 6.1 Accurate Statistical Measurement
All game sessions calculate genuine interaction accuracy:
$$\text{Accuracy} = \frac{\sum_{r=1}^{N} \text{Round Accuracy}_r}{N}$$
Metrics are never capped at artificial failure minimums (such as 35%). An entirely missed session produces true 0% accuracy, while flawless execution produces 100%.

### 6.2 Deterministic Adaptive Difficulty
Mindora calculates rolling performance across recent sessions:
- **Promotion Threshold**: Rolling accuracy $\ge 85\%$ triggers gentle difficulty advancement (+1 level).
- **Maintenance Range**: Rolling accuracy between $56\%$ and $84\%$ maintains stability and reassurance.
- **Relief Threshold**: Rolling accuracy $\le 55\%$ gently scales back difficulty to avert patient frustration.

---

## 7. Multilingual Localization

Mindora provides native localization across 5 Indian languages without bracketed transliterations:
- **English (`en`)**
- **Assamese (`as`)** — অসমীয়া
- **Hindi (`hi`)** — हिन्दी
- **Bengali (`bn`)** — বাংলা
- **Kannada (`kn`)** — ಕನ್ನಡ

All UI controls, game scenario prompts, objects, greetings, and reminders dynamically translate when the language toggle is switched.

---

## 8. Left Sidebar Dashboard Layout & Per-Patient Accessibility Governance

Both Doctor and Caretaker portals employ a **Left Sidebar + Right Content Container** layout:
- **Left Sidebar**:
  - Doctor / Caregiver Identity Card
  - Multi-Patient Cohort Switcher with avatars, diagnoses, and dementia stages
  - Vertical navigation tabs (Regimen, Reminders, Device Pairing, Clinical Telemetry, Accessibility)
- **Per-Patient Accessibility Governance**:
  - Elderly dementia patients are spared the cognitive burden of navigating accessibility menus.
  - Doctors and Caretakers configure font scale (Large Text), contrast theme (High Contrast), speech narration, reduced motion, and native dialect directly per patient.
  - Changes instantly broadcast to the patient screen over local cache events and WebSocket synchronization.

---

## 9. Duolingo-Style Guided Patient Regimen Path

The patient interface (`PatientHome.tsx`) implements a gamified, supportive **stepping-stone learning path**:
- **Personalized Greeting**: Spoken warm audio greeting with daily active streak counter and progress bar.
- **First Task / Immediate Care**: The earliest prescribed morning reminder (medication or hydration) occupies the first stepping stone node, offering a 1-tap "Mark Done & Continue" action.
- **Sequential Stepping Stones**: Doctor-prescribed exercises appear in exact clinical order as tactile 3D-styled circular buttons:
  - **Completed**: Emerald/gold with celebratory star badge.
  - **Active**: Glowing pulse ring with a bouncing *"Start Here"* banner.
  - **Locked**: Soft muted state indicating upcoming sequence.
- **Duolingo-Style Sticky Continue Bar**: Fixed bottom action bar displaying the current active task and a prominent *"Continue Journey"* button, guaranteeing dementia patients never get lost or confused.

---

## 10. Database Seeding & Local Docker Architecture

Mindora supports both zero-configuration local development and serverless cloud deployment:

### 10.1 Dual Database Environments
- **Local Development (Docker Compose)**: Run `bun run db:docker:up` to spin up a local PostgreSQL 16 container (`postgres:16-alpine`) on port 5432 (or 5433 if 5432 is occupied), with persistent volume storage and automated healthchecks.
- **Production / Preview (Neon Serverless)**: Branch-first serverless Postgres with instant restore, autoscaling, and Neon Auth integration.

### 10.2 CSV Data Pipeline & Dynamic Content Loading
All application data is decoupled from hardcoded source files and seeded directly into Postgres via `bun run db:seed`:
- **12 Curated Datasets (`backend/csv/`)**:
  - `patients.csv` (35+ localized profiles with routines and themes)
  - `caregivers.csv` (Caregiver records and patient links)
  - `reminders.csv` (Multilingual medication and hydration routines)
  - `caregiver_alerts.csv` (Clinical events and telemetry warnings)
  - `game_sessions.csv` (Historical cognitive telemetry sessions)
  - `adaptive_difficulty.csv` (Engine state and difficulty baselines)
  - `cultural_memories.csv` (Assamese and regional cultural memories)
  - `familiar_memories.csv` (Folk and personal reminiscence narratives)
  - `memory_card_items.csv` (Objects and motifs for Memory Match)
  - `attention_pool_items.csv` (Filter targets for Attention Challenge)
  - `pattern_sequences.csv` (Alternating motifs for Pattern Recognition)
  - `performance_trends.csv` (Longitudinal 7-day cognitive trends)
- **Dynamic Content API (`/api/content/*`, `/api/doctors/*`, `/api/activity-plans/*`, `/api/pairings/*`)**: The React frontend pulls live database records on initial load, caching them locally with `StorageService` for seamless offline resilience.

