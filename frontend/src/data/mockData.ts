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

export const MOCK_DOCTORS: DoctorProfile[] = [
  {
    id: 'doc-ananya-mukherjee',
    name: 'Dr. Ananya Mukherjee',
    specialty: 'Neuro-Geriatrics & Cognitive Rehabilitation',
    hospital: 'Apollo Multispeciality Hospitals, Kolkata',
    phone: '+91 98301 24890',
    email: 'dr.ananya@mindora.health',
    medicalRegistrationNumber: 'WBMC-68492',
    medicalCouncil: 'West Bengal Medical Council / NMC',
    registrationYear: 2011,
    qualification: 'MBBS, MD (Geriatric Medicine, AIIMS), Fellowship in Neuro-Cognitive Disorders',
    verificationStatus: 'approved',
    approvedAt: '2026-01-15T10:00:00Z',
    approvedBy: 'admin@mindora.health',
    linkedPatientIds: ['p-subir-banerjee', 'p-bhaben-hazarika']
  },
  {
    id: 'doc-raghavendra-rao',
    name: 'Dr. Raghavendra Rao',
    specialty: 'Geriatric Psychiatry & Memory Disorders',
    hospital: 'NIMHANS & Manipal Hospital, Bengaluru',
    phone: '+91 94480 37192',
    email: 'dr.raghavendra@mindora.health',
    medicalRegistrationNumber: 'KMC-42918',
    medicalCouncil: 'Karnataka Medical Council / NMC',
    registrationYear: 2007,
    qualification: 'MBBS, MD (Psychiatry - NIMHANS), DNB',
    verificationStatus: 'approved',
    approvedAt: '2026-01-10T09:30:00Z',
    approvedBy: 'admin@mindora.health',
    linkedPatientIds: ['p-venkata-gowda', 'p-ramesh-verma', 'p-pratima-sharma']
  },
  {
    id: 'doc-arvind-swamy',
    name: 'Dr. Arvind Swamy',
    specialty: 'Behavioral Neurology',
    hospital: 'Fortis Healthcare, Chennai',
    phone: '+91 98401 55912',
    email: 'dr.arvind@mindora.health',
    medicalRegistrationNumber: 'TNMC-77401',
    medicalCouncil: 'Tamil Nadu Medical Council / NMC',
    registrationYear: 2016,
    qualification: 'MBBS, DM (Neurology)',
    verificationStatus: 'pending_approval',
    rejectionReason: undefined,
    linkedPatientIds: []
  }
];

export const INITIAL_DOCTOR: DoctorProfile = MOCK_DOCTORS[0];

export const MOCK_CAREGIVERS: CaregiverProfile[] = [
  {
    id: 'cg-debojit-banerjee',
    name: 'Debojit Banerjee',
    relation: 'Son & Primary Family Caregiver',
    phone: '+91 98311 55210',
    email: 'debojit.care@mindora.health',
    status: 'active',
    linkedPatientIds: ['p-subir-banerjee'] // Takes care of 1 patient
  },
  {
    id: 'cg-minoti-hazarika',
    name: 'Minoti Hazarika',
    relation: 'Daughter & Home Companion',
    phone: '+91 94350 88219',
    email: 'minoti.care@mindora.health',
    status: 'active',
    linkedPatientIds: ['p-bhaben-hazarika'] // Takes care of 1 patient
  },
  {
    id: 'cg-suresh-kumar',
    name: 'Suresh Kumar',
    relation: 'Senior Geriatric Care Specialist',
    phone: '+91 98801 44320',
    email: 'suresh.care@mindora.health',
    status: 'active',
    linkedPatientIds: ['p-venkata-gowda', 'p-ramesh-verma', 'p-pratima-sharma'] // Takes care of 3 patients
  }
];

export const INITIAL_CAREGIVER: CaregiverProfile = MOCK_CAREGIVERS[0];

