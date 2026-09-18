import { PatientProfile, CaregiverProfile, GameSession, Reminder, CaregiverAlert, CulturalMemoryItem, AdaptiveDifficultyState } from '../types';

export const INITIAL_PATIENT: PatientProfile = {
  id: 'patient-anima-01',
  name: 'Anima Devi',
  age: 72,
  gender: 'Female',
  location: 'Jorhat, Assam',
  language: 'as', // Default demo language is Assamese as specified
  interests: [
    'Traditional music',
    'Gardening',
    'Family',
    'Local festivals',
    'Assam tea culture',
    'Handloom & Weaving'
  ],
  avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  dailyRoutine: {
    morningWakeUp: '6:30 AM',
    morningHydration: '7:00 AM',
    morningMeds: '9:00 AM',
    breakfast: '9:30 AM',
    morningWalk: '11:00 AM',
    eveningTea: '4:00 PM',
    nightSleep: '9:30 PM'
  },
  caregiverId: 'caregiver-meera-01',
  culturalTheme: 'Assam Brahmaputra Valley'
};

export const INITIAL_CAREGIVER: CaregiverProfile = {
  id: 'caregiver-meera-01',
  name: 'Meera Devi',
  relation: 'Daughter & Primary Caregiver',
  phone: '+91 98640 12345',
  linkedPatientIds: ['patient-anima-01']
};

export const INITIAL_REMINDERS: Reminder[] = [
  {
    id: 'rem-1',
    patientId: 'patient-anima-01',
    type: 'medicine',
    title: 'Morning Medicine (Blood pressure & vitamins)',
    titleAssamese: 'পুৱাৰ ঔষধ (ৰক্তচাপ আৰু ভিটামিন)',
    titleHindi: 'सुबह की दवा (ब्लड प्रेशर व विटामिन)',
    time: '9:00 AM',
    status: 'completed',
    notes: 'Take with warm water after breakfast'
  },
  {
    id: 'rem-2',
    patientId: 'patient-anima-01',
    type: 'hydration',
    title: 'Drink Water (1 full glass)',
    titleAssamese: 'এক গিলাচ বিশুদ্ধ পানী খাবলৈ পাহৰিব নালাগে',
    titleHindi: 'एक गिलास ताजा पानी पिएं',
    time: '10:30 AM',
    status: 'pending',
    notes: 'Lukewarm water is prepared in copper jug'
  },
  {
    id: 'rem-3',
    patientId: 'patient-anima-01',
    type: 'activity',
    title: 'Morning Courtyard Walk',
    titleAssamese: 'চোতালত পাতলকৈ খোজ কঢ়া',
    titleHindi: 'आंगन में सुबह की टहल',
    time: '11:00 AM',
    status: 'pending',
    notes: 'Gentle walk around the flowering tulsi plant'
  },
  {
    id: 'rem-4',
    patientId: 'patient-anima-01',
    type: 'appointment',
    title: 'Doctor Appointment (Dr. Baruah - Routine Wellness)',
    titleAssamese: 'ডাঃ বৰুৱাৰ সৈতে নিয়মীয়া স্বাস্থ্য পৰীক্ষা',
    titleHindi: 'डॉ. बरुआ से नियमित स्वास्थ्य परामर्श',
    time: '4:30 PM',
    status: 'pending',
    notes: 'Civil Hospital OPD, accompanied by Meera'
  }
];

