import React, { useState, useEffect } from 'react';
import { Navbar } from './components/common/Navbar';
import { DisclaimerBanner } from './components/common/DisclaimerBanner';
import { DemoStoryGuide } from './components/common/DemoStoryGuide';
import { LandingPage } from './components/landing/LandingPage';
import { PatientHome } from './components/patient/PatientHome';
import { FamiliarMemories } from './components/patient/FamiliarMemories';
import { VoiceAssistantModal } from './components/patient/VoiceAssistantModal';
import { CaregiverDashboard } from './components/caregiver/CaregiverDashboard';
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
  GameSession,
  AlertItem
} from './types';
import { StorageService } from './services/storage';
import { AudioSpeechService } from './services/audioSpeech';

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'patient' | 'caregiver' | 'game' | 'memories'>('landing');
  const [activeGame, setActiveGame] = useState<GameType>('memory');
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const [showDemoGuide, setShowDemoGuide] = useState(true);
  const [demoCurrentStep, setDemoCurrentStep] = useState(1);
  const [isSyncing, setIsSyncing] = useState(false);

  // App persistent state
  const [patient, setPatient] = useState<PatientProfile>(StorageService.getPatient());
  const [caregiver, setCaregiver] = useState<CaregiverProfile>(StorageService.getCaregiver());
  const [reminders, setReminders] = useState<Reminder[]>(StorageService.getReminders());
  const [sessions, setSessions] = useState<GameSession[]>(StorageService.getSessions());
  const [alerts, setAlerts] = useState<AlertItem[]>(StorageService.getAlerts());
  const [accessibility, setAccessibility] = useState<AccessibilitySettings>(StorageService.getAccessibility());
  const [isOffline, setIsOffline] = useState<boolean>(StorageService.isOffline());
  const [language, setLanguage] = useState<Language>(StorageService.getPatient().language);

  // Sync state from storage
  const refreshStorageData = () => {
    setPatient(StorageService.getPatient());
    setCaregiver(StorageService.getCaregiver());
    setReminders(StorageService.getReminders());
    setSessions(StorageService.getSessions());
    setAlerts(StorageService.getAlerts());
    setAccessibility(StorageService.getAccessibility());
    setIsOffline(StorageService.isOffline());
  };

  useEffect(() => {
    refreshStorageData();

    // Listen to window online/offline events
    const handleOnline = () => {
      StorageService.setOfflineOverride(false);
      setIsOffline(false);
    };
    const handleOffline = () => {
      StorageService.setOfflineOverride(true);
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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

  // Manual cloud sync
  const handleSync = async () => {
    setIsSyncing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    StorageService.syncPendingSessions();
    refreshStorageData();
    setIsSyncing(false);
    AudioSpeechService.playChime('success');
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

  // Launch a game
  const handleStartGame = (gameType: GameType) => {
    setActiveGame(gameType);
    setCurrentView('game');
  };

  // 16-Step Product Walkthrough Jump Handler
  const handleSelectDemoStep = (stepNumber: number) => {
    setDemoCurrentStep(stepNumber);
    switch (stepNumber) {
      case 1:
        // STEP 1: Open patient mode
        setCurrentView('patient');
        break;
      case 2:
        // STEP 2: Show personalized greeting
        setCurrentView('patient');
        AudioSpeechService.speak(`Good morning, ${patient.name}! You are doing wonderful today.`, language);
        break;
      case 3:
        // STEP 3: Start Memory Match
        setActiveGame('memory');
        setCurrentView('game');
        break;
      case 4:
        // STEP 4: Complete the game
        setActiveGame('memory');
        setCurrentView('game');
        break;
      case 5:
        // STEP 5: Show accuracy and response time
        setActiveGame('memory');
        setCurrentView('game');
        break;
      case 6:
        // STEP 6: Adaptive engine changes difficulty
        setCurrentView('caregiver');
        break;
      case 7:
        // STEP 7: Show personalized encouragement
        setCurrentView('patient');
        AudioSpeechService.speak("You did wonderful, Anima. Your memory focus is very steady today.", language);
        break;
      case 8:
        // STEP 8: Ask voice assistant: "When is my medicine?"
        setCurrentView('patient');
        setShowVoiceAssistant(true);
        break;
      case 9:
        // STEP 9: Show reminder
        setShowVoiceAssistant(false);
        setCurrentView('patient');
        break;
      case 10:
        // STEP 10: Switch to caregiver dashboard
        setCurrentView('caregiver');
        break;
      case 11:
        // STEP 11: Show today's completed session
        setCurrentView('caregiver');
        break;
      case 12:
        // STEP 12: Show 7-day performance trend
        setCurrentView('caregiver');
        break;
      case 13:
        // STEP 13: Show adaptive difficulty history
        setCurrentView('caregiver');
        break;
      case 14:
        // STEP 14: Toggle Offline Mode
        StorageService.setOfflineOverride(true);
        setIsOffline(true);
        setCurrentView('patient');
        break;
      case 15:
        // STEP 15: Complete another game offline
        setActiveGame('attention');
        setCurrentView('game');
        break;
      case 16:
        // STEP 16: Show "3 activities ready to sync"
        // Add offline dummy sessions if needed so pending count is visible
        refreshStorageData();
        setCurrentView('caregiver');
        break;
      default:
        setCurrentView('patient');
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

      {/* Global Navigation Bar */}
      <Navbar
        currentView={currentView === 'memories' ? 'patient' : currentView}
        onNavigate={(v) => setCurrentView(v)}
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
      />

      {/* Strict Non-Diagnostic Medical Disclaimer Banner */}
      <DisclaimerBanner language={language} />

      {/* Main Content Router */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage
            onStartPatient={() => setCurrentView('patient')}
            onOpenCaregiver={() => setCurrentView('caregiver')}
            onSelectDemoStep={handleSelectDemoStep}
            language={language}
          />
        )}

        {currentView === 'patient' && (
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

        {currentView === 'memories' && (
          <FamiliarMemories
            onBack={() => setCurrentView('patient')}
            language={language}
          />
        )}

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
          />
        )}

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
            setCurrentView('game');
          }}
          onViewReminders={() => {
            setCurrentView('patient');
          }}
        />
      )}

      {/* Reassuring Footer */}
      <footer className="bg-white border-t border-stone-200 py-6 px-4 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-stone-800 font-['Outfit']">MINDORA</span>
            <span>• A familiar companion for everyday memory, activity and care.</span>
          </div>
          <div className="text-stone-400">
            Cognitive health, routine assistance & family support
          </div>
        </div>
      </footer>

    </div>
  );
}