export const MOCK_PATIENTS: PatientProfile[] = [
  {
    id: 'p-subir-banerjee',
    doctorId: 'doc-ananya-mukherjee',
    doctorName: 'Dr. Ananya Mukherjee',
    caregiverId: 'cg-debojit-banerjee',
    caregiverName: 'Debojit Banerjee',
    name: 'Subir Banerjee',
    age: 72,
    gender: 'Male',
    location: 'Salt Lake, Kolkata, West Bengal',
    language: 'bn', // Bengali
    culturalTheme: 'bengali-heritage',
    diagnosis: 'Mild Cognitive Impairment (MCI)',
    stage: 'Early Stage',
    accessStatus: 'active',
    interests: ['Rabindra Sangeet', 'Kolkata Tramways', 'Durga Puja Dhak', 'Darjeeling First Flush Tea', 'Victoria Memorial'],
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    dailyRoutine: {
      morningWakeUp: '06:00 AM',
      morningHydration: '06:30 AM',
      morningMeds: '08:00 AM',
      breakfast: '08:30 AM',
      morningWalk: '09:30 AM',
      eveningTea: '04:30 PM',
      nightSleep: '09:30 PM'
    },
    accessibility: {
      largeText: true,
      highContrast: false,
      reduceMotion: false,
      audioFeedback: true
    }
  },
  {
    id: 'p-bhaben-hazarika',
    doctorId: 'doc-ananya-mukherjee',
    doctorName: 'Dr. Ananya Mukherjee',
    caregiverId: 'cg-minoti-hazarika',
    caregiverName: 'Minoti Hazarika',
    name: 'Bhaben Hazarika',
    age: 74,
    gender: 'Male',
    location: 'Guwahati, Assam',
    language: 'as', // Assamese
    culturalTheme: 'assam-brahmaputra',
    diagnosis: 'Mild Cognitive Impairment (MCI)',
    stage: 'Early Stage',
    accessStatus: 'active',
    interests: ['Bihu Folk Songs', 'Kaziranga Forest Walk', 'Muga Silk Weaving', 'Brahmaputra Ferry', 'Assam Orthodox Tea'],
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    dailyRoutine: {
      morningWakeUp: '05:45 AM',
      morningHydration: '06:15 AM',
      morningMeds: '07:30 AM',
      breakfast: '08:00 AM',
      morningWalk: '09:00 AM',
      eveningTea: '04:00 PM',
      nightSleep: '09:00 PM'
    },
    accessibility: {
      largeText: true,
      highContrast: false,
      reduceMotion: false,
      audioFeedback: true
    }
  },
  {
    id: 'p-venkata-gowda',
    doctorId: 'doc-raghavendra-rao',
    doctorName: 'Dr. Raghavendra Rao',
    caregiverId: 'cg-suresh-kumar',
    caregiverName: 'Suresh Kumar',
    name: 'Venkatasubbaiah Gowda',
    age: 78,
    gender: 'Male',
    location: 'Malleshwaram, Bengaluru, Karnataka',
    language: 'kn', // Kannada
    culturalTheme: 'kannada-heritage',
    diagnosis: "Mild Alzheimer's Disease",
    stage: 'Mild Stage',
    accessStatus: 'active',
    interests: ['Mysore Dasara Elephant Procession', 'Carnatic Veena Melodies', 'Hampi Stone Chariot', 'Filter Coffee & Idli', 'Lalbagh Flower Show'],
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    dailyRoutine: {
      morningWakeUp: '06:00 AM',
      morningHydration: '06:30 AM',
      morningMeds: '08:00 AM',
      breakfast: '08:45 AM',
      morningWalk: '09:30 AM',
      eveningTea: '04:30 PM',
      nightSleep: '09:30 PM'
    },
    accessibility: {
      largeText: true,
      highContrast: true,
      reduceMotion: false,
      audioFeedback: true
    }
  },
  {
    id: 'p-ramesh-verma',
    doctorId: 'doc-raghavendra-rao',
    doctorName: 'Dr. Raghavendra Rao',
    caregiverId: 'cg-suresh-kumar',
    caregiverName: 'Suresh Kumar',
    name: 'Ramesh Chandra Verma',
    age: 76,
    gender: 'Male',
    location: 'Varanasi, Uttar Pradesh',
    language: 'hi', // Hindi
    culturalTheme: 'hindi-gangetic',
    diagnosis: 'Early-Stage Vascular Dementia',
    stage: 'Early Stage',
    accessStatus: 'active',
    interests: ['Ganga Aarti at Dashashwamedh Ghat', 'Bismillah Khan Shehnai', 'Banarasi Paan & Chai', 'Morning Bhajan', 'Sarnath Stupa'],
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    dailyRoutine: {
      morningWakeUp: '05:30 AM',
      morningHydration: '06:00 AM',
      morningMeds: '07:30 AM',
      breakfast: '08:30 AM',
      morningWalk: '09:00 AM',
      eveningTea: '04:30 PM',
      nightSleep: '09:30 PM'
    },
    accessibility: {
      largeText: false,
      highContrast: false,
      reduceMotion: false,
      audioFeedback: true
    }
  },
  {
    id: 'p-pratima-sharma',
    doctorId: 'doc-raghavendra-rao',
    doctorName: 'Dr. Raghavendra Rao',
    caregiverId: 'cg-suresh-kumar',
    caregiverName: 'Suresh Kumar',
    name: 'Pratima Devi Sharma',
    age: 71,
    gender: 'Female',
    location: 'Chittaranjan Park, New Delhi',
    language: 'hi', // Hindi
    culturalTheme: 'hindi-gangetic',
    diagnosis: 'Mild Cognitive Impairment (Amnestic)',
    stage: 'Mild Stage',
    accessStatus: 'active',
    interests: ['Classical Sitar', 'Tulsi Ramayana Verses', 'Morning Garden Walk', 'Folk Geets', 'Heritage Sweets'],
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    dailyRoutine: {
      morningWakeUp: '06:15 AM',
      morningHydration: '06:45 AM',
      morningMeds: '08:15 AM',
      breakfast: '09:00 AM',
      morningWalk: '09:45 AM',
      eveningTea: '05:00 PM',
      nightSleep: '10:00 PM'
    },
    accessibility: {
      largeText: true,
      highContrast: false,
      reduceMotion: true,
      audioFeedback: true
    }
  }
];

