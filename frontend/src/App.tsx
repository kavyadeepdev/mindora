import React, { useState, useEffect } from 'react';
import { Navbar } from './components/common/Navbar';
import { DisclaimerBanner } from './components/common/DisclaimerBanner';
import { DemoStoryGuide } from './components/common/DemoStoryGuide';
import { LandingPage } from './components/landing/LandingPage';
import { PatientHome } from './components/patient/PatientHome';
import { FamiliarMemories } from './components/patient/FamiliarMemories';
import { VoiceAssistantModal } from './components/patient/VoiceAssistantModal';
import { CaregiverDashboard } from './components/caregiver/CaregiverDashboard';
import { DoctorDashboard } from './components/doctor/DoctorDashboard';
import { PatientDevicePairing } from './components/patient/PatientDevicePairing';
import { MemoryMatchGame } from './components/games/MemoryMatchGame';
import { AttentionChallenge } from './components/games/AttentionChallenge';
import { PatternRecognition } from './components/games/PatternRecognition';
import { RoutineRecallGame } from './components/games/RoutineRecallGame';

import { 
  Language, 
  AccessibilitySettings, 
  GameType, 
  Reminder, 
  PatientProfile, 
  CaregiverProfile,
  DoctorProfile,
  GameSession, 
  AlertItem,
  SubdomainPortal
} from './types';
import { StorageService } from './services/storage';
import { AudioSpeechService } from './services/audioSpeech';
import { AuthModal } from './components/common/AuthModal';
import { authService } from './services/auth';
import { detectPortalFromUrl, navigateToPortal } from './utils/subdomain';
import { Globe, Stethoscope, ShieldCheck, Heart, ExternalLink } from 'lucide-react';

