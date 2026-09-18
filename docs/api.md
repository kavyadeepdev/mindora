# Mindora Backend REST API Specification

Base URL: `http://localhost:4000` (or `/api` proxied through Vite in development).

All JSON request bodies must include the header `Content-Type: application/json`.

---

## 1. System & Health

### `GET /api/health`
Returns the status of the Fastify server, database connection (Neon PostgreSQL), Better Auth configuration, and AI microservice URL.

**Response `200 OK`**:
```json
{
  "status": "ok",
  "service": "@mindora/backend",
  "version": "0.1.0",
  "timestamp": "2026-09-18T17:36:53.226Z",
  "database": {
    "status": "connected",
    "provider": "Neon PostgreSQL"
  },
  "auth": {
    "provider": "Better Auth",
    "configured": true
  },
  "fastapiAiService": {
    "configuredUrl": "http://localhost:8000"
  }
}
```

---

## 2. Authentication (`/api/auth/*`)

Powered by **Better Auth**.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/sign-up/email` | Register a new user account with email and password |
| `POST` | `/api/auth/sign-in/email` | Sign in with email and password, establishing a session |
| `POST` | `/api/auth/sign-out` | Invalidate current session and clear cookies |
| `GET` | `/api/auth/get-session` | Retrieve currently authenticated user and session metadata |

---

## 3. Game Telemetry & Analytics (`/api/games/*`)

### `POST /api/games/sessions`
Records a newly completed game session, saves telemetry to Postgres, evaluates the rolling performance window, and updates the patient's adaptive difficulty state.

**Request Body**:
```json
{
  "id": "optional-uuid",
  "patientId": "patient-anima-01",
  "gameType": "memory",
  "gameTitle": "Memory Match - Assam Flowers",
  "score": 450,
  "accuracy": 92.5,
  "responseTime": 3.8,
  "attempts": 6,
  "difficulty": 2,
  "completed": true,
  "notes": "Patient was enthusiastic and recognized the orchids immediately."
}
```

**Response `201 Created`**:
```json
{
  "session": {
    "id": "7bf3-...",
    "patientId": "patient-anima-01",
    "gameType": "memory",
    "score": 450,
    "accuracy": 92.5,
    "responseTime": 3.8,
    "difficulty": 2,
    "playedAt": "2026-09-18T22:30:00.000Z"
  },
  "adaptiveDifficulty": {
    "id": "adapt-...",
    "patientId": "patient-anima-01",
    "gameType": "memory",
    "currentDifficulty": 3,
    "recentAccuracyAverage": 90.2,
    "historyExplanation": [
      "2026-09-18: Advanced difficulty to Level 3 after consistent high accuracy (90.2%)."
    ]
  },
  "alert": null
}
```

---

### `GET /api/games/sessions`
Query historical sessions.

**Query Parameters**:
- `patientId` (string, optional)
- `gameType` (string, optional: `memory`, `attention`, `pattern`, `routine`)
- `limit` (number, default: 50, max: 100)
- `offset` (number, default: 0)

---

### `GET /api/games/analytics/:patientId`
Retrieves aggregated cognitive metrics for a patient (total sessions, average accuracy, response times, and breakdown by game type).

---

### `GET /api/games/difficulty/:patientId`
Returns the current adaptive difficulty level for all four game types for that patient.

---

### `PATCH /api/games/difficulty/:patientId`
Allows caregivers to manually adjust or reset difficulty for a game.

---

## 4. Patient Profiles (`/api/patients/*`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/patients` | List patients for the logged-in caregiver (or all demo patients) |
| `POST` | `/api/patients` | Create a new patient profile with routine schedule |
| `GET` | `/api/patients/:id` | Get specific patient profile |
| `PUT` | `/api/patients/:id` | Update patient profile details |
| `GET` | `/api/patients/caregiver/profile` | Retrieve profile of the logged-in caregiver |

---

## 5. Reminders (`/api/reminders/*`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/reminders?patientId=:id` | List reminders for a patient |
| `POST` | `/api/reminders` | Create a medication, hydration, or activity reminder |
| `PATCH` | `/api/reminders/:id/status` | Update status (`pending`, `completed`, `missed`) |

---

## 6. Caregiver Alerts (`/api/alerts/*`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/alerts?patientId=:id&unreadOnly=true` | Fetch alerts |
| `POST` | `/api/alerts` | Create an alert manually or via telemetry |
| `PATCH` | `/api/alerts/:id/read` | Mark alert as acknowledged/read |

---

## 7. AI Recommendations (`/api/ai/*`)

### `POST /api/ai/recommendation`
Fetches a personalized activity recommendation. Automatically proxies to the FastAPI service at `FASTAPI_SERVICE_URL` if reachable, or uses the cultural fallback engine if offline.

### `GET /api/ai/service-status`
Returns connection status to the future FastAPI service.

---

## 8. Doctor Clinical Regimens (`/api/prescriptions/*`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/prescriptions/:patientId` | Get the doctor's prescribed activity sequence, round counts, and notes |
| `PUT` | `/api/prescriptions/:patientId` | Update activity enablement, order (1st–4th), and rounds (3, 5, 7) |
| `POST` | `/api/prescriptions/:patientId/reset` | Reset activity plan to standard default regimen |

---

## 9. WhatsApp Web-Style Device Pairing (`/api/devices/*`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/devices/pairing-request` | Patient device registers a pending code (e.g. `MND-842`) |
| `GET` | `/api/devices/pairing-requests` | Doctor / Caretaker fetches pending pairing requests |
| `POST` | `/api/devices/pairing-requests/:id/approve` | Clinician or Caretaker approves device and links to patient |
| `POST` | `/api/devices/pairing-requests/:id/reject` | Reject pairing request |
| `GET` | `/api/devices/linked` | List currently active paired screens |
| `DELETE` | `/api/devices/linked/:id` | Revoke screen access, returning screen to pairing standby |

---

## 10. Dynamic Content (`/api/content/*`)

Decoupled dynamic content endpoints pulling directly from PostgreSQL tables:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/content/cultural-memories` | Cultural memories and regional heritage landmarks |
| `GET` | `/api/content/familiar-memories` | Multilingual folk and personal reminiscence narratives |
| `GET` | `/api/content/memory-cards` | Card pool for Memory Match (colors, multilingual labels) |
| `GET` | `/api/content/attention-pool` | Distractor and target objects for Attention Challenge |
| `GET` | `/api/content/patterns` | Alternating rhythm sequences for Pattern Recognition |
| `GET` | `/api/content/trends` | 7-day longitudinal cognitive performance trends |

---

## 11. Doctors & Activity Plans

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/doctors` | List registered doctor profiles |
| `GET` | `/api/doctors/:id` | Get clinician profile and linked patients |
| `GET` | `/api/activity-plans/:patientId` | Get doctor-prescribed activity sequence and clinical goals |
| `PUT` | `/api/activity-plans/:patientId` | Create or update activity plan for patient |
| `GET` | `/api/pairings` | List pending and approved device pairings |
| `POST` | `/api/pairings` | Submit a new device pairing request |
| `PATCH` | `/api/pairings/:id/approve` | Approve pairing and assign authentication token |
| `PATCH` | `/api/pairings/:id/reject` | Reject pairing request |