export const INITIAL_PATIENT: PatientProfile = MOCK_PATIENTS[0];

export const INITIAL_ACTIVITY_PLANS: Record<string, PatientActivityPlan> = {
  'p-subir-banerjee': {
    patientId: 'p-subir-banerjee',
    prescribedByDoctorId: 'doc-ananya-mukherjee',
    doctorName: 'Dr. Ananya Mukherjee',
    lastUpdated: '20 Jan 2026',
    clinicalGoal: 'Strengthen working memory and visual recall through culturally familiar Kolkata anchors.',
    activities: [
      { gameType: 'memory', title: 'Bengali Heritage Memory Match', enabled: true, order: 1, rounds: 4, targetFocus: 'Visual Recall', doctorNotes: 'Use familiar cultural cards.' },
      { gameType: 'attention', title: 'Selective Attention Focus', enabled: true, order: 2, rounds: 3, targetFocus: 'Selective Attention' },
      { gameType: 'pattern', title: 'Sequential Association', enabled: true, order: 3, rounds: 3, targetFocus: 'Sequencing' },
      { gameType: 'routine', title: 'Daily Morning Routine Recall', enabled: true, order: 4, rounds: 2, targetFocus: 'Procedural Memory' }
    ]
  },
  'p-venkata-gowda': {
    patientId: 'p-venkata-gowda',
    prescribedByDoctorId: 'doc-raghavendra-rao',
    doctorName: 'Dr. Raghavendra Rao',
    lastUpdated: '22 Jan 2026',
    clinicalGoal: 'Preserve cognitive orientation and calm via Carnatic musical structures.',
    activities: [
      { gameType: 'memory', title: 'Mysore Heritage Memory Cards', enabled: true, order: 1, rounds: 3, targetFocus: 'Episodic Memory', doctorNotes: 'Short unhurried sessions.' },
      { gameType: 'pattern', title: 'Classical Music Sequences', enabled: true, order: 2, rounds: 3, targetFocus: 'Working Memory' },
      { gameType: 'routine', title: 'Daily Pacing Routine', enabled: true, order: 3, rounds: 2, targetFocus: 'Temporal Orientation' }
    ]
  }
};

