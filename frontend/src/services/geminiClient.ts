import { StorageService } from './storage';

export interface ActivityRecommendation {
  recommendedActivity: string;
  reasoning: string;
  encouragement: string;
  isAiGenerated: boolean;
}

export interface CaregiverAiSummary {
  summary: string;
  observationBulletPoints: string[];
  isAiGenerated: boolean;
}

export interface VoiceAssistantResponse {
  answer: string;
  isAiGenerated: boolean;
}

export class GeminiClientService {
  /**
   * Fetch personalized activity recommendation
   */
  static async getRecommendation(): Promise<ActivityRecommendation> {
    const isOffline = StorageService.isOffline();
    const patient = StorageService.getPatient();
    const sessions = StorageService.getSessions();
    const adaptive = StorageService.getAdaptiveStates();

    if (isOffline) {
      return {
        recommendedActivity: 'Memory Match',
        reasoning: `(Local Rule-Based) Recommended based on Anima's preference for ${patient.interests[0] || 'Gardening'} and steady morning focus.`,
        encouragement: `Good morning, ${patient.name}! You are doing wonderful today. Take your time and enjoy your activity.`,
        isAiGenerated: false
      };
    }

    try {
      const res = await fetch('/api/gemini/recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: patient.name,
          age: patient.age,
          language: patient.language,
          interests: patient.interests,
          recentPerformance: adaptive,
          completedToday: sessions.filter(s => s.dateFormatted === 'Today' || s.dateFormatted === '18 Sep').map(s => s.gameTitle)
        })
      });

      if (!res.ok) throw new Error('Network error');
      return await res.json();
    } catch {
      return {
        recommendedActivity: 'Memory Match',
        reasoning: `(Rule-Based Continuity) Recommended based on Anima's preference for ${patient.interests[0] || 'Gardening'} and steady morning focus.`,
        encouragement: `Good morning, ${patient.name}! You are doing wonderful today. Take your time and enjoy your activity.`,
        isAiGenerated: false
      };
    }
  }

  /**
   * Fetch natural language caregiver summary
   */
  static async getCaregiverSummary(): Promise<CaregiverAiSummary> {
    const isOffline = StorageService.isOffline();
    const patient = StorageService.getPatient();
    const sessions = StorageService.getSessions().slice(0, 7);
    const alerts = StorageService.getAlerts().slice(0, 4);

    if (isOffline) {
      return {
        summary: `(Offline Mode - Rule-Based) ${patient.name} completed her scheduled cognitive sessions this week. Memory and Pattern recognition engagement remained consistent, while routine recall showed steady morning completion.`,
        observationBulletPoints: [
          'Memory activity completion was regular across 5 sessions.',
          'Response times remained comfortable and unhurried (average ~4.3s).',
          'Routine recall demonstrated high familiarity with morning steps.'
        ],
        isAiGenerated: false
      };
    }

    try {
      const res = await fetch('/api/gemini/caregiver-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: patient.name,
          sessionData: sessions,
          adherenceRate: '85%',
          recentAlerts: alerts
        })
      });

      if (!res.ok) throw new Error('Network error');
      return await res.json();
    } catch {
      return {
        summary: `${patient.name} maintained active participation in scheduled cognitive activities this week with steady response patterns across familiar cultural memory items.`,
        observationBulletPoints: [
          'Memory match sessions showed high engagement with familiar garden objects.',
          'Morning medication and hydration reminders had 85% logged adherence.',
          'Adaptive difficulty maintained level 2-3 comfortably.'
        ],
        isAiGenerated: false
      };
    }
  }

  /**
   * Query voice assistant
   */
  static async askVoiceAssistant(query: string): Promise<VoiceAssistantResponse> {
    const isOffline = StorageService.isOffline();
    const patient = StorageService.getPatient();
    const reminders = StorageService.getReminders();

    if (isOffline) {
      const q = query.toLowerCase();
      let answer = `I am here with you, ${patient.name}.`;
      if (q.includes('medicine') || q.includes('pill') || q.includes('dawakhana') || q.includes('oukhod')) {
        answer = 'Your medicine reminder is scheduled for 9:00 AM. A glass of lukewarm water is kept ready.';
      } else if (q.includes('activity') || q.includes('next') || q.includes('game')) {
        answer = 'Your next activity is Memory Match with familiar flowers from your garden!';
      } else if (q.includes('water') || q.includes('drink') || q.includes('pani')) {
        answer = 'It is time for your morning hydration. Please take a few gentle sips of water.';
      } else if (q.includes('doctor') || q.includes('appointment')) {
        answer = "Doctor Baruah's routine wellness visit is scheduled for 4:30 PM with Meera.";
      } else if (q.includes('perform') || q.includes('score') || q.includes('today')) {
        answer = 'You completed your morning session with wonderful focus! 88% accuracy on memory activities.';
      } else {
        answer = 'You are doing very well today. All your daily reminders are safe and on schedule.';
      }
      return { answer, isAiGenerated: false };
    }

    try {
      const res = await fetch('/api/gemini/voice-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          patientName: patient.name,
          reminders,
          todayActivities: ['Memory Match (Completed)', 'Attention Challenge (Next)', 'Routine Recall']
        })
      });

      if (!res.ok) throw new Error('Network error');
      return await res.json();
    } catch {
      return {
        answer: 'Your next activity is ready whenever you feel comfortable. Would you like to start your memory game?',
        isAiGenerated: false
      };
    }
  }
}
