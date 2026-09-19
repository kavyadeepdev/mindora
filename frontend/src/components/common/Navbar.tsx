import React, { useState } from 'react';
import { 
  HeartHandshake, 
  Wifi, 
  WifiOff, 
  User, 
  ShieldCheck, 
  Compass, 
  Volume2, 
  VolumeX, 
  Type, 
  Contrast, 
  RefreshCw,
  Sparkles,
  HelpCircle,
  RotateCcw,
  LogOut,
  LogIn,
  Stethoscope,
  Smartphone,
  ShieldAlert
} from 'lucide-react';
import { Language, AccessibilitySettings, PatientProfile, SubdomainPortal } from '../../types';
import { getTranslation } from '../../utils/translations';
import { StorageService } from '../../services/storage';

interface NavbarProps {
  portal: SubdomainPortal;
  currentView: 'landing' | 'patient' | 'caregiver' | 'game' | 'doctor' | 'memories' | 'admin';
  onNavigate: (view: any) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  accessibility: AccessibilitySettings;
  onAccessibilityChange: (settings: AccessibilitySettings) => void;
  isOffline: boolean;
  onToggleOffline: () => void;
  pendingSyncCount: number;
  onSync: () => void;
  isSyncing: boolean;
  showDemoGuide: boolean;
  onToggleDemoGuide: () => void;
  currentUser: { name: string; email: string; role?: string } | null;
  onOpenAuthModal: (tab?: 'patient' | 'caregiver' | 'doctor') => void;
  onSignOut: () => void;
  patient: PatientProfile;
  onSwitchPortal?: (portal: SubdomainPortal) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  portal,
  currentView,
  onNavigate,
  language,
  onLanguageChange,
  accessibility,
  onAccessibilityChange,
  isOffline,
  onToggleOffline,
  pendingSyncCount,
  onSync,
  isSyncing,
  showDemoGuide,
  onToggleDemoGuide,
  currentUser,
  onOpenAuthModal,
  onSignOut,
  patient,
  onSwitchPortal
}) => {
  const [showAccessMenu, setShowAccessMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <button
              id="nav-logo-btn"
              onClick={() => {
                if (portal === 'doctor') onNavigate('doctor');
                else if (portal === 'caretaker') onNavigate('caregiver');
                else if (portal === 'patient') onNavigate('patient');
                else if (portal === 'admin') onNavigate('admin');
                else onNavigate('landing');
              }}
              className="flex items-center gap-3 text-left focus:outline-none group"
            >
              <div className="w-11 h-11 rounded-2xl bg-amber-600/10 border border-amber-600/25 flex items-center justify-center text-amber-800 shadow-xs group-hover:bg-amber-600/15 transition">
                {portal === 'doctor' ? (
                  <Stethoscope className="w-6 h-6 text-teal-700" />
                ) : portal === 'admin' ? (
                  <ShieldAlert className="w-6 h-6 text-purple-700" />
                ) : (
                  <HeartHandshake className="w-6 h-6 text-amber-700" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xl tracking-tight text-stone-900 font-['Outfit']">
                    {getTranslation('appName', language)}
                  </span>
                  <span className={`hidden md:inline-flex text-[11px] font-semibold tracking-wide border px-2.5 py-0.5 rounded-full ${
                    portal === 'doctor'
                      ? 'bg-teal-50 text-teal-900 border-teal-200'
                      : portal === 'admin'
                      ? 'bg-purple-50 text-purple-900 border-purple-200'
                      : 'bg-amber-100/80 text-amber-900 border-amber-200'
                  }`}>
                    {portal === 'doctor' ? 'Clinician' :
                     portal === 'caretaker' ? 'Caretaker' :
                     portal === 'admin' ? 'Super Admin' :
                     getTranslation('careCompanion', language)}
                  </span>
                </div>
                <p className="text-xs text-stone-500 font-medium hidden sm:block">
                  {getTranslation('appTagline', language)}
                </p>
              </div>
            </button>
          </div>

          {/* Portal / Subdomain Indicator Badge (Clean, zero mode buttons) */}
          <div className="hidden md:flex items-center gap-2">
            {portal === 'patient' && (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-amber-950">{patient.name}</span>
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full">
                  Paired Device
                </span>
              </div>
            )}

            {portal === 'doctor' && (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200">
                <Stethoscope className="w-4 h-4 text-teal-700" />
                <span className="text-xs font-extrabold text-teal-950">Clinical Control Portal</span>
                <span className="text-[10px] font-semibold text-teal-700 bg-teal-100/70 px-2 py-0.5 rounded-full">
                  {currentUser?.role === 'doctor' ? currentUser.name : 'Clinician'}
                </span>
              </div>
            )}

            {portal === 'admin' && (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200">
                <ShieldAlert className="w-4 h-4 text-purple-700" />
                <span className="text-xs font-extrabold text-purple-950">Super Admin Governance</span>
                <span className="text-[10px] font-semibold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-full">
                  Statutory Oversight
                </span>
              </div>
            )}

            {portal === 'caretaker' && (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span className="text-xs font-extrabold text-amber-950">Caretaker Portal</span>
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full">
                  Family Care
                </span>
              </div>
            )}

            {portal === 'landing' && (
              <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
                <span>Cognitive Care & Dementia Platform</span>
              </div>
            )}
          </div>

          {/* Controls: Language, Accessibility, Offline Status, Demo Guide */}
          <div className="flex items-center gap-2">
            
            {/* Offline / Synced Indicator Badge */}
            <div className="flex items-center">
              {isOffline ? (
                <button
                  id="nav-offline-toggle-btn"
                  onClick={onToggleOffline}
                  title="Click to toggle Online/Offline mode"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition"
                >
                  <WifiOff className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                  <span className="hidden md:inline">{getTranslation('offlineMode', language)}</span>
                  {pendingSyncCount > 0 && (
                    <span className="ml-0.5 bg-amber-600 text-white px-1.5 py-0.2 rounded-full font-bold text-[10px]">
                      {pendingSyncCount}
                    </span>
                  )}
                </button>
              ) : (
                <button
                  id="nav-online-toggle-btn"
                  onClick={onToggleOffline}
                  title="Click to toggle offline mode simulation"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition"
                >
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden md:inline">{getTranslation('online', language)}</span>
                  {pendingSyncCount > 0 ? (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onSync();
                      }}
                      className="ml-1 bg-amber-500 text-white px-1.5 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1 hover:bg-amber-600"
                    >
                      <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      Sync {pendingSyncCount}
                    </span>
                  ) : (
                    <span className="text-emerald-700 text-[11px]">{getTranslation('synced', language)}</span>
                  )}
                </button>
              )}
            </div>

            {/* Language Selector */}
            <div className="relative">
              <select
                id="language-select-dropdown"
                value={language}
                onChange={(e) => onLanguageChange(e.target.value as Language)}
                className="bg-stone-100 border border-stone-200 text-stone-800 text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                title="Select interface language"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="as">অসমীয়া (Assamese)</option>
                <option value="bn">বাংলা (Bengali)</option>
                <option value="kn">ಕನ್ನಡ (Kannada)</option>
              </select>
            </div>

            {/* Accessibility Quick Panel */}
            <div className="relative">
              <button
                id="accessibility-options-btn"
                onClick={() => setShowAccessMenu(!showAccessMenu)}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition ${
                  accessibility.largeText || accessibility.highContrast
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200/60'
                }`}
                title={getTranslation('elderlyAccessibility', language)}
              >
                <Type className="w-4 h-4" />
              </button>

              {showAccessMenu && (
                <div 
                  id="accessibility-dropdown-menu"
                  className="absolute right-0 mt-2 w-64 bg-white border border-stone-200 rounded-2xl shadow-xl p-3 z-50 text-stone-800 text-xs space-y-2 animate-in fade-in"
                >
                  <div className="font-bold text-stone-900 pb-1 border-b border-stone-100 flex items-center justify-between">
                    <span>{getTranslation('elderlyAccessibility', language)}</span>
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">{getTranslation('friendlyBadge', language)}</span>
                  </div>

                  <label className="flex items-center justify-between p-1.5 hover:bg-stone-50 rounded-lg cursor-pointer">
                    <span className="flex items-center gap-2">
                      <Type className="w-4 h-4 text-stone-600" />
                      {getTranslation('largeText', language)}
                    </span>
                    <input
                      type="checkbox"
                      checked={accessibility.largeText}
                      onChange={(e) =>
                        onAccessibilityChange({ ...accessibility, largeText: e.target.checked })
                      }
                      className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-1.5 hover:bg-stone-50 rounded-lg cursor-pointer">
                    <span className="flex items-center gap-2">
                      <Contrast className="w-4 h-4 text-stone-600" />
                      {getTranslation('highContrast', language)}
                    </span>
                    <input
                      type="checkbox"
                      checked={accessibility.highContrast}
                      onChange={(e) =>
                        onAccessibilityChange({ ...accessibility, highContrast: e.target.checked })
                      }
                      className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-1.5 hover:bg-stone-50 rounded-lg cursor-pointer">
                    <span className="flex items-center gap-2">
                      {accessibility.audioFeedback ? (
                        <Volume2 className="w-4 h-4 text-stone-600" />
                      ) : (
                        <VolumeX className="w-4 h-4 text-stone-400" />
                      )}
                      {getTranslation('audioChimesCues', language)}
                    </span>
                    <input
                      type="checkbox"
                      checked={accessibility.audioFeedback}
                      onChange={(e) =>
                        onAccessibilityChange({ ...accessibility, audioFeedback: e.target.checked })
                      }
                      className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                    />
                  </label>

                  <div className="pt-1 border-t border-stone-100">
                    <button
                      onClick={() => {
                        StorageService.resetToDemo();
                        window.location.reload();
                      }}
                      className="w-full text-left flex items-center gap-1.5 text-stone-500 hover:text-red-600 p-1 rounded transition text-[11px]"
                    >
                      <RotateCcw className="w-3 h-3" />
                      {getTranslation('resetToDemo', language)}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Guided Product Walkthrough Trigger */}
            <button
              id="demo-story-guide-toggle"
              onClick={onToggleDemoGuide}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                showDemoGuide
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
              }`}
              title="Toggle Guided Product Walkthrough"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700 fill-amber-300" />
              <span className="hidden xl:inline">{getTranslation('productTour', language)}</span>
              <span className="xl:hidden">{getTranslation('tour', language)}</span>
            </button>

            {/* Caregiver Authentication & User Profile */}
            <div className="relative pl-1 border-l border-stone-200 flex items-center gap-1.5">
              {currentUser ? (
                <div className="relative">
                  <button
                    id="nav-user-profile-btn"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200/80 border border-stone-200 text-xs font-bold text-stone-800 transition shadow-2xs"
                    title="Caregiver Profile & Settings"
                  >
                    <div className="w-6 h-6 rounded-lg bg-stone-900 text-white flex items-center justify-center text-[11px] font-black">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:inline truncate max-w-[100px]">{currentUser.name}</span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-stone-200 rounded-2xl shadow-xl p-3 z-50 text-xs space-y-2 animate-in fade-in">
                      <div className="pb-2 border-b border-stone-100">
                        <div className="flex items-center gap-1.5 text-amber-800 font-bold">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                          <span>{getTranslation('caregiverAccount', language)}</span>
                        </div>
                        <p className="font-extrabold text-stone-900 text-sm mt-0.5 truncate">{currentUser.name}</p>
                        <p className="text-[11px] text-stone-500 truncate">{currentUser.email}</p>
                      </div>

                      {currentUser.role === 'admin' && (
                        <button
                          onClick={() => {
                            if (onSwitchPortal) onSwitchPortal('admin');
                            else onNavigate('admin');
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left p-2 hover:bg-purple-50 text-purple-950 rounded-xl font-bold flex items-center gap-2 transition"
                        >
                          <ShieldAlert className="w-4 h-4 text-purple-700" />
                          <span>Admin Governance</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          onOpenAuthModal('patient');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left p-2 hover:bg-amber-50 text-amber-950 rounded-xl font-bold flex items-center gap-2 transition"
                      >
                        <User className="w-4 h-4 text-amber-600" />
                        <span>{getTranslation('switchPatientProfile', language)}</span>
                      </button>

                      <button
                        onClick={() => {
                          onSignOut();
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left p-2 hover:bg-rose-50 text-rose-700 rounded-xl font-bold flex items-center gap-2 transition"
                      >
                        <LogOut className="w-4 h-4 text-rose-600" />
                        <span>{getTranslation('signOut', language)}</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  id="nav-login-btn"
                  onClick={() => onOpenAuthModal('caregiver')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-stone-900 hover:bg-black text-white shadow-xs transition"
                  title="Caregiver Sign In"
                >
                  <LogIn className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">{getTranslation('signIn', language)}</span>
                </button>
              )}

              {/* Quick Patient Switch button (Easy handover to elderly user) */}
              {currentView === 'caregiver' && (
                <button
                  id="nav-patient-handover-btn"
                  onClick={() => onNavigate('patient')}
                  className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-100/70 hover:bg-amber-200/80 text-amber-900 border border-amber-300 transition"
                  title={`Hand over device to ${patient.name}`}
                >
                  <User className="w-3.5 h-3.5 text-amber-700" />
                  <span>{patient.name.split(' ')[0]}</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