export const INITIAL_PAIRING_REQUESTS: DevicePairingRequest[] = [
  {
    id: 'pair-001',
    pairCode: 'MND-842',
    deviceName: 'Living Room Tablet (Apple iPadOS 18)',
    browserInfo: 'Mobile Safari 18.2',
    ipAddress: '192.168.1.45 (Kolkata)',
    status: 'approved',
    patientId: 'p-subir-banerjee',
    patientName: 'Subir Banerjee',
    approvedBy: 'Debojit Banerjee',
    requestedAt: '20 Jan 2026, 08:30 AM',
    approvedAt: '20 Jan 2026, 08:32 AM',
    token: 'tok_pair_subir_live'
  },
  {
    id: 'pair-002',
    pairCode: 'MND-291',
    deviceName: 'Bedroom Samsung Galaxy Tab S9',
    browserInfo: 'Chrome 128 (Android 14)',
    ipAddress: '192.168.1.52 (Bengaluru)',
    status: 'approved',
    patientId: 'p-venkata-gowda',
    patientName: 'Venkatasubbaiah Gowda',
    approvedBy: 'Suresh Kumar',
    requestedAt: '21 Jan 2026, 09:00 AM',
    approvedAt: '21 Jan 2026, 09:05 AM',
    token: 'tok_pair_venkata_live'
  },
  {
    id: 'pair-003',
    pairCode: 'MND-773',
    deviceName: 'New Hallway Lenovo Screen',
    browserInfo: 'Firefox 122',
    ipAddress: '192.168.1.88 (Varanasi)',
    status: 'pending',
    patientId: 'p-ramesh-verma',
    patientName: 'Ramesh Chandra Verma',
    requestedAt: '23 Jan 2026, 11:20 AM'
  }
];

export const INITIAL_LINKED_DEVICES: DevicePairingRequest[] = [
  INITIAL_PAIRING_REQUESTS[0],
  INITIAL_PAIRING_REQUESTS[1]
];

export const INITIAL_REMINDERS: Reminder[] = [
  {
    id: 'rem-subir-01',
    patientId: 'p-subir-banerjee',
    type: 'hydration',
    title: 'Morning Warm Water & Tulsi',
    titleBengali: 'সকালের কুসুম কুসুম গরম জল ও তুলসী',
    titleAssamese: 'পুৱাৰ কুহুমীয়া পানী আৰু তুলসী',
    titleKannada: 'ಬೆಳಗಿನ ಬೆಚ್ಚಗಿನ ನೀರು ಮತ್ತು ತುಳಸಿ',
    titleHindi: 'सुबह का गुनगुना पानी और तुलसी',
    time: '07:00 AM',
    status: 'completed',
    notes: 'Take 1 glass of lukewarm water before morning walk.'
  },
  {
    id: 'rem-subir-02',
    patientId: 'p-subir-banerjee',
    type: 'medicine',
    title: 'Morning Cognitive Neuro-Care Tablet',
    titleBengali: 'সকালের স্মৃতিকল্যাণ ওষুধ',
    titleAssamese: 'পুৱাৰ স্মৃতিবৰ্ধক ঔষধ',
    titleKannada: 'ಬೆಳಗಿನ ನರ-ಆರೋಗ್ಯ ಔಷಧ',
    titleHindi: 'सुबह की स्मृति सुरक्षा दवा',
    time: '08:00 AM',
    status: 'completed',
    notes: 'Prescribed by Dr. Ananya Mukherjee after light breakfast.'
  },
  {
    id: 'rem-subir-03',
    patientId: 'p-subir-banerjee',
    type: 'activity',
    title: '10-Minute Bengali Familiar Memories Match',
    titleBengali: '১০ মিনিটের পরিচিত স্মৃতি মেলানো খেলা',
    titleAssamese: '১০ মিনিটৰ স্মৃতি খেল',
    titleKannada: '೧೦ ನಿಮಿಷದ ನೆನಪಿನ ಆಟ',
    titleHindi: '१० मिनट का स्मृति खेल',
    time: '10:30 AM',
    status: 'pending',
    notes: 'Gentle Level 2 memory cards on the tablet.'
  }
];

