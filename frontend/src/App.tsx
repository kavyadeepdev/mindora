import React, { useState, useEffect } from 'react';
import { Navbar } from './components/common/Navbar';
import { DisclaimerBanner } from './components/common/DisclaimerBanner';
import { LandingPage } from './components/landing/LandingPage';
import { PatientHome } from './components/patient/PatientHome';
import { FamiliarMemories } from './components/patient/FamiliarMemories';
import { VoiceAssistantModal } from './components/patient/VoiceAssistantModal';
import { CaregiverDashboard } from './components/caregiver/CaregiverDashboard';
import { DoctorDashboard } from './components/doctor/DoctorDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
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
import { Globe, Stethoscope, ShieldCheck, Heart, ExternalLink, ShieldAlert } from 'lucide-react';

export default function App() {
  // Subdomain & Portal State
  const [portal, setPortal] = useState<SubdomainPortal>(() => detectPortalFromUrl());
  const [currentView, setCurrentView] = useState<'landing' | 'patient' | 'caregiver' | 'doctor' | 'game' | 'memories' | 'admin'>(() => {
    const p = detectPortalFromUrl();
    if (p === 'doctor') return 'doctor';
    if (p === 'caretaker') return 'caregiver';
    if (p === 'patient') return 'patient';
    if (p === 'admin') return 'admin';
    return 'landing';
  });

  const [activeGame, setActiveGame] = useState<GameType>('memory');
  const [activeRoundsCount, setActiveRoundsCount] = useState<number>(5);
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Authentication State: null until someone signs in on their own portal.
  // Doctor screens show the signed-in doctor, patient screens show the
  // selected patient profile. Never a hardcoded demo identity.
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role?: string } | null>(null);
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
  const [language, setLanguage] = useState<Language>(() => StorageService.getUiLanguage());

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
      else if (detected === 'admin') setCurrentView('admin');
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
      } else {
        setCurrentUser(null);
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

    const handleAccessibilityUpdate = () => {
      setAccessibility(StorageService.getAccessibility());
      const active = StorageService.getActivePatient();
      setPatient(active);
      // Interface language stays as the user chose it. Switching patients
      // never flips the UI into another language.
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('mindora-adaptive-change', handleAdaptiveChange);
    window.addEventListener('mindora-accessibility-changed', handleAccessibilityUpdate);
    window.addEventListener('mindora-patient-changed', handleAccessibilityUpdate);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('mindora-adaptive-change', handleAdaptiveChange);
      window.removeEventListener('mindora-accessibility-changed', handleAccessibilityUpdate);
      window.removeEventListener('mindora-patient-changed', handleAccessibilityUpdate);
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
    } else if (target === 'admin') {
      setCurrentView('admin');
    } else {
      setCurrentView('landing');
    }
  };

  // Handle accessibility setting updates
  const handleAccessibilityChange = (newSettings: AccessibilitySettings) => {
    setAccessibility(newSettings);
    StorageService.saveAccessibility(newSettings);
  };

  // Handle language updates: interface preference only, default English.
  // The active patient's own language record is left untouched.
  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    StorageService.saveUiLanguage(newLang);
  };

  // Manual cloud sync to Fastify backend
  const handleSync = async () => {
    setIsSyncing(true);
    await StorageService.syncPendingActivities();
    refreshStorageData();
    setIsSyncing(false);
    AudioSpeechService.playChime('success');
  };

  // Auth & Persona Handlers: each portal signs in its own way.
  // Doctor screens need a doctor account, caretaker screens a caregiver
  // account, patient screens pick a photo profile with no password.
  const handleOpenAuthModal = (tab?: 'patient' | 'caregiver' | 'doctor') => {
    if (tab) {
      setAuthModalTab(tab);
    } else if (portal === 'doctor') {
      setAuthModalTab('doctor');
    } else if (portal === 'patient') {
      setAuthModalTab('patient');
    } else {
      setAuthModalTab('caregiver');
    }
    setShowAuthModal(true);
  };

  const handleLoginSuccess = (user: { name: string; email: string; role?: string }) => {
    setCurrentUser(user);
    setShowAuthModal(false);
    // Reflect the signed-in professional on their own dashboard instead of
    // leaving seeded demo names in place.
    if (user.role === 'doctor') {
      const activeDoc = StorageService.getDoctor();
      StorageService.saveDoctor({ ...activeDoc, name: user.name, email: user.email });
      handleSwitchPortal('doctor');
    } else if (user.role === 'caregiver') {
      const activeCg = StorageService.getCaregiver();
      StorageService.saveCaregiver({ ...activeCg, name: user.name, email: user.email });
      handleSwitchPortal('caretaker');
    } else if (user.role === 'admin') {
      handleSwitchPortal('admin');
    }
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

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors ${
      accessibility.highContrast 
        ? 'bg-stone-950 text-stone-50 contrast-125' 
        : 'bg-[#faf9f5] text-[#1c1917]'
    } ${accessibility.largeText ? 'text-lg' : 'text-base'}`}>
      
      {/* Global Navigation Bar */}
      <Navbar
        portal={portal}
        currentView={currentView === 'memories' ? 'patient' : currentView}
        onNavigate={(v) => {
          if (v === 'doctor') handleSwitchPortal('doctor');
          else if (v === 'caregiver') handleSwitchPortal('caretaker');
          else if (v === 'patient') handleSwitchPortal('patient');
          else if (v === 'admin') handleSwitchPortal('admin');
          else handleSwitchPortal('landing');
        }}
        language={language}
        onLanguageChange={handleLanguageChange}
        accessibility={accessibility}
        onAccessibilityChange={handleAccessibilityChange}
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

        {/* SUPER ADMIN GOVERNANCE PORTAL */}
        {currentView === 'admin' && (
          <AdminDashboard />
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
        initialTab={authModalTab}
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

        <button
          onClick={() => handleSwitchPortal('admin')}
          className={`px-2.5 py-1 rounded-xl transition font-semibold flex items-center gap-1 ${
            portal === 'admin' 
              ? 'bg-purple-600 text-white shadow-xs' 
              : 'hover:bg-stone-800 text-purple-300'
          }`}
          title="admin.mindora.app"
        >
          <ShieldAlert className="w-3 h-3" />
          Admin
        </button>
      </aside>

      {/* Reassuring Footer */}
      <footer className="bg-[#1c1917] text-[#e7e0d3] mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-display text-3xl text-[#faf9f5]">Mindora</p>
            <p className="text-sm leading-relaxed mt-3 max-w-sm text-[#c9c0b2]">
              A familiar companion for everyday memory, activity and care. Gentle cognitive engagement for elderly loved ones, for every family, everywhere.
            </p>
            <p className="text-xs mt-4 text-[#a09d96] leading-relaxed max-w-sm">
              Cognitive wellness and routine support only. Mindora does not diagnose or treat any condition. It complements professional healthcare.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a09d96]">Portals</p>
            <ul className="mt-4 space-y-2.5 text-sm font-semibold">
              <li><button onClick={() => handleSwitchPortal('doctor')} className="hover:text-white transition min-h-[32px]">Clinical portal</button></li>
              <li><button onClick={() => handleSwitchPortal('caretaker')} className="hover:text-white transition min-h-[32px]">Caretaker portal</button></li>
              <li><button onClick={() => handleSwitchPortal('patient')} className="hover:text-white transition min-h-[32px]">Patient companion</button></li>
              <li><button onClick={() => handleSwitchPortal('landing')} className="hover:text-white transition min-h-[32px]">Home</button></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a09d96]">Care notes</p>
            <ul className="mt-4 space-y-2.5 text-sm text-[#c9c0b2]">
              <li>No timers and no rush</li>
              <li>Large text and audio guidance</li>
              <li>Works offline in low signal</li>
              <li>English, Hindi, Assamese, Bengali, Kannada</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#a09d96]">
            <span>Mindora. Tripartite cognitive care and caregiver telemetry.</span>
            <span>doctor . caretaker . patient . admin</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
