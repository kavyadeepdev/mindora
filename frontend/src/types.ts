export type Language = 'en' | 'hi' | 'as' | 'bn' | 'kn'; // English, Hindi, Assamese, Bengali, Kannada

export type GameType = 'memory' | 'attention' | 'pattern' | 'routine';

export type ReminderCategory = 'medicine' | 'hydration' | 'activity' | 'appointment';

export interface Reminder {
  id: string;
  patientId: string;
  type: ReminderCategory;
  title: string;
  titleAssamese?: string;
  titleHindi?: string;
  titleBengali?: string;
  titleKannada?: string;
  time: string; // e.g. "09:00 AM"
  status: 'pending' | 'completed' | 'missed';
  notes?: string;
  notesAssamese?: string;
  notesHindi?: string;
  notesBengali?: string;
  notesKannada?: string;
}

export interface PatientProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  location: string;
  language: Language;
  interests: string[];
  avatarUrl?: string;
  dailyRoutine: {
    morningWakeUp: string;
    morningHydration: string;
    morningMeds: string;
    breakfast: string;
    morningWalk: string;
    eveningTea: string;
    nightSleep: string;
  };
  caregiverId: string;
  culturalTheme: string;
  diagnosis?: string;
  stage?: string;
  accessibility?: AccessibilitySettings;
}

export type GuidedStepType = 'greeting' | 'reminder' | 'activity' | 'celebration';

export interface GuidedPathStep {
  id: string;
  stepNumber: number;
  type: GuidedStepType;
  title: string;
  subtitle?: string;
  completed: boolean;
  active: boolean;
  gameType?: GameType;
  reminderId?: string;
  roundsCount?: number;
  iconType?: string;
  notes?: string;
}

export interface CaregiverProfile {
  id: string;
  name: string;
  relation: string;
  phone: string;
  linkedPatientIds: string[];
}

export interface GameSession {
  id: string;
  patientId: string;
  gameType: GameType;
  gameTitle: string;
  score: number;
  accuracy: number; // percentage (0 - 100)
  responseTime: number; // seconds
  attempts: number;
  difficulty: number; // 1 to 5
  timestamp: string; // ISO string
  dateFormatted: string;
  completed: boolean;
  notes?: string;
  synced: boolean;
}

export interface AdaptiveDifficultyState {
  gameType: GameType;
  currentDifficulty: number; // 1 to 5
  recentAccuracyAverage: number;
  historyExplanation: string[];
  lastAdjustedDate: string;
}

export interface CaregiverAlert {
  id: string;
  type: 'success' | 'warning' | 'info' | 'notice';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionLabel?: string;
  actionType?: string;
}

export type AlertItem = CaregiverAlert;

export interface AccessibilitySettings {
  largeText: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
  audioFeedback: boolean;
}

export interface CulturalMemoryItem {
  id: string;
  title: string;
  titleAssamese?: string;
  titleHindi?: string;
  titleBengali?: string;
  titleKannada?: string;
  category: string;
  description: string;
  emoji: string;
  theme: string;
}

export interface DemoStep {
  step: number;
  title: string;
  description: string;
  targetView: 'landing' | 'patient' | 'caregiver' | 'game-memory' | 'game-attention' | 'game-pattern' | 'game-routine';
}

export type SubdomainPortal = 'landing' | 'patient' | 'doctor' | 'caretaker';

export interface DoctorProfile {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  phone: string;
  email: string;
  linkedPatientIds: string[];
}

export interface ActivityPrescriptionItem {
  gameType: GameType;
  title: string;
  enabled: boolean;
  order: number; // 1, 2, 3, 4
  rounds: number; // e.g. 3, 5, 7
  targetFocus: string; // e.g., 'Visual Recall', 'Selective Attention', 'Sequencing'
  doctorNotes?: string;
}

export interface PatientActivityPlan {
  patientId: string;
  prescribedByDoctorId: string;
  doctorName: string;
  lastUpdated: string;
  clinicalGoal?: string;
  activities: ActivityPrescriptionItem[];
}

export interface DevicePairingRequest {
  id: string;
  pairCode: string; // e.g. 'MND-842'
  deviceName: string;
  browserInfo: string;
  ipAddress?: string;
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  patientId?: string;
  patientName?: string;
  approvedBy?: string;
  requestedAt: string;
  approvedAt?: string;
  token?: string;
}