export const INITIAL_SESSIONS: GameSession[] = [
  {
    id: 'sess-01',
    patientId: 'p-subir-banerjee',
    gameType: 'memory',
    gameTitle: 'Bengali Heritage Memory Match',
    score: 88,
    accuracy: 88,
    responseTime: 3.8,
    attempts: 1,
    difficulty: 2,
    timestamp: '2026-09-18T10:30:00Z',
    dateFormatted: '18 Sep',
    completed: true,
    synced: true,
    notes: 'Recalled Kolkata tram and Victoria Memorial cards smoothly.'
  },
  {
    id: 'sess-02',
    patientId: 'p-subir-banerjee',
    gameType: 'attention',
    gameTitle: 'Selective Attention (Flower Focus)',
    score: 92,
    accuracy: 92,
    responseTime: 3.2,
    attempts: 1,
    difficulty: 2,
    timestamp: '2026-09-17T11:15:00Z',
    dateFormatted: '17 Sep',
    completed: true,
    synced: true,
    notes: 'Quickly spotted target items with cheerful disposition.'
  },
  {
    id: 'sess-03',
    patientId: 'p-subir-banerjee',
    gameType: 'pattern',
    gameTitle: 'Rabindra Sangeet Sequencing',
    score: 85,
    accuracy: 85,
    responseTime: 4.0,
    attempts: 1,
    difficulty: 2,
    timestamp: '2026-09-16T10:05:00Z',
    dateFormatted: '16 Sep',
    completed: true,
    synced: true,
    notes: 'Hummed melody while completing sequence.'
  },
  {
    id: 'sess-04',
    patientId: 'p-subir-banerjee',
    gameType: 'routine',
    gameTitle: 'Daily Morning Routine Recall',
    score: 84,
    accuracy: 84,
    responseTime: 4.2,
    attempts: 1,
    difficulty: 2,
    timestamp: '2026-09-15T09:45:00Z',
    dateFormatted: '15 Sep',
    completed: true,
    synced: true,
    notes: 'Reconstructed morning wake up and hydration sequence.'
  }
];

export const INITIAL_ADAPTIVE_STATES: Record<string, AdaptiveDifficultyState> = {
  memory: {
    gameType: 'memory',
    currentDifficulty: 2,
    recentAccuracyAverage: 88,
    historyExplanation: [
      'Difficulty set to Level 2 based on initial cognitive assessment.',
      'Maintained at Level 2 for stable, unhurried pacing.'
    ],
    lastAdjustedDate: '18 Sep'
  },
  attention: {
    gameType: 'attention',
    currentDifficulty: 2,
    recentAccuracyAverage: 92,
    historyExplanation: [
      'Maintained at Level 2 (consistent accuracy 92%).'
    ],
    lastAdjustedDate: '17 Sep'
  },
  pattern: {
    gameType: 'pattern',
    currentDifficulty: 2,
    recentAccuracyAverage: 85,
    historyExplanation: [
      'Sequencing difficulty calibrated to Level 2.'
    ],
    lastAdjustedDate: '16 Sep'
  },
  routine: {
    gameType: 'routine',
    currentDifficulty: 2,
    recentAccuracyAverage: 84,
    historyExplanation: [
      'Daily routine steps recall set to Level 2.'
    ],
    lastAdjustedDate: '15 Sep'
  }
};

export const INITIAL_ALERTS: CaregiverAlert[] = [
  {
    id: 'alt-1',
    type: 'success',
    title: 'Daily Cognitive Activity Completed',
    message: 'Subir completed his Bengali Heritage Memory activity with 88% accuracy.',
    timestamp: 'Today, 10:42 AM',
    read: false,
    actionLabel: 'View Telemetry'
  },
  {
    id: 'alt-2',
    type: 'info',
    title: 'Caregiver Routine Sync Active',
    message: 'Debojit Banerjee confirmed morning hydration routine.',
    timestamp: 'Today, 08:30 AM',
    read: true,
    actionLabel: 'View Schedule'
  }
];

