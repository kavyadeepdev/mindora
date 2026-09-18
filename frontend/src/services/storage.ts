import { GameSession, PatientProfile, CaregiverProfile, Reminder, CaregiverAlert, AdaptiveDifficultyState, AccessibilitySettings } from '../types';
import { INITIAL_PATIENT, INITIAL_CAREGIVER, INITIAL_REMINDERS, INITIAL_SESSIONS, INITIAL_ALERTS, INITIAL_ADAPTIVE_STATES } from '../data/mockData';

const STORAGE_KEYS = {
  PATIENT: 'mindora_patient_v1',
  CAREGIVER: 'mindora_caregiver_v1',
  REMINDERS: 'mindora_reminders_v1',
  SESSIONS: 'mindora_sessions_v1',
  ALERTS: 'mindora_alerts_v1',
  ADAPTIVE: 'mindora_adaptive_v1',
  OFFLINE_OVERRIDE: 'mindora_offline_override_v1',
  PENDING_SYNC: 'mindora_pending_sync_v1',
  ACCESSIBILITY: 'mindora_accessibility_v1'
};

export class StorageService {
  private static isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  // Patient Profile
  static getPatient(): PatientProfile {
    if (!this.isBrowser()) return INITIAL_PATIENT;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PATIENT);
      return data ? JSON.parse(data) : INITIAL_PATIENT;
    } catch {
      return INITIAL_PATIENT;
    }
  }

  static savePatient(patient: PatientProfile): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.PATIENT, JSON.stringify(patient));
  }

  // Caregiver Profile
  static getCaregiver(): CaregiverProfile {
    if (!this.isBrowser()) return INITIAL_CAREGIVER;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CAREGIVER);
      return data ? JSON.parse(data) : INITIAL_CAREGIVER;
    } catch {
      return INITIAL_CAREGIVER;
    }
  }

  // Reminders
  static getReminders(): Reminder[] {
    if (!this.isBrowser()) return INITIAL_REMINDERS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REMINDERS);
      return data ? JSON.parse(data) : INITIAL_REMINDERS;
    } catch {
      return INITIAL_REMINDERS;
    }
  }

  static saveReminders(reminders: Reminder[]): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
  }

  static toggleReminder(id: string): Reminder[] {
    const list = this.getReminders();
    const updated = list.map(r => {
      if (r.id === id) {
        return { ...r, status: (r.status === 'completed' ? 'pending' : 'completed') as 'pending' | 'completed' };
      }
      return r;
    });
    this.saveReminders(updated);
    return updated;
  }

  static addReminder(reminder: Reminder): Reminder[] {
    const list = this.getReminders();
    const updated = [reminder, ...list];
    this.saveReminders(updated);
    return updated;
  }


  // Sessions
  static getSessions(): GameSession[] {
    if (!this.isBrowser()) return INITIAL_SESSIONS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      return data ? JSON.parse(data) : INITIAL_SESSIONS;
    } catch {
      return INITIAL_SESSIONS;
    }
  }

  static addSession(session: GameSession): { isOffline: boolean; pendingCount: number } {
    const sessions = this.getSessions();
    const isOffline = this.isOffline();

    const newSession: GameSession = {
      ...session,
      synced: !isOffline
    };

    const updatedSessions = [newSession, ...sessions];
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(updatedSessions));
    }

    if (isOffline) {
      const pending = this.getPendingSyncCount() + 1;
      this.setPendingSyncCount(pending);
      return { isOffline: true, pendingCount: pending };
    }

    return { isOffline: false, pendingCount: 0 };
  }

  // Alerts
  static getAlerts(): CaregiverAlert[] {
    if (!this.isBrowser()) return INITIAL_ALERTS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ALERTS);
      return data ? JSON.parse(data) : INITIAL_ALERTS;
    } catch {
      return INITIAL_ALERTS;
    }
  }

  static saveAlerts(alerts: CaregiverAlert[]): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
  }

  static addAlert(alert: CaregiverAlert): void {
    const alerts = this.getAlerts();
    this.saveAlerts([alert, ...alerts]);
  }

  // Adaptive Difficulty States
  static getAdaptiveStates(): Record<string, AdaptiveDifficultyState> {
    if (!this.isBrowser()) return INITIAL_ADAPTIVE_STATES;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ADAPTIVE);
      return data ? JSON.parse(data) : INITIAL_ADAPTIVE_STATES;
    } catch {
      return INITIAL_ADAPTIVE_STATES;
    }
  }

  static saveAdaptiveStates(states: Record<string, AdaptiveDifficultyState>): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.ADAPTIVE, JSON.stringify(states));
  }

  // Offline Simulation Mode (Crucial for remote connectivity testing and demo flow step 14 & 16)
  static isOffline(): boolean {
    if (!this.isBrowser()) return false;
    const override = localStorage.getItem(STORAGE_KEYS.OFFLINE_OVERRIDE);
    if (override !== null) {
      return override === 'true';
    }
    return !navigator.onLine;
  }

  static setOfflineOverride(offline: boolean): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.OFFLINE_OVERRIDE, String(offline));
    // Dispatch event so UI indicators react instantly
    window.dispatchEvent(new Event('mindora-network-change'));
  }

  static getPendingSyncCount(): number {
    if (!this.isBrowser()) return 0;
    const c = localStorage.getItem(STORAGE_KEYS.PENDING_SYNC);
    return c ? parseInt(c, 10) : 0;
  }

  static setPendingSyncCount(count: number): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, String(count));
    window.dispatchEvent(new Event('mindora-sync-change'));
  }

  static syncPendingActivities(): Promise<{ syncedCount: number }> {
    return new Promise((resolve) => {
      const count = this.getPendingSyncCount();
      // Mark all pending sessions as synced
      const sessions = this.getSessions().map(s => ({ ...s, synced: true }));
      this.saveSessions(sessions);
      this.setPendingSyncCount(0);
      resolve({ syncedCount: count || 3 });
    });
  }

  static syncPendingSessions(): void {
    const sessions = this.getSessions().map(s => ({ ...s, synced: true }));
    this.saveSessions(sessions);
    this.setPendingSyncCount(0);
  }

  static saveSessions(sessions: GameSession[]): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  }

  // Accessibility Settings
  static getAccessibility(): AccessibilitySettings {
    const defaults: AccessibilitySettings = {
      largeText: false,
      highContrast: false,
      reduceMotion: false,
      audioFeedback: true
    };
    if (!this.isBrowser()) return defaults;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACCESSIBILITY);
      return data ? JSON.parse(data) : defaults;
    } catch {
      return defaults;
    }
  }

  static saveAccessibility(settings: AccessibilitySettings): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.ACCESSIBILITY, JSON.stringify(settings));
  }

  // Reset to default demo data
  static resetToDemo(): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.PATIENT, JSON.stringify(INITIAL_PATIENT));
    localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(INITIAL_REMINDERS));
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(INITIAL_SESSIONS));
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(INITIAL_ALERTS));
    localStorage.setItem(STORAGE_KEYS.ADAPTIVE, JSON.stringify(INITIAL_ADAPTIVE_STATES));
    localStorage.setItem(STORAGE_KEYS.OFFLINE_OVERRIDE, 'false');
    localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, '0');
    window.dispatchEvent(new Event('mindora-reset-demo'));
  }
}
