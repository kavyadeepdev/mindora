import { 
  PatientProfile, 
  CaregiverProfile, 
  DoctorProfile, 
  GameSession, 
  Reminder, 
  CaregiverAlert, 
  CulturalMemoryItem, 
  AdaptiveDifficultyState, 
  PatientActivityPlan, 
  DevicePairingRequest 
} from '../types';

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
    'Tea & Gardening',
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
  culturalTheme: 'Everyday Life & Nature',
  diagnosis: "Early-stage Alzheimer's Disease",
  stage: 'Mild Cognitive Impairment (MCI)',
  accessibility: {
    largeText: true,
    highContrast: false,
    reduceMotion: true,
    audioFeedback: true
  }
};

export const MOCK_PATIENTS: PatientProfile[] = [
  INITIAL_PATIENT,
  {
    id: 'patient-bhaben-02',
    name: 'Bhaben Baruah',
    age: 78,
    gender: 'Male',
    location: 'Guwahati, Assam',
    language: 'bn',
    interests: ['Folk storytelling', 'Newspaper reading', 'Courtyard gardening', 'Radio broadcasts'],
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    dailyRoutine: {
      morningWakeUp: '6:00 AM',
      morningHydration: '6:45 AM',
      morningMeds: '8:30 AM',
      breakfast: '9:00 AM',
      morningWalk: '10:30 AM',
      eveningTea: '4:30 PM',
      nightSleep: '9:00 PM'
    },
    caregiverId: 'caregiver-meera-01',
    culturalTheme: 'Heritage & Quiet Outdoors',
    diagnosis: 'Vascular Cognitive Impairment',
    stage: 'Moderate (Stage 4)',
    accessibility: {
      largeText: true,
      highContrast: true,
      reduceMotion: true,
      audioFeedback: true
    }
  },
  {
    id: 'patient-pratima-03',
    name: 'Pratima Sharma',
    age: 69,
    gender: 'Female',
    location: 'Dibrugarh, Assam',
    language: 'hi',
    interests: ['Devotional hymns', 'Flower arranging', 'Knitting', 'Old songs'],
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    dailyRoutine: {
      morningWakeUp: '7:00 AM',
      morningHydration: '7:30 AM',
      morningMeds: '9:15 AM',
      breakfast: '9:45 AM',
      morningWalk: '11:15 AM',
      eveningTea: '4:15 PM',
      nightSleep: '9:45 PM'
    },
    caregiverId: 'caregiver-meera-01',
    culturalTheme: 'Music & Calm Courtyard',
    diagnosis: 'Mild Amnestic Cognitive Decline',
    stage: 'Mild (Stage 3)',
    accessibility: {
      largeText: false,
      highContrast: false,
      reduceMotion: false,
      audioFeedback: true
    }
  }
];

export const INITIAL_CAREGIVER: CaregiverProfile = {
  id: 'caregiver-meera-01',
  name: 'Meera Devi',
  relation: 'Daughter & Primary Caregiver',
  phone: '+91 98640 12345',
  linkedPatientIds: ['patient-anima-01', 'patient-bhaben-02', 'patient-pratima-03']
};

export const INITIAL_DOCTOR: DoctorProfile = {
  id: 'doctor-debojit-01',
  name: 'Dr. Debojit Sarma',
  specialty: 'Cognitive Neurology & Dementia Care',
  hospital: 'Guwahati Neurological Care & AIIMS Clinical Affiliate',
  phone: '+91 94350 78901',
  email: 'dr.sarma@neurocare-assam.org',
  linkedPatientIds: ['patient-anima-01', 'patient-bhaben-02', 'patient-pratima-03']
};