export default function App() {
  // Subdomain & Portal State
  const [portal, setPortal] = useState<SubdomainPortal>(() => detectPortalFromUrl());
  const [currentView, setCurrentView] = useState<'landing' | 'patient' | 'caregiver' | 'doctor' | 'game' | 'memories'>(() => {
    const p = detectPortalFromUrl();
    if (p === 'doctor') return 'doctor';
    if (p === 'caretaker') return 'caregiver';
    if (p === 'patient') return 'patient';
    return 'landing';
  });

  const [activeGame, setActiveGame] = useState<GameType>('memory');
  const [activeRoundsCount, setActiveRoundsCount] = useState<number>(5);
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const [showDemoGuide, setShowDemoGuide] = useState(false);
  const [demoCurrentStep, setDemoCurrentStep] = useState(1);
  const [isSyncing, setIsSyncing] = useState(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role?: string } | null>({
    name: 'Dr. Debojit Sarma',
    email: 'dr.debojit@mindora.care',
    role: 'doctor'
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'patient' | 'caregiver' | 'doctor'>('patient');

  // App persistent state
  const [patients, setPatients] = useState<PatientProfile[]>(() => StorageService.getAllPatients());
  const [patient, setPatient] = useState<PatientProfile>(() => StorageService.getActivePatient());
  const [caregiver, setCaregiver] = useState<CaregiverProfile>(() => StorageService.getCaregiver());
  const [doctor, setDoctor] = useState<DoctorProfile>(() => StorageService.getDoctor());
  const [reminders, setReminders] = useState<Reminder[]>(() => StorageService.getReminders());
  const [sessions, setSessions] = useState<GameSession[]>(() => StorageService.getSessions());
  const [alerts, setAlerts] = useState<AlertItem[]>(() => StorageService.getAlerts());
  const [accessibility, setAccessibility] = useState<AccessibilitySettings>(() => StorageService.getAccessibility());
  const [isOffline, setIsOffline] = useState<boolean>(() => StorageService.isOffline());
  const [language, setLanguage] = useState<Language>(() => StorageService.getActivePatient().language);

  // WhatsApp Web-style pairing state for patient device
  const [isPaired, setIsPaired] = useState<boolean>(() => Boolean(StorageService.getCurrentPairedDevice()));

  // Sync state from storage
  const refreshStorageData = () => {
    const updatedPatients = StorageService.getAllPatients();
    setPatients(updatedPatients);
    setPatient(StorageService.getActivePatient());
    setCaregiver(StorageService.getCaregiver());
    setDoctor(StorageService.getDoctor());
    setReminders(StorageService.getReminders());
    setSessions(StorageService.getSessions());
    setAlerts(StorageService.getAlerts());
    setAccessibility(StorageService.getAccessibility());
    setIsOffline(StorageService.isOffline());
    setIsPaired(Boolean(StorageService.getCurrentPairedDevice()));
  };

  // Subdomain & popstate synchronization
  useEffect(() => {
    const syncFromUrl = () => {
      const detected = detectPortalFromUrl();
      setPortal(detected);
      if (detected === 'doctor') setCurrentView('doctor');
      else if (detected === 'caretaker') setCurrentView('caregiver');
      else if (detected === 'patient') setCurrentView('patient');
      else setCurrentView('landing');
    };

    window.addEventListener('popstate', syncFromUrl);
    window.addEventListener('mindora-portal-change', syncFromUrl);

    return () => {
      window.removeEventListener('popstate', syncFromUrl);
      window.removeEventListener('mindora-portal-change', syncFromUrl);
    };
  }, []);

  useEffect(() => {
    refreshStorageData();

    // Check active Better Auth session
    authService.getSession().then((sess) => {
      if (sess?.user) {
        setCurrentUser({ 
          name: sess.user.name, 
          email: sess.user.email,
          role: (sess.user as any).role || 'caregiver'
        });
      }
    });

    // Hydrate from Fastify / Neon backend if online
    StorageService.hydrateFromBackend().then(() => {
      refreshStorageData();
    });

    // Listen to window online/offline events
    const handleOnline = () => {
      StorageService.setOfflineOverride(false);
      setIsOffline(false);
      StorageService.syncPendingActivities().then(() => refreshStorageData());
    };
    const handleOffline = () => {
      StorageService.setOfflineOverride(true);
      setIsOffline(true);
    };

    const handleAdaptiveChange = () => {
      refreshStorageData();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('mindora-adaptive-change', handleAdaptiveChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('mindora-adaptive-change', handleAdaptiveChange);
    };
  }, []);

  // Portal switcher handler
  const handleSwitchPortal = (target: SubdomainPortal) => {
    setPortal(target);
    navigateToPortal(target);
    if (target === 'doctor') {
      setCurrentView('doctor');
    } else if (target === 'caretaker') {
      setCurrentView('caregiver');
    } else if (target === 'patient') {
      setCurrentView('patient');
    } else {
      setCurrentView('landing');
    }
  };

  // Handle accessibility setting updates
  const handleAccessibilityChange = (newSettings: AccessibilitySettings) => {
    setAccessibility(newSettings);
    StorageService.saveAccessibility(newSettings);
  };

  // Handle language updates
  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    const updatedPatient = { ...patient, language: newLang };
    setPatient(updatedPatient);
    StorageService.savePatient(updatedPatient);
  };

  // Toggle offline simulation
  const handleToggleOffline = () => {
    const nextState = !isOffline;
    StorageService.setOfflineOverride(nextState);
    setIsOffline(nextState);
  };

  // Manual cloud sync to Fastify backend
  const handleSync = async () => {
    setIsSyncing(true);
    await StorageService.syncPendingActivities();
    refreshStorageData();
    setIsSyncing(false);
    AudioSpeechService.playChime('success');
  };

  // Auth & Persona Handlers
  const handleOpenAuthModal = (tab: 'patient' | 'caregiver' | 'doctor' = 'patient') => {
    setAuthModalTab(tab);
    setShowAuthModal(true);
  };

  const handleLoginSuccess = (user: { name: string; email: string }) => {
    setCurrentUser(user);
    setShowAuthModal(false);
    refreshStorageData();
  };

  const handleSignOut = async () => {
    await authService.signOut();
    setCurrentUser(null);
    AudioSpeechService.playChime('tap');
  };

  // Select active patient from multi-patient cohort
  const handleSelectPatient = (selectedPatient: PatientProfile) => {
    StorageService.setActivePatientId(selectedPatient.id);
    setPatient(selectedPatient);
    refreshStorageData();
  };

  // Reminder toggle
  const handleToggleReminder = (id: string) => {
    const updated = StorageService.toggleReminder(id);
    setReminders(updated);
  };

  // Add reminder
  const handleAddReminder = (newRem: Partial<Reminder>) => {
    const fullReminder: Reminder = {
      id: `rem-${Date.now()}`,
      patientId: patient.id,
      title: newRem.title || 'Reminder',
      time: newRem.time || '12:00',
      type: newRem.type || 'activity',
      status: 'pending',
      notes: newRem.notes
    };
    const updated = StorageService.addReminder(fullReminder);
    setReminders(updated);
  };

  // Launch a game with doctor-prescribed rounds
  const handleStartGame = (gameType: GameType, roundsCount?: number) => {
    setActiveGame(gameType);
    setActiveRoundsCount(roundsCount || 5);
    setCurrentView('game');
  };

  // 16-Step Product Walkthrough Jump Handler
  const handleSelectDemoStep = (stepNumber: number) => {
    setDemoCurrentStep(stepNumber);
    switch (stepNumber) {
      case 1:
        handleSwitchPortal('patient');
        break;
      case 2:
        handleSwitchPortal('patient');
        AudioSpeechService.speak(`Good morning, ${patient.name}! You are doing wonderful today.`, language);
        break;
      case 3:
      case 4:
      case 5:
        setActiveGame('memory');
        setActiveRoundsCount(5);
        setCurrentView('game');
        break;
      case 6:
        handleSwitchPortal('caretaker');
        break;
      case 7:
        handleSwitchPortal('patient');
        AudioSpeechService.speak("You did wonderful. Your memory focus is very steady today.", language);
        break;
      case 8:
        handleSwitchPortal('patient');
        setShowVoiceAssistant(true);
        break;
      case 9:
        setShowVoiceAssistant(false);
        handleSwitchPortal('patient');
        break;
      case 10:
      case 11:
      case 12:
      case 13:
        handleSwitchPortal('caretaker');
        break;
      case 14:
        StorageService.setOfflineOverride(true);
        setIsOffline(true);
        handleSwitchPortal('patient');
        break;
      case 15:
        setActiveGame('attention');
        setActiveRoundsCount(5);
        setCurrentView('game');
        break;
      case 16:
        refreshStorageData();
        handleSwitchPortal('caretaker');
        break;
      default:
        handleSwitchPortal('patient');
    }
  };

  const pendingSyncCount = sessions.filter(s => !s.synced).length;

  return (
    <div className={`min-h-screen flex flex-col font-['Plus_Jakarta_Sans'] transition-colors ${
      accessibility.highContrast 
        ? 'bg-stone-900 text-stone-100 contrast-125' 
        : 'bg-stone-50/80 text-stone-900'
    } ${accessibility.largeText ? 'text-lg' : 'text-base'}`}>
      
      {/* 16-Step Product Walkthrough Guide */}
      {showDemoGuide && (
        <DemoStoryGuide
          currentStep={demoCurrentStep}
          onSelectStep={handleSelectDemoStep}
          onClose={() => setShowDemoGuide(false)}
        />
      )}

      {/* Global Navigation Bar (No overview/patient/caretaker mode buttons) */}
      <Navbar
        portal={portal}
        currentView={currentView === 'memories' ? 'patient' : currentView}
        onNavigate={(v) => {
          if (v === 'doctor') handleSwitchPortal('doctor');
          else if (v === 'caregiver') handleSwitchPortal('caretaker');
          else if (v === 'patient') handleSwitchPortal('patient');
          else handleSwitchPortal('landing');
        }}
        language={language}
        onLanguageChange={handleLanguageChange}
        accessibility={accessibility}
        onAccessibilityChange={handleAccessibilityChange}
        isOffline={isOffline}
        onToggleOffline={handleToggleOffline}
        pendingSyncCount={pendingSyncCount}
        onSync={handleSync}
        isSyncing={isSyncing}
        showDemoGuide={showDemoGuide}
        onToggleDemoGuide={() => setShowDemoGuide(!showDemoGuide)}
        currentUser={currentUser}
        onOpenAuthModal={handleOpenAuthModal}
        onSignOut={handleSignOut}
        patient={patient}
        onSwitchPortal={handleSwitchPortal}
      />

      {/* Strict Non-Diagnostic Medical Disclaimer Banner */}
      <DisclaimerBanner language={language} />

      {/* Main Content Router */}
      <main className="flex-1">
        {/* LANDING PAGE PORTAL */}
        {currentView === 'landing' && (
          <LandingPage
            onStartPatient={() => handleSwitchPortal('patient')}
            onOpenCaregiver={() => handleSwitchPortal('caretaker')}
            onOpenDoctor={() => handleSwitchPortal('doctor')}
            onSelectDemoStep={handleSelectDemoStep}
            language={language}
          />
        )}

        {/* DOCTOR CLINICAL CONTROL PORTAL */}
        {currentView === 'doctor' && (
          <DoctorDashboard
            doctor={doctor}
            patients={patients}
            activePatient={patient}
            onSelectPatient={(pid) => {
              const p = patients.find(x => x.id === pid);
              if (p) handleSelectPatient(p);
            }}
            language={language}
          />
        )}

        {/* CARETAKER / CAREGIVER PORTAL */}
        {currentView === 'caregiver' && (
          <CaregiverDashboard
            patient={patient}
            caregiver={caregiver}
            sessions={sessions}
            reminders={reminders}
            alerts={alerts}
            isOffline={isOffline}
            onToggleReminder={handleToggleReminder}
            onAddReminder={handleAddReminder}
            onSync={handleSync}
            isSyncing={isSyncing}
            language={language}
            patients={patients}
            onSelectPatient={(pid) => {
              const p = patients.find(x => x.id === pid);
              if (p) handleSelectPatient(p);
            }}
          />
        )}

        {/* PATIENT PORTAL */}
        {currentView === 'patient' && (
          <>
            {/* If patient screen is not yet paired with doctor/caretaker via WhatsApp Web pattern */}
            {!isPaired ? (
              <PatientDevicePairing
                language={language}
                onPaired={(device) => {
                  setIsPaired(true);
                  refreshStorageData();
                }}
              />
            ) : (
              <PatientHome
                patient={patient}
                reminders={reminders}
                onToggleReminder={handleToggleReminder}
                onStartGame={handleStartGame}
                onOpenVoiceAssistant={() => setShowVoiceAssistant(true)}
                onOpenMemories={() => setCurrentView('memories')}
                language={language}
              />
            )}
          </>
        )}

        {/* PATIENT FAMILIAR MEMORIES VIEW */}
        {currentView === 'memories' && (
          <FamiliarMemories
            onBack={() => setCurrentView('patient')}
            language={language}
          />
        )}

        {/* ACTIVE COGNITIVE ACTIVITY GAME (Prescribed rounds applied) */}
        {currentView === 'game' && (
          <div>
            {activeGame === 'memory' && (
              <MemoryMatchGame
                onBack={() => {
                  refreshStorageData();
                  setCurrentView('patient');
                }}
                language={language}
                onFinishGame={refreshStorageData}
                roundsCount={activeRoundsCount}
              />
            )}
            {activeGame === 'attention' && (
              <AttentionChallenge
                onBack={() => {
                  refreshStorageData();
                  setCurrentView('patient');
                }}
                language={language}
                onFinishGame={refreshStorageData}
                roundsCount={activeRoundsCount}
              />
            )}
            {activeGame === 'pattern' && (
              <PatternRecognition
                onBack={() => {
                  refreshStorageData();
                  setCurrentView('patient');
                }}
                language={language}
                onFinishGame={refreshStorageData}
                roundsCount={activeRoundsCount}
              />
            )}
            {activeGame === 'routine' && (
              <RoutineRecallGame
                onBack={() => {
                  refreshStorageData();
                  setCurrentView('patient');
                }}
                language={language}
                onFinishGame={refreshStorageData}
                roundsCount={activeRoundsCount}
              />
            )}
          </div>
        )}
      </main>

      {/* Voice Assistant Modal */}
      {showVoiceAssistant && (
        <VoiceAssistantModal
          onClose={() => setShowVoiceAssistant(false)}
          language={language}
          onNavigateGame={(gameType) => {
            setActiveGame(gameType);
            setActiveRoundsCount(5);
            setCurrentView('game');
          }}
          onViewReminders={() => {
            setCurrentView('patient');
          }}
        />
      )}

      {/* Accessible Dementia-Friendly Auth & Persona Switcher Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        language={language}
        onLoginSuccess={handleLoginSuccess}
        currentPatient={patient}
        onSelectPatient={handleSelectPatient}
        initialTab={authModalTab === 'doctor' ? 'caregiver' : authModalTab}
      />

      {/* Quick Subdomain Switcher Bar for Localhost & Testing */}
      <aside 
        aria-label="Subdomain Navigation Switcher"
        className="fixed bottom-3 right-3 z-50 flex items-center gap-1.5 p-1.5 bg-stone-900/90 backdrop-blur-md rounded-2xl border border-stone-700 shadow-2xl text-[11px] font-medium text-stone-200"
      >
        <span className="px-2 py-0.5 text-stone-400 font-semibold border-r border-stone-700 flex items-center gap-1">
          <Globe className="w-3 h-3 text-stone-400" />
          Subdomains
        </span>

        <button
          onClick={() => handleSwitchPortal('landing')}
          className={`px-2.5 py-1 rounded-xl transition font-semibold flex items-center gap-1 ${
            portal === 'landing' 
              ? 'bg-white text-stone-900 shadow-xs' 
              : 'hover:bg-stone-800 text-stone-300'
          }`}
          title="mindora.app"
        >
          Landing
        </button>

        <button
          onClick={() => handleSwitchPortal('doctor')}
          className={`px-2.5 py-1 rounded-xl transition font-semibold flex items-center gap-1 ${
            portal === 'doctor' 
              ? 'bg-teal-500 text-white shadow-xs' 
              : 'hover:bg-stone-800 text-teal-300'
          }`}
          title="doctor.mindora.app"
        >
          <Stethoscope className="w-3 h-3" />
          Doctor
        </button>

        <button
          onClick={() => handleSwitchPortal('caretaker')}
          className={`px-2.5 py-1 rounded-xl transition font-semibold flex items-center gap-1 ${
            portal === 'caretaker' 
              ? 'bg-amber-600 text-white shadow-xs' 
              : 'hover:bg-stone-800 text-amber-300'
          }`}
          title="caretaker.mindora.app"
        >
          <ShieldCheck className="w-3 h-3" />
          Caretaker
        </button>

        <button
          onClick={() => handleSwitchPortal('patient')}
          className={`px-2.5 py-1 rounded-xl transition font-semibold flex items-center gap-1 ${
            portal === 'patient' 
              ? 'bg-rose-500 text-white shadow-xs' 
              : 'hover:bg-stone-800 text-rose-300'
          }`}
          title="patient.mindora.app"
        >
          <Heart className="w-3 h-3" />
          Patient
        </button>
      </aside>

      {/* Reassuring Footer */}
      <footer className="bg-white border-t border-stone-200 py-6 px-4 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-stone-800 font-['Outfit']">MINDORA</span>
            <span>• Tripartite Cognitive Care & Clinical Telemetry Platform</span>
          </div>
          <div className="flex items-center gap-4 text-stone-400">
            <span>doctor.mindora.app</span>
            <span>caretaker.mindora.app</span>
            <span>patient.mindora.app</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
