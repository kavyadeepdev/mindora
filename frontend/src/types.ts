export type Language = 'en' | 'hi' | 'as'; // English, Hindi, Assamese

export type GameType = 'memory' | 'attention' | 'pattern' | 'routine';

export type ReminderCategory = 'medicine' | 'hydration' | 'activity' | 'appointment';

export interface Reminder {
  id: string;
  patientId: string;
  type: ReminderCategory;
  title: string;
  titleAssamese?: string;
  titleHindi?: string;
  time: string; // e.g. "09:00 AM"
  status: 'pending' | 'completed' | 'missed';
  notes?: string;
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
  titleAssamese: string;
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