export const INITIAL_ACTIVITY_PLANS: Record<string, PatientActivityPlan> = {
  'patient-anima-01': {
    patientId: 'patient-anima-01',
    prescribedByDoctorId: 'doctor-debojit-01',
    doctorName: 'Dr. Debojit Sarma',
    lastUpdated: '18 Sep 2026',
    clinicalGoal: 'Stabilize visual recall and step sequencing through familiar daily stimuli.',
    activities: [
      {
        gameType: 'memory',
        title: 'Memory Match',
        enabled: true,
        order: 1,
        rounds: 5,
        targetFocus: 'Visual Association & Object Recall',
        doctorNotes: 'Maintain gentle 5-second study window. Familiar flowers and utensils.'
      },
      {
        gameType: 'attention',
        title: 'Attention Challenge',
        enabled: true,
        order: 2,
        rounds: 5,
        targetFocus: 'Selective Focus & Visual Filtering',
        doctorNotes: 'Keep contrast high; allow unhurried response time.'
      },
      {
        gameType: 'pattern',
        title: 'Pattern Recognition',
        enabled: true,
        order: 3,
        rounds: 5,
        targetFocus: 'Working Memory & Sequence Prediction',
        doctorNotes: 'Support cognitive rhythm recognition.'
      },
      {
        gameType: 'routine',
        title: 'Daily Routine Recall',
        enabled: true,
        order: 4,
        rounds: 5,
        targetFocus: 'Executive Function & Chronological Ordering',
        doctorNotes: 'Strengthen morning and hydration recall.'
      }
    ]
  },
  'patient-bhaben-02': {
    patientId: 'patient-bhaben-02',
    prescribedByDoctorId: 'doctor-debojit-01',
    doctorName: 'Dr. Debojit Sarma',
    lastUpdated: '17 Sep 2026',
    clinicalGoal: 'Shorter low-fatigue sessions focusing on familiar memories and daily routine.',
    activities: [
      {
        gameType: 'memory',
        title: 'Memory Match',
        enabled: true,
        order: 1,
        rounds: 3,
        targetFocus: 'Visual Recall',
        doctorNotes: '3 rounds maximum to prevent afternoon cognitive fatigue.'
      },
      {
        gameType: 'routine',
        title: 'Daily Routine Recall',
        enabled: true,
        order: 2,
        rounds: 3,
        targetFocus: 'Executive Function',
        doctorNotes: 'Morning walk and newspaper routine recall.'
      },
      {
        gameType: 'attention',
        title: 'Attention Challenge',
        enabled: false,
        order: 3,
        rounds: 3,
        targetFocus: 'Selective Focus',
        doctorNotes: 'Temporarily disabled due to visual strain; re-evaluate next clinic visit.'
      },
      {
        gameType: 'pattern',
        title: 'Pattern Recognition',
        enabled: true,
        order: 4,
        rounds: 3,
        targetFocus: 'Working Memory',
        doctorNotes: 'Simple 2-item alternation sequences.'
      }
    ]
  },
  'patient-pratima-03': {
    patientId: 'patient-pratima-03',
    prescribedByDoctorId: 'doctor-debojit-01',
    doctorName: 'Dr. Debojit Sarma',
    lastUpdated: '16 Sep 2026',
    clinicalGoal: 'Early MCI intervention: active pattern and selective attention reinforcement.',
    activities: [
      {
        gameType: 'attention',
        title: 'Attention Challenge',
        enabled: true,
        order: 1,
        rounds: 5,
        targetFocus: 'Selective Focus & Agility',
        doctorNotes: 'High engagement in morning sessions.'
      },
      {
        gameType: 'memory',
        title: 'Memory Match',
        enabled: true,
        order: 2,
        rounds: 5,
        targetFocus: 'Visual Association',
        doctorNotes: 'Good recall with household items.'
      },
      {
        gameType: 'pattern',
        title: 'Pattern Recognition',
        enabled: true,
        order: 3,
        rounds: 5,
        targetFocus: 'Sequence Prediction',
        doctorNotes: 'Encourage gentle self-paced attempts.'
      },
      {
        gameType: 'routine',
        title: 'Daily Routine Recall',
        enabled: true,
        order: 4,
        rounds: 5,
        targetFocus: 'Daily Task Sequencing',
        doctorNotes: 'Reinforce afternoon tea & meditation steps.'
      }
    ]
  }
};

export const INITIAL_PAIRING_REQUESTS: DevicePairingRequest[] = [
  {
    id: 'pair-req-101',
    pairCode: 'MND-842',
    deviceName: 'Living Room Tablet (Apple iPadOS 18)',
    browserInfo: 'Mobile Safari 18.2',
    ipAddress: '103.28.246.12 (Jorhat, Assam)',
    status: 'pending',
    patientId: 'patient-anima-01',
    patientName: 'Anima Devi',
    requestedAt: 'Just now (Awaiting Doctor or Caretaker Approval)'
  }
];

