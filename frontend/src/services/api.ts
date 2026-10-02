import { 
  GameSession, 
  GameType,
  PatientProfile, 
  Reminder, 
  CaregiverAlert, 
  AdaptiveDifficultyState,
  DoctorProfile,
  PatientActivityPlan,
  DevicePairingRequest,
  CulturalMemoryItem,
  CaregiverProfile
} from '../types';

const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
  ? (import.meta.env.VITE_API_URL.endsWith('/') ? import.meta.env.VITE_API_URL.slice(0, -1) : import.meta.env.VITE_API_URL)
  : '/api';

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
    getAll: (params?: { doctorId?: string; caregiverId?: string }) => {
      const q = new URLSearchParams();
      if (params?.doctorId) q.append('doctorId', params.doctorId);
      if (params?.caregiverId) q.append('caregiverId', params.caregiverId);
      const queryStr = q.toString();
      return request<{ items: PatientProfile[]; count: number }>(`/patients${queryStr ? `?${queryStr}` : ''}`);
    },
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
    assignCaregiver: (id: string, caregiverId: string) =>
      request<{ success: boolean; patient: PatientProfile; caregiver: CaregiverProfile }>(`/patients/${id}/assign-caregiver`, {
        method: 'PUT',
        body: JSON.stringify({ caregiverId }),
      }),
    updateStatus: (id: string, accessStatus: 'active' | 'pending' | 'revoked') =>
      request<PatientProfile>(`/patients/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ accessStatus }),
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
    analyzePatient: (params: {
      patientId?: string;
      patient?: Partial<PatientProfile>;
      sessions?: GameSession[];
    }) =>
      request<{
        status: string;
        patientId: string;
        ml_analysis: {
          total_sessions: number;
          overall_accuracy_avg: number;
          average_response_time_sec: number;
          predicted_stability_score: number;
          fatigue_risk_level: string;
          fatigue_risk_score: number;
          recommended_difficulty: number;
          stability_trend: string;
          feature_importances: Record<string, number>;
          modality_breakdown?: Record<string, { sessions_count: number; average_accuracy: number; average_response_time: number }>;
          model_status: string;
        };
        ai_summary: {
          executive_summary: string;
          strengths: string[];
          fatigue_and_strain_assessment: string;
          regimen_recommendations: string[];
          model_used: string;
          source?: string;
        };
      }>('/ai/analyze-patient', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    getRecommendation: (params: {
      patientId?: string;
      patientName?: string;
      age?: number;
      language?: string;
      interests?: string[];
      recentPerformance?: Record<string, unknown>;
      completedToday?: string[];
      sessions?: any[];
    }) =>
      request<{
        recommendedActivity: string;
        gameType?: GameType;
        culturalTheme: string;
        reasoning: string;
        suggestedRounds?: number;
        suggestedDifficulty?: number;
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

  // Content (Cultural & Familiar Memories, Game Objects, Patterns, Trends)
  content: {
    getCulturalMemories: () =>
      request<{ items: CulturalMemoryItem[]; count: number }>('/content/cultural-memories'),
    getFamiliarMemories: () =>
      request<{ items: any[]; count: number }>('/content/familiar-memories'),
    getMemoryCards: () =>
      request<{ items: { id: string; name: string; nameAssamese?: string; nameHindi?: string; emoji: string; color: string }[]; count: number }>('/content/memory-cards'),
    getAttentionPool: () =>
      request<{ items: { id: string; name: string; emoji: string; isRed: boolean; colorName?: string }[]; count: number }>('/content/attention-pool'),
    getPatterns: () =>
      request<{ items: { id: string; level: number; sequence: string; correctNextEmoji: string; correctNextLabel: string; optionsEmoji: string; optionsLabel: string; patternRule: string }[]; count: number }>('/content/patterns'),
    getTrends: () =>
      request<{ items: { id: string; day: string; accuracy: number; responseTime: number; score: number }[]; count: number }>('/content/trends'),
  },

  // Doctors
  doctors: {
    getAll: () => request<{ items: DoctorProfile[]; count: number }>('/doctors'),
    getById: (id: string) => request<DoctorProfile>(`/doctors/${id}`),
    getPatients: (doctorId: string) => request<{ items: PatientProfile[]; count: number }>(`/doctors/${doctorId}/patients`),
    register: (data: {
      name: string;
      email: string;
      password: string;
      phone: string;
      hospital: string;
      specialty?: string;
      medicalRegistrationNumber: string;
      medicalCouncil: string;
      registrationYear: number;
      qualification: string;
    }) =>
      request<{ status: string; message: string; doctor: DoctorProfile }>('/doctors/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    addPatient: (doctorId: string, patientData: Partial<PatientProfile>) =>
      request<PatientProfile>(`/doctors/${doctorId}/patients`, {
        method: 'POST',
        body: JSON.stringify(patientData),
      }),
  },

  // Activity Plans
  activityPlans: {
    getByPatientId: (patientId: string) =>
      request<PatientActivityPlan>(`/activity-plans/${patientId}`),
    update: (patientId: string, plan: Partial<PatientActivityPlan>) =>
      request<PatientActivityPlan>(`/activity-plans/${patientId}`, {
        method: 'PUT',
        body: JSON.stringify(plan),
      }),
  },

  // Device Pairings
  pairings: {
    getAll: () =>
      request<{ items: DevicePairingRequest[]; count: number }>('/pairings'),
    create: (pairing: { pairCode: string; deviceName: string; browserInfo?: string; patientId?: string; patientName?: string }) =>
      request<DevicePairingRequest>('/pairings', {
        method: 'POST',
        body: JSON.stringify(pairing),
      }),
    approve: (id: string, approvedBy?: string) =>
      request<DevicePairingRequest>(`/pairings/${id}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ approvedBy }),
      }),
    reject: (id: string) =>
      request<DevicePairingRequest>(`/pairings/${id}/reject`, {
        method: 'PATCH',
      }),
  },

  // Super Admin API
  admin: {
    getOverview: () =>
      request<{
        stats: {
          totalDoctors: number;
          approvedDoctors: number;
          pendingDoctors: number;
          totalPatients: number;
          activePatients: number;
          totalCaregivers: number;
          totalDevicePairings: number;
          pendingPairings: number;
        };
        recentLogs: any[];
      }>('/admin/overview'),
    getDoctors: () =>
      request<{ items: DoctorProfile[]; count: number }>('/admin/doctors'),
    verifyDoctor: (id: string, action: 'approve' | 'reject' | 'revoke' | 'approved' | 'rejected' | 'revoked', reason?: string) =>
      request<{ success: boolean; doctor: DoctorProfile }>(`/admin/doctors/${id}/verify`, {
        method: 'POST',
        body: JSON.stringify({ action, reason }),
      }),
    getPatients: () =>
      request<{ items: PatientProfile[]; count: number }>('/admin/patients'),
    updatePatientStatus: (id: string, accessStatus: 'active' | 'revoked' | 'pending') =>
      request<PatientProfile>(`/admin/patients/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ accessStatus }),
      }),
    assignPatient: (id: string, assignment: { doctorId?: string; caregiverId?: string }) =>
      request<PatientProfile>(`/admin/patients/${id}/assign`, {
        method: 'PUT',
        body: JSON.stringify(assignment),
      }),
    getCaregivers: () =>
      request<{ items: CaregiverProfile[]; count: number }>('/admin/caregivers'),
    updateCaregiverStatus: (id: string, status: 'active' | 'revoked') =>
      request<CaregiverProfile>(`/admin/caregivers/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
    getAuditLogs: () =>
      request<{ items: any[]; count: number }>('/admin/audit-logs'),
    getPairings: () =>
      request<{ items: DevicePairingRequest[]; count: number }>('/admin/pairings'),
    approvePairing: (id: string) =>
      request<DevicePairingRequest>(`/admin/pairings/${id}/approve`, {
        method: 'PUT',
      }),
    revokePairing: (id: string) =>
      request<DevicePairingRequest>(`/admin/pairings/${id}/revoke`, {
        method: 'PUT',
      }),
  },
};

