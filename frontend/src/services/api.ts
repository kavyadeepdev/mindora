import { GameSession, PatientProfile, Reminder, CaregiverAlert, AdaptiveDifficultyState } from '../types';

const BASE_URL = '/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      return {
        status: res.status,
        error: errorBody.error || errorBody.message || `HTTP ${res.status}: ${res.statusText}`,
      };
    }

    const data = await res.json();
    return { status: res.status, data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      status: 0,
      error: `Network error: ${msg}`,
    };
  }
}

export const apiClient = {
  // System
  health: () => request<{ status: string; database: { status: string }; auth: { configured: boolean } }>('/health'),

  // Games Telemetry
  games: {
    recordSession: (session: Partial<GameSession> & { patientId: string; gameType: string; score: number; accuracy: number; responseTime: number }) =>
      request<{
        session: GameSession;
        adaptiveDifficulty: AdaptiveDifficultyState;
        alert: CaregiverAlert | null;
      }>('/games/sessions', {
        method: 'POST',
        body: JSON.stringify(session),
      }),

    getSessions: (patientId?: string, gameType?: string, limit = 50) => {
      const params = new URLSearchParams();
      if (patientId) params.append('patientId', patientId);
      if (gameType) params.append('gameType', gameType);
      params.append('limit', String(limit));
      return request<{ items: GameSession[]; count: number }>(`/games/sessions?${params.toString()}`);
    },

    getAnalytics: (patientId: string) =>
      request<{
        patientId: string;
        totalSessions: number;
        totalScore: number;
        overallAccuracyAverage: number;
        averageResponseTime: number;
        breakdownByGame: Record<string, { count: number; averageAccuracy: number; averageScore: number }>;
        recentSessions: GameSession[];
      }>(`/games/analytics/${patientId}`),

    getDifficulty: (patientId: string) =>
      request<{ patientId: string; difficulties: AdaptiveDifficultyState[] }>(`/games/difficulty/${patientId}`),

    updateDifficulty: (patientId: string, gameType: string, difficulty: number, reason?: string) =>
      request<AdaptiveDifficultyState>(`/games/difficulty/${patientId}`, {
        method: 'PATCH',
        body: JSON.stringify({ gameType, difficulty, reason }),
      }),
  },

  // Patients
  patients: {
    getAll: () => request<{ items: PatientProfile[]; count: number }>('/patients'),
    getById: (id: string) => request<PatientProfile>(`/patients/${id}`),
    create: (patient: Partial<PatientProfile>) =>
      request<PatientProfile>('/patients', {
        method: 'POST',
        body: JSON.stringify(patient),
      }),
    update: (id: string, updates: Partial<PatientProfile>) =>
      request<PatientProfile>(`/patients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
  },

  // Reminders
  reminders: {
    getAll: (patientId?: string, status?: string) => {
      const params = new URLSearchParams();
      if (patientId) params.append('patientId', patientId);
      if (status) params.append('status', status);
      return request<{ items: Reminder[]; count: number }>(`/reminders?${params.toString()}`);
    },
    create: (reminder: Partial<Reminder> & { patientId: string; type: string; title: string; time: string }) =>
      request<Reminder>('/reminders', {
        method: 'POST',
        body: JSON.stringify(reminder),
      }),
    updateStatus: (id: string, status: 'pending' | 'completed' | 'missed') =>
      request<Reminder>(`/reminders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  },

  // Alerts
  alerts: {
    getAll: (patientId?: string, unreadOnly = false) => {
      const params = new URLSearchParams();
      if (patientId) params.append('patientId', patientId);
      if (unreadOnly) params.append('unreadOnly', 'true');
      return request<{ items: CaregiverAlert[]; count: number }>(`/alerts?${params.toString()}`);
    },
    markRead: (id: string) =>
      request<CaregiverAlert>(`/alerts/${id}/read`, {
        method: 'PATCH',
      }),
  },

  // AI Recommendation Engine
  ai: {
    getRecommendation: (params: {
      patientName?: string;
      age?: number;
      language?: string;
      interests?: string[];
      recentPerformance?: Record<string, unknown>;
      completedToday?: string[];
    }) =>
      request<{
        recommendedActivity: string;
        culturalTheme: string;
        reasoning: string;
        encouragement: string;
        isAiGenerated: boolean;
        source: string;
      }>('/ai/recommendation', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    getServiceStatus: () =>
      request<{
        fastapiServiceUrl: string;
        connected: boolean;
        status: string;
      }>('/ai/service-status'),
  },
};