export const INITIAL_LINKED_DEVICES: DevicePairingRequest[] = [
  {
    id: 'pair-req-100',
    pairCode: 'MND-194',
    deviceName: 'Bedroom Samsung Tab S9 Ultra',
    browserInfo: 'Chrome 128 (Android 14)',
    ipAddress: '103.28.246.12 (Jorhat, Assam)',
    status: 'approved',
    patientId: 'patient-anima-01',
    patientName: 'Anima Devi',
    approvedBy: 'Dr. Debojit Sarma',
    requestedAt: '18 Sep 2026, 09:15 AM',
    approvedAt: '18 Sep 2026, 09:16 AM',
    token: 'tok_paired_anima_dev_tab_194'
  }
];

export const INITIAL_REMINDERS: Reminder[] = [
  {
    id: 'rem-1',
    patientId: 'patient-anima-01',
    type: 'medicine',
    title: 'Morning Medicine',
    titleAssamese: 'পুৱাৰ ঔষধ',
    titleHindi: 'सुबह की दवा',
    titleBengali: 'সকালের ওষুধ',
    titleKannada: 'ಮುಂಜಾನೆಯ ಔಷಧಿ',
    time: '9:00 AM',
    status: 'completed',
    notes: 'Take with warm water after breakfast',
    notesAssamese: 'পুৱাৰ জলপান খোৱাৰ পিছত কুহুমীয়া পানীৰে খাব',
    notesHindi: 'नाश्ते के बाद गुनगुने पानी के साथ लें',
    notesBengali: 'প্রাতরাশের পর হালকা গরম জল দিয়ে খান',
    notesKannada: 'ಉಪಹಾರದ ನಂತರ ಬೆಚ್ಚಗಿನ ನೀರಿನೊಂದಿಗೆ ತೆಗೆದುಕೊಳ್ಳಿ'
  },
  {
    id: 'rem-2',
    patientId: 'patient-anima-01',
    type: 'hydration',
    title: 'Drink Fresh Water',
    titleAssamese: 'এক গিলাচ বিশুদ্ধ পানী',
    titleHindi: 'एक गिलास ताजा पानी',
    titleBengali: 'এক গ্লাস বিশুদ্ধ জল',
    titleKannada: 'ಒಂದು ಲೋಟ ತಾಜಾ ನೀರು',
    time: '10:30 AM',
    status: 'pending',
    notes: 'Lukewarm water is prepared in copper jug',
    notesAssamese: 'তামাৰ জগৰ পৰা এক গিলাচ বিশুদ্ধ পানী খাব',
    notesHindi: 'तांबे के जग में ताजा पानी रखा गया है',
    notesBengali: 'তামার পাত্রে রাখা তাজা জল পান করুন',
    notesKannada: 'ತಾಮ್ರದ ಜಗ್‌ನಲ್ಲಿ ತಾಜಾ ನೀರನ್ನು ಸಿದ್ಧಪಡಿಸಲಾಗಿದೆ'
  },
  {
    id: 'rem-3',
    patientId: 'patient-anima-01',
    type: 'activity',
    title: 'Courtyard Walk',
    titleAssamese: 'চোতালত পাতল খোজ কঢ়া',
    titleHindi: 'आंगन में सुबह की टहल',
    titleBengali: 'উঠোনে সকালের হাঁটা',
    titleKannada: 'ಅಂಗಳದಲ್ಲಿ ಮುಂಜಾನೆ ನಡಿಗೆ',
    time: '11:00 AM',
    status: 'pending',
    notes: 'Gentle walk around the garden',
    notesAssamese: 'চোতাল আৰু বাগানৰ চাৰিওফালে পাতল খোজ কঢ়া',
    notesHindi: 'आंगन और बगीचे में धीमी गति से टहलना',
    notesBengali: 'উঠোন এবং বাগানের চারপাশে ধীরেসুস্থে হাঁটা',
    notesKannada: 'ಅಂಗಳ ಮತ್ತು ತೋಟದ ಸುತ್ತಲೂ ನಿಧಾನವಾಗಿ ನಡಿಗೆ'
  },
  {
    id: 'rem-4',
    patientId: 'patient-anima-01',
    type: 'appointment',
    title: 'Routine Wellness Checkup',
    titleAssamese: 'নিয়মীয়া স্বাস্থ্য পৰীক্ষা',
    titleHindi: 'नियमित स्वास्थ्य परामर्श',
    titleBengali: 'নিয়মিত স্বাস্থ্য পরীক্ষা',
    titleKannada: 'ನಿಯಮಿತ ಆರೋಗ್ಯ ತಪಾಸಣೆ',
    time: '4:30 PM',
    status: 'pending',
    notes: 'Routine wellness consultation with caregiver',
    notesAssamese: 'যত্নলোৱা ব্যক্তিৰ সৈতে নিয়মীয়া স্বাস্থ্য পৰামৰ্শ',
    notesHindi: 'देखभालकर्ता के साथ नियमित स्वास्थ्य परामर्श',
    notesBengali: 'তত্ত্বাবধায়কের সাথে নিয়মিত স্বাস্থ্য পরীক্ষা',
    notesKannada: 'ಆರೈಕೆದಾರರೊಂದಿಗೆ ನಿಯಮಿತ ಆರೋಗ್ಯ ಸಮಾಲೋಚನೆ'
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
    title: 'Handwoven Scarf',
    titleAssamese: 'ফুলাম গামোচা',
    titleHindi: 'पारंपरिक दुपट्टा',
    titleBengali: 'হাতে বোনা উত্তরীয়',
    titleKannada: 'ಕೈಮಗ್ಗದ ಶಾಲು',
    category: 'Handloom & Weaving',
    description: 'The white cotton towel with intricate red woven flowers, symbol of respect given to elders and guests.',
    emoji: '🧣',
    theme: 'Traditional Textiles'
  },
  {
    id: 'mem-2',
    title: 'Clay & Bamboo Mask',
    titleAssamese: 'মুখা শিল্প',
    titleHindi: 'मिट्टी और बांस का मुखौटा',
    titleBengali: 'মাটি ও বাঁশের মুখোশ',
    titleKannada: 'ಮಣ್ಣು ಮತ್ತು ಬಿದಿರಿನ ಮುಖವಾಡ',
    category: 'Traditional Crafts',
    description: 'Handcrafted mask from the river island of Majuli, used in traditional Bhaona dance drama.',
    emoji: '🎭',
    theme: 'Folk Heritage'
  },
  {
    id: 'mem-3',
    title: 'Misty Tea Garden',
    titleAssamese: 'সেউজীয়া চাহ বাগিচা',
    titleHindi: 'चाय का हरा बागान',
    titleBengali: 'সবুজ চা বাগান',
    titleKannada: 'ಹಚ್ಚ ಹಸಿರಿನ ಚಹಾ ತೋಟ',
    category: 'Nature & Landscape',
    description: 'Lush green tea bushes of Jorhat, with morning dew and women singing while plucking fresh buds.',
    emoji: '🍃',
    theme: 'Landmarks'
  },
  {
    id: 'mem-4',
    title: 'Foxtail Orchid Blossoms',
    titleAssamese: 'কপৌ ফুল',
    titleHindi: 'ऑर्किड का फूल',
    titleBengali: 'অর্কিড ফুল',
    titleKannada: 'ಆರ್ಕಿಡ್ ಹೂವುಗಳು',
    category: 'Gardening & Nature',
    description: 'Pink foxtail orchid blooming in spring season, lovingly hung in courtyard trees.',
    emoji: '🌸',
    theme: 'Flowers'
  },
  {
    id: 'mem-5',
    title: 'Traditional Drums & Flutes',
    titleAssamese: 'বিহু ঢোল আৰু পেঁপা',
    titleHindi: 'पारंपरिक ढोल और बांसुरी',
    titleBengali: 'ঐতিহ্যবাহী ঢোল ও বাঁশি',
    titleKannada: 'ಪಾರಂಪರಿಕ ಡ್ರಮ್ ಮತ್ತು ಕೊಳಲು',
    category: 'Traditional Music',
    description: 'Festive wooden drum and buffalo-horn flute that fill the springtime breeze with joy.',
    emoji: '🥁',
    theme: 'Music'
  },
  {
    id: 'mem-6',
    title: 'Bell Metal Ware',
    titleAssamese: 'কাঁহ-পিতলৰ বাচন',
    titleHindi: 'पीतल के पारंपरिक बर्तन',
    titleBengali: 'কাঁসার ঐতিহ্যবাহী পাত্র',
    titleKannada: 'ಹಿತ್ತಾಳೆಯ ಪಾತ್ರೆಗಳು',
    category: 'Family & Home',
    description: 'Gleaming golden bell-metal plates used for serving traditional meals and festive sweets.',
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