export const CULTURAL_MEMORIES: CulturalMemoryItem[] = [
  {
    id: 'mem-bn-01',
    title: 'Victoria Memorial & Maidan Tram',
    titleBengali: 'ভিক্টোরিয়া মেমোরিয়াল ও ট্রাম ভ্রমণ',
    titleAssamese: 'ভিক্টোৰিয়া মেম’ৰিয়েল আৰু ট্ৰাম যাত্ৰা',
    titleKannada: 'ವಿಕ್ಟೋರಿಯಾ ಸ್ಮಾರಕ ಮತ್ತು ಟ್ರಾಮ್ ಸವಾರಿ',
    titleHindi: 'विक्टोरिया मेमोरियल और ट्राम की यात्रा',
    category: 'Bengali Heritage',
    description: 'Riding the gentle wooden tram along the green Maidan, feeling the cool morning breeze.',
    emoji: '🏛️',
    theme: 'Heritage'
  },
  {
    id: 'mem-as-01',
    title: 'Rongali Bihu Rhythm & Dhol-Pepa',
    titleBengali: 'রঙালী বিহু ও ঢোল-পেঁপার সুর',
    titleAssamese: 'ৰঙালী বিহু আৰু ঢোল-পেঁপাৰ সুৰ',
    titleKannada: 'ರಂಗಾಲಿ ಬಿಹು ಮತ್ತು ಡೋಲು-ಪೇಪಾ ವಾದನ',
    titleHindi: 'रंगाली बिहू और ढोल-पेपा की धुन',
    category: 'Assam Heritage',
    description: 'The joyful rhythm of the wooden dhol and buffalo horn pepa echoing under Kopou orchids.',
    emoji: '🪕',
    theme: 'Music'
  },
  {
    id: 'mem-kn-01',
    title: 'Mysore Palace Dasara Illumination',
    titleBengali: 'মহীশূর প্রাসাদের দশেরা আলোকসজ্জা',
    titleAssamese: 'মহীশূৰ প্ৰাসাদৰ দশহৰাৰ আলোকসজ্জা',
    titleKannada: 'ಮೈಸೂರು ಅರಮನೆ ಮತ್ತು ದಸರಾ ವೈಭವ',
    titleHindi: 'मैसूर महल की जगमगाती दशहरा रोशनी',
    category: 'Kannada Heritage',
    description: 'One hundred thousand golden bulbs lighting up Mysore Palace with the royal elephant procession.',
    emoji: '👑',
    theme: 'Royalty'
  },
  {
    id: 'mem-hi-01',
    title: 'Varanasi Evening Ganga Aarti',
    titleBengali: 'বারাণসীর সন্ধ্যার গঙ্গা আরতি',
    titleAssamese: 'বাৰাণসীৰ সন্ধিয়াৰ গংগা আৰতি',
    titleKannada: 'ವಾರಣಾಸಿಯ ಸಂಜೆಯ ಗಂಗಾ ಆರತಿ',
    titleHindi: 'वाराणसी के दशाश्वमेध घाट पर गंगा आरती',
    category: 'Hindi Heritage',
    description: 'The deep chime of brass temple bells, glowing tiered brass lamps and floral diyas.',
    emoji: '🪔',
    theme: 'Spiritual'
  }
];

export const MOCK_PERFORMANCE_TRENDS = [
  { day: '14 Sep', accuracy: 82, responseTime: 4.2, score: 80 },
  { day: '15 Sep', accuracy: 85, responseTime: 4.0, score: 84 },
  { day: '16 Sep', accuracy: 88, responseTime: 3.8, score: 86 },
  { day: '17 Sep', accuracy: 92, responseTime: 3.2, score: 90 },
  { day: 'Today', accuracy: 94, responseTime: 3.0, score: 95 }
];