export const INITIAL_SESSIONS: GameSession[] = [
  {
    id: 'sess-07',
    patientId: 'patient-anima-01',
    gameType: 'memory',
    gameTitle: 'Memory Match (Garden Flowers)',
    score: 88,
    accuracy: 88,
    responseTime: 4.2,
    attempts: 1,
    difficulty: 3,
    timestamp: '2026-09-18T10:30:00Z',
    dateFormatted: '18 Sep',
    completed: true,
    synced: true,
    notes: 'Identified Kopou Phool and Tagar with ease.'
  },
  {
    id: 'sess-06',
    patientId: 'patient-anima-01',
    gameType: 'attention',
    gameTitle: 'Attention Challenge (Red Objects)',
    score: 74,
    accuracy: 74,
    responseTime: 5.1,
    attempts: 2,
    difficulty: 2,
    timestamp: '2026-09-17T11:15:00Z',
    dateFormatted: '17 Sep',
    completed: true,
    synced: true,
    notes: 'Slight hesitation distinguishing red pitha from orange bowl.'
  },
  {
    id: 'sess-05',
    patientId: 'patient-anima-01',
    gameType: 'pattern',
    gameTitle: 'Pattern Recognition (Gamosa Weave)',
    score: 91,
    accuracy: 91,
    responseTime: 3.9,
    attempts: 1,
    difficulty: 3,
    timestamp: '2026-09-16T10:05:00Z',
    dateFormatted: '16 Sep',
    completed: true,
    synced: true,
    notes: 'Recognized floral border sequence immediately.'
  },
  {
    id: 'sess-04',
    patientId: 'patient-anima-01',
    gameType: 'routine',
    gameTitle: 'Daily Routine Recall (Morning Steps)',
    score: 82,
    accuracy: 82,
    responseTime: 4.8,
    attempts: 1,
    difficulty: 2,
    timestamp: '2026-09-15T09:45:00Z',
    dateFormatted: '15 Sep',
    completed: true,
    synced: true,
    notes: 'Reconstructed Wakeup -> Water -> Medicine order correctly.'
  },
  {
    id: 'sess-03',
    patientId: 'patient-anima-01',
    gameType: 'memory',
    gameTitle: 'Memory Match (Festival Instruments)',
    score: 80,
    accuracy: 80,
    responseTime: 4.5,
    attempts: 2,
    difficulty: 2,
    timestamp: '2026-09-14T10:20:00Z',
    dateFormatted: '14 Sep',
    completed: true,
    synced: true,
    notes: 'Smiled when seeing Bihu Dhol card.'
  },
  {
    id: 'sess-02',
    patientId: 'patient-anima-01',
    gameType: 'attention',
    gameTitle: 'Attention Challenge (Tea Leaves)',
    score: 75,
    accuracy: 75,
    responseTime: 5.3,
    attempts: 2,
    difficulty: 2,
    timestamp: '2026-09-13T11:00:00Z',
    dateFormatted: '13 Sep',
    completed: true,
    synced: true,
    notes: 'Good focus under gentle audio prompt.'
  },
  {
    id: 'sess-01',
    patientId: 'patient-anima-01',
    gameType: 'pattern',
    gameTitle: 'Pattern Recognition (Traditional Beads)',
    score: 89,
    accuracy: 89,
    responseTime: 4.1,
    attempts: 1,
    difficulty: 2,
    timestamp: '2026-09-12T10:40:00Z',
    dateFormatted: '12 Sep',
    completed: true,
    synced: true,
    notes: 'Completed without reminders.'
  }
];

export const INITIAL_ADAPTIVE_STATES: Record<string, AdaptiveDifficultyState> = {
  memory: {
    gameType: 'memory',
    currentDifficulty: 3,
    recentAccuracyAverage: 84,
    historyExplanation: [
      'Difficulty set to Level 2 based on initial baseline.',
      'Increased to Level 3 after 88% accuracy on 18 Sep.'
    ],
    lastAdjustedDate: '18 Sep'
  },
  attention: {
    gameType: 'attention',
    currentDifficulty: 2,
    recentAccuracyAverage: 74,
    historyExplanation: [
      'Maintained at Level 2 (accuracy 74% within comfortable 60-84% range).'
    ],
    lastAdjustedDate: '17 Sep'
  },
  pattern: {
    gameType: 'pattern',
    currentDifficulty: 3,
    recentAccuracyAverage: 90,
    historyExplanation: [
      'Increased to Level 3 after 91% accuracy on Gamosa weave patterns.'
    ],
    lastAdjustedDate: '16 Sep'
  },
  routine: {
    gameType: 'routine',
    currentDifficulty: 2,
    recentAccuracyAverage: 82,
    historyExplanation: [
      'Maintained at Level 2 for calm, unhurried daily reinforcement.'
    ],
    lastAdjustedDate: '15 Sep'
  }
};

