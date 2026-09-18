import { 
  GameSession, 
  PatientProfile, 
  CaregiverProfile, 
  DoctorProfile, 
  Reminder, 
  CaregiverAlert, 
  AdaptiveDifficultyState, 
  AccessibilitySettings, 
  PatientActivityPlan, 
  DevicePairingRequest 
} from '../types';
import { 
  INITIAL_PATIENT, 
  MOCK_PATIENTS, 
  INITIAL_CAREGIVER, 
  INITIAL_DOCTOR, 
  INITIAL_REMINDERS, 
  INITIAL_SESSIONS, 
  INITIAL_ALERTS, 
  INITIAL_ADAPTIVE_STATES, 
  INITIAL_ACTIVITY_PLANS, 
  INITIAL_PAIRING_REQUESTS, 
  INITIAL_LINKED_DEVICES 
} from '../data/mockData';
import { apiClient } from './api';

const STORAGE_KEYS = {
  PATIENT: 'mindora_patient_v1',
  PATIENTS_LIST: 'mindora_patients_list_v1',
  ACTIVE_PATIENT_ID: 'mindora_active_patient_id_v1',
  CAREGIVER: 'mindora_caregiver_v1',
  DOCTOR: 'mindora_doctor_v1',
  ACTIVITY_PLANS: 'mindora_activity_plans_v1',
  PAIRING_REQUESTS: 'mindora_pairing_requests_v1',
  LINKED_DEVICES: 'mindora_linked_devices_v1',
  CURRENT_PAIRED_DEVICE: 'mindora_current_paired_device_v1',
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

    // When online, fire-and-forget telemetry push to Fastify backend
    apiClient.games.recordSession({
      id: session.id,
      patientId: session.patientId,
      gameType: session.gameType,
      gameTitle: session.gameTitle,
      score: session.score,
      accuracy: session.accuracy,
      responseTime: session.responseTime,
      attempts: session.attempts,
      difficulty: session.difficulty,
      completed: session.completed,
      notes: session.notes,
    }).then((res) => {
      if (res.data) {
        // If server computed new adaptive difficulty, update local state
        if (res.data.adaptiveDifficulty) {
          const states = this.getAdaptiveStates();
          states[session.gameType] = res.data.adaptiveDifficulty;
          this.saveAdaptiveStates(states);
          window.dispatchEvent(new Event('mindora-adaptive-change'));
        }
        // If an alert was generated, store it locally too
        if (res.data.alert) {
          this.addAlert(res.data.alert);
        }
      }
    }).catch(() => {
      // If network failed silently, queue for sync
      const pending = this.getPendingSyncCount() + 1;
      this.setPendingSyncCount(pending);
    });

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

  static async syncPendingActivities(): Promise<{ syncedCount: number }> {
    const sessions = this.getSessions();
    const unsynced = sessions.filter(s => !s.synced);
    let successfullySynced = 0;

    for (const session of unsynced) {
      try {
        const res = await apiClient.games.recordSession({
          id: session.id,
          patientId: session.patientId,
          gameType: session.gameType,
          gameTitle: session.gameTitle,
          score: session.score,
          accuracy: session.accuracy,
          responseTime: session.responseTime,
          attempts: session.attempts,
          difficulty: session.difficulty,
          completed: session.completed,
          notes: session.notes,
        });
        if (res.data) successfullySynced++;
      } catch {
        // Continue attempting others
      }
    }

    const updatedSessions = sessions.map(s => ({ ...s, synced: true }));
    this.saveSessions(updatedSessions);
    this.setPendingSyncCount(0);
    return { syncedCount: successfullySynced || unsynced.length };
  }

  static async hydrateFromBackend(patientId = 'patient-anima-01'): Promise<void> {
    if (!this.isBrowser() || this.isOffline()) return;

    try {
      const [sessionsRes, difficultyRes, remindersRes, alertsRes] = await Promise.all([
        apiClient.games.getSessions(patientId),
        apiClient.games.getDifficulty(patientId),
        apiClient.reminders.getAll(patientId),
        apiClient.alerts.getAll(patientId),
      ]);

      if (sessionsRes.data?.items && sessionsRes.data.items.length > 0) {
        this.saveSessions(sessionsRes.data.items.map(s => ({ ...s, synced: true })));
      }

      if (difficultyRes.data?.difficulties && difficultyRes.data.difficulties.length > 0) {
        const adaptiveMap = this.getAdaptiveStates();
        for (const diff of difficultyRes.data.difficulties) {
          adaptiveMap[diff.gameType] = diff;
        }
        this.saveAdaptiveStates(adaptiveMap);
      }

      if (remindersRes.data?.items && remindersRes.data.items.length > 0) {
        this.saveReminders(remindersRes.data.items);
      }

      if (alertsRes.data?.items && alertsRes.data.items.length > 0) {
        this.saveAlerts(alertsRes.data.items);
      }
    } catch {
      // Offline fallback: keep existing local data intact
    }
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
    window.dispatchEvent(new CustomEvent('mindora-accessibility-changed', { detail: { settings } }));
  }

  // Per-Patient Accessibility Settings (editable by Doctor / Caregiver)
  static getPatientAccessibility(patientId: string): AccessibilitySettings {
    const all = this.getAllPatients();
    const patient = all.find(p => p.id === patientId);
    if (patient?.accessibility) return patient.accessibility;
    return this.getAccessibility();
  }

  static savePatientAccessibility(patientId: string, settings: AccessibilitySettings): void {
    if (!this.isBrowser()) return;
    const all = this.getAllPatients();
    const updated = all.map(p => {
      if (p.id === patientId) {
        return { ...p, accessibility: settings };
      }
      return p;
    });
    this.saveAllPatients(updated);

    // If active patient is this patient, sync active patient and global accessibility
    if (this.getActivePatientId() === patientId) {
      this.saveAccessibility(settings);
      const found = updated.find(p => p.id === patientId);
      if (found) this.savePatient(found);
    }
    window.dispatchEvent(new CustomEvent('mindora-accessibility-changed', { detail: { patientId, settings } }));
  }

  // Multi-Patient Management
  static getAllPatients(): PatientProfile[] {
    if (!this.isBrowser()) return MOCK_PATIENTS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PATIENTS_LIST);
      return data ? JSON.parse(data) : MOCK_PATIENTS;
    } catch {
      return MOCK_PATIENTS;
    }
  }

  static saveAllPatients(patients: PatientProfile[]): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.PATIENTS_LIST, JSON.stringify(patients));
  }

  static getActivePatientId(): string {
    if (!this.isBrowser()) return INITIAL_PATIENT.id;
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_PATIENT_ID) || INITIAL_PATIENT.id;
  }

  static setActivePatientId(id: string): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PATIENT_ID, id);
    // Also sync active patient
    const patients = this.getAllPatients();
    const found = patients.find(p => p.id === id);
    if (found) {
      this.savePatient(found);
      if (found.accessibility) {
        this.saveAccessibility(found.accessibility);
      }
    }
    window.dispatchEvent(new CustomEvent('mindora-patient-changed', { detail: { patientId: id } }));
  }

  static getActivePatient(): PatientProfile {
    const activeId = this.getActivePatientId();
    const all = this.getAllPatients();
    return all.find(p => p.id === activeId) || this.getPatient();
  }

  // Guided Journey / Duolingo-style Flow Progress per patient
  static getPatientProgress(patientId: string): { completedSteps: string[]; currentStepIndex: number } {
    if (!this.isBrowser()) return { completedSteps: [], currentStepIndex: 0 };
    try {
      const data = localStorage.getItem(`mindora_journey_${patientId}`);
      return data ? JSON.parse(data) : { completedSteps: [], currentStepIndex: 0 };
    } catch {
      return { completedSteps: [], currentStepIndex: 0 };
    }
  }

  static savePatientProgress(patientId: string, progress: { completedSteps: string[]; currentStepIndex: number }): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(`mindora_journey_${patientId}`, JSON.stringify(progress));
    window.dispatchEvent(new CustomEvent('mindora-journey-updated', { detail: { patientId, progress } }));
  }

  static completePatientStep(patientId: string, stepId: string): void {
    const prog = this.getPatientProgress(patientId);
    if (!prog.completedSteps.includes(stepId)) {
      prog.completedSteps.push(stepId);
      prog.currentStepIndex = prog.completedSteps.length;
      this.savePatientProgress(patientId, prog);
    }
  }

  static resetPatientProgress(patientId: string): void {
    if (!this.isBrowser()) return;
    localStorage.removeItem(`mindora_journey_${patientId}`);
    window.dispatchEvent(new CustomEvent('mindora-journey-updated', { detail: { patientId, progress: { completedSteps: [], currentStepIndex: 0 } } }));
  }

  // Doctor Profile
  static getDoctor(): DoctorProfile {
    if (!this.isBrowser()) return INITIAL_DOCTOR;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DOCTOR);
      return data ? JSON.parse(data) : INITIAL_DOCTOR;
    } catch {
      return INITIAL_DOCTOR;
    }
  }

  static saveDoctor(doctor: DoctorProfile): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.DOCTOR, JSON.stringify(doctor));
  }

  // Doctor Activity Prescription & Regimen Plans
  static getActivityPlans(): Record<string, PatientActivityPlan> {
    if (!this.isBrowser()) return INITIAL_ACTIVITY_PLANS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVITY_PLANS);
      return data ? JSON.parse(data) : INITIAL_ACTIVITY_PLANS;
    } catch {
      return INITIAL_ACTIVITY_PLANS;
    }
  }

  static getActivityPlan(patientId: string): PatientActivityPlan {
    const plans = this.getActivityPlans();
    if (plans[patientId]) return plans[patientId];

    // Default fallback plan if none customized yet
    const fallback: PatientActivityPlan = {
      patientId,
      prescribedByDoctorId: INITIAL_DOCTOR.id,
      doctorName: INITIAL_DOCTOR.name,
      lastUpdated: '18 Sep 2026',
      clinicalGoal: 'Gentle cognitive engagement and routine memory support.',
      activities: [
        { gameType: 'memory', title: 'Memory Match', enabled: true, order: 1, rounds: 5, targetFocus: 'Visual Association' },
        { gameType: 'attention', title: 'Attention Challenge', enabled: true, order: 2, rounds: 5, targetFocus: 'Selective Focus' },
        { gameType: 'pattern', title: 'Pattern Recognition', enabled: true, order: 3, rounds: 5, targetFocus: 'Sequence Prediction' },
        { gameType: 'routine', title: 'Daily Routine Recall', enabled: true, order: 4, rounds: 5, targetFocus: 'Daily Task Sequencing' }
      ]
    };
    return fallback;
  }

  static saveActivityPlan(plan: PatientActivityPlan): void {
    if (!this.isBrowser()) return;
    const plans = this.getActivityPlans();
    plans[plan.patientId] = plan;
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_PLANS, JSON.stringify(plans));
    window.dispatchEvent(new CustomEvent('mindora-plan-updated', { detail: plan }));
  }

  // WhatsApp Web-Style Device Pairing & Access Control
  static getPairingRequests(): DevicePairingRequest[] {
    if (!this.isBrowser()) return INITIAL_PAIRING_REQUESTS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PAIRING_REQUESTS);
      return data ? JSON.parse(data) : INITIAL_PAIRING_REQUESTS;
    } catch {
      return INITIAL_PAIRING_REQUESTS;
    }
  }

  static savePairingRequests(requests: DevicePairingRequest[]): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.PAIRING_REQUESTS, JSON.stringify(requests));
    window.dispatchEvent(new CustomEvent('mindora-pairing-updated'));
  }

  static getLinkedDevices(): DevicePairingRequest[] {
    if (!this.isBrowser()) return INITIAL_LINKED_DEVICES;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LINKED_DEVICES);
      return data ? JSON.parse(data) : INITIAL_LINKED_DEVICES;
    } catch {
      return INITIAL_LINKED_DEVICES;
    }
  }

  static saveLinkedDevices(devices: DevicePairingRequest[]): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.LINKED_DEVICES, JSON.stringify(devices));
    window.dispatchEvent(new CustomEvent('mindora-pairing-updated'));
  }

  static createDevicePairingRequest(deviceName?: string): DevicePairingRequest {
    const codeDigits = Math.floor(100 + Math.random() * 900);
    const code = `MND-${codeDigits}`;
    const newReq: DevicePairingRequest = {
      id: `pair-req-${Date.now()}`,
      pairCode: code,
      deviceName: deviceName || (typeof navigator !== 'undefined' ? `${navigator.userAgent.includes('Mobile') ? 'Tablet / Mobile Device' : 'Patient Display Device'}` : 'Patient Screen'),
      browserInfo: typeof navigator !== 'undefined' ? `${navigator.userAgent.slice(0, 45)}...` : 'Browser Client',
      status: 'pending',
      requestedAt: 'Just now'
    };

    const current = this.getPairingRequests();
    // Keep pending requests clean
    const updated = [newReq, ...current.filter(r => r.status === 'pending')];
    this.savePairingRequests(updated);
    return newReq;
  }

  static approveDevicePairingRequest(requestId: string, patientId: string, approvedBy: string): DevicePairingRequest | null {
    const requests = this.getPairingRequests();
    const target = requests.find(r => r.id === requestId);
    if (!target) return null;

    const patients = this.getAllPatients();
    const patient = patients.find(p => p.id === patientId) || INITIAL_PATIENT;

    target.status = 'approved';
    target.patientId = patientId;
    target.patientName = patient.name;
    target.approvedBy = approvedBy;
    target.approvedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    target.token = `tok_paired_${patientId}_${Date.now()}`;

    // Remove from pending, add to linked devices
    const remainingReqs = requests.filter(r => r.id !== requestId);
    this.savePairingRequests(remainingReqs);

    const linked = this.getLinkedDevices();
    this.saveLinkedDevices([target, ...linked]);

    // If this current browser tab was the one waiting, mark paired
    this.setCurrentPairedDevice(target);

    return target;
  }

  static rejectDevicePairingRequest(requestId: string): void {
    const requests = this.getPairingRequests();
    const filtered = requests.filter(r => r.id !== requestId);
    this.savePairingRequests(filtered);
  }

  static revokeLinkedDevice(deviceId: string): void {
    const linked = this.getLinkedDevices();
    const updated = linked.filter(d => d.id !== deviceId);
    this.saveLinkedDevices(updated);

    const currentPaired = this.getCurrentPairedDevice();
    if (currentPaired && currentPaired.id === deviceId) {
      this.setCurrentPairedDevice(null);
    }
  }

  static getCurrentPairedDevice(): DevicePairingRequest | null {
    if (!this.isBrowser()) return INITIAL_LINKED_DEVICES[0];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_PAIRED_DEVICE);
      return data ? JSON.parse(data) : INITIAL_LINKED_DEVICES[0];
    } catch {
      return INITIAL_LINKED_DEVICES[0];
    }
  }

  static setCurrentPairedDevice(device: DevicePairingRequest | null): void {
    if (!this.isBrowser()) return;
    if (device) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_PAIRED_DEVICE, JSON.stringify(device));
      if (device.patientId) {
        this.setActivePatientId(device.patientId);
      }
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_PAIRED_DEVICE);
    }
    window.dispatchEvent(new CustomEvent('mindora-device-paired', { detail: device }));
  }

  // Reset to default demo data
  static resetToDemo(): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.PATIENT, JSON.stringify(INITIAL_PATIENT));
    localStorage.setItem(STORAGE_KEYS.PATIENTS_LIST, JSON.stringify(MOCK_PATIENTS));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PATIENT_ID, INITIAL_PATIENT.id);
    localStorage.setItem(STORAGE_KEYS.CAREGIVER, JSON.stringify(INITIAL_CAREGIVER));
    localStorage.setItem(STORAGE_KEYS.DOCTOR, JSON.stringify(INITIAL_DOCTOR));
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_PLANS, JSON.stringify(INITIAL_ACTIVITY_PLANS));
    localStorage.setItem(STORAGE_KEYS.PAIRING_REQUESTS, JSON.stringify(INITIAL_PAIRING_REQUESTS));
    localStorage.setItem(STORAGE_KEYS.LINKED_DEVICES, JSON.stringify(INITIAL_LINKED_DEVICES));
    localStorage.setItem(STORAGE_KEYS.CURRENT_PAIRED_DEVICE, JSON.stringify(INITIAL_LINKED_DEVICES[0]));
    localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(INITIAL_REMINDERS));
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(INITIAL_SESSIONS));
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(INITIAL_ALERTS));
    localStorage.setItem(STORAGE_KEYS.ADAPTIVE, JSON.stringify(INITIAL_ADAPTIVE_STATES));
    localStorage.setItem(STORAGE_KEYS.OFFLINE_OVERRIDE, 'false');
    localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, '0');
    window.dispatchEvent(new Event('mindora-reset-demo'));
  }
}