export const INITIAL_ALERTS: CaregiverAlert[] = [
  {
    id: 'alt-1',
    type: 'success',
    title: 'Daily Cognitive Session Completed',
    message: 'Anima completed her Morning Memory activity with 88% accuracy.',
    timestamp: 'Today, 10:42 AM',
    read: false,
    actionLabel: 'View Session'
  },
  {
    id: 'alt-2',
    type: 'warning',
    title: 'Hydration Reminder Missed',
    message: 'The 10:30 AM water reminder was not marked completed within 45 minutes.',
    timestamp: 'Today, 11:15 AM',
    read: false,
    actionLabel: 'Call Patient'
  },
  {
    id: 'alt-3',
    type: 'info',
    title: 'Difficulty Adjusted after Recent Performance',
    message: 'Adaptive engine promoted Memory Match to Level 3 because recent accuracy reached 88%.',
    timestamp: 'Yesterday, 10:32 AM',
    read: true,
    actionLabel: 'Review Engine Logic'
  },
  {
    id: 'alt-4',
    type: 'notice',
    title: 'Performance Pattern Noticed',
    message: 'Memory activity performance has varied across the last 5 sessions (75% - 91%). Recommended keeping sessions in morning hours.',
    timestamp: '16 Sep, 5:00 PM',
    read: true,
    actionLabel: 'Review Activity History'
  }
];

export const CULTURAL_MEMORIES: CulturalMemoryItem[] = [
  {
    id: 'mem-1',
    title: 'Assamese Gamosa (ফুলাম গামোচা)',
    titleAssamese: 'ফুলাম গামোচা',
    category: 'Handloom & Weaving',
    description: 'The white cotton towel with intricate red woven flowers, symbol of respect given to elders and guests.',
    emoji: '🧣',
    theme: 'Traditional Textiles'
  },
  {
    id: 'mem-2',
    title: 'Majuli Clay & Bamboo Mask',
    titleAssamese: 'মাজুলীৰ মুখা শিল্প',
    category: 'Traditional Crafts',
    description: 'Handcrafted mask from the river island of Majuli, used in traditional Bhaona dance drama.',
    emoji: '🎭',
    theme: 'Folk Heritage'
  },
  {
    id: 'mem-3',
    title: 'Assam Tea Garden (চাহ বাগিচা)',
    titleAssamese: 'সেউজীয়া চাহ বাগিচা',
    category: 'Nature & Landscape',
    description: 'Lush green tea bushes of Jorhat, with morning dew and women singing while plucking fresh buds.',
    emoji: '🍃',
    theme: 'Landmarks'
  },
  {
    id: 'mem-4',
    title: 'Kopou Phool (Foxtail Orchid)',
    titleAssamese: 'কপৌ ফুল',
    category: 'Gardening & Nature',
    description: 'Pink foxtail orchid blooming in Rongali Bihu season, lovingly hung in courtyard trees.',
    emoji: '🌸',
    theme: 'Flowers'
  },
  {
    id: 'mem-5',
    title: 'Bihu Dhol & Mohor Pepa',
    titleAssamese: 'বিহু ঢোল আৰু ম’হৰ শিঙৰ পেঁপা',
    category: 'Traditional Music',
    description: 'Festive wooden drum and buffalo-horn flute that fill the springtime Brahmaputra breeze with joy.',
    emoji: '🥁',
    theme: 'Music'
  },
  {
    id: 'mem-6',
    title: 'Kahi-Bati Bell Metal Ware',
    titleAssamese: 'সৰ্থেবাৰীৰ কাঁহ-পিতলৰ বাচন',
    category: 'Family & Home',
    description: 'Gleaming golden bell-metal plates from Sarthebari used for serving traditional rice and pitha.',
    emoji: '🍲',
    theme: 'Household'
  }
];

export const MOCK_PERFORMANCE_TRENDS = [
  { day: '12 Sep', accuracy: 78, responseTime: 5.1, score: 75 },
  { day: '13 Sep', accuracy: 82, responseTime: 4.8, score: 80 },
  { day: '14 Sep', accuracy: 75, responseTime: 5.4, score: 72 },
  { day: '15 Sep', accuracy: 84, responseTime: 4.5, score: 82 },
  { day: '16 Sep', accuracy: 89, responseTime: 4.0, score: 88 },
  { day: '17 Sep', accuracy: 82, responseTime: 4.3, score: 81 },
  { day: 'Today', accuracy: 88, responseTime: 3.9, score: 89 }
];

