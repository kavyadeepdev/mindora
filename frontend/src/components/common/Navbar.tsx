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
  RotateCcw
} from 'lucide-react';
import { Language, AccessibilitySettings } from '../../types';
import { getTranslation } from '../../utils/translations';
import { StorageService } from '../../services/storage';

interface NavbarProps {
  currentView: 'landing' | 'patient' | 'caregiver' | 'game';
  onNavigate: (view: 'landing' | 'patient' | 'caregiver') => void;
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
}

export const Navbar: React.FC<NavbarProps> = ({
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
  onToggleDemoGuide
}) => {
  const [showAccessMenu, setShowAccessMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <button
              id="nav-logo-btn"
              onClick={() => onNavigate('landing')}
              className="flex items-center gap-3 text-left focus:outline-none group"
            >
              <div className="w-11 h-11 rounded-2xl bg-amber-600/10 border border-amber-600/25 flex items-center justify-center text-amber-800 shadow-xs group-hover:bg-amber-600/15 transition">
                <HeartHandshake className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xl tracking-tight text-stone-900 font-['Outfit']">
                    MINDORA
                  </span>
                  <span className="hidden md:inline-flex text-[11px] font-semibold tracking-wide bg-amber-100/80 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded-full">
                    Care Companion
                  </span>
                </div>
                <p className="text-xs text-stone-500 font-medium hidden sm:block">
                  A familiar companion for everyday memory, activity and care.
                </p>
              </div>
            </button>
          </div>

          {/* Navigation Modes Switcher */}
          <nav className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-2xl border border-stone-200/80">
            <button
              id="nav-btn-landing"
              onClick={() => onNavigate('landing')}
              className={`px-3 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-1.5 ${
                currentView === 'landing'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </button>

            <button
              id="nav-btn-patient"
              onClick={() => onNavigate('patient')}
              className={`px-3.5 py-2 rounded-xl text-sm font-bold transition flex items-center gap-1.5 ${
                currentView === 'patient' || currentView === 'game'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-700 hover:text-amber-700 hover:bg-amber-50'
              }`}
            >
              <User className="w-4 h-4" />
              <span>{getTranslation('patientMode', language)}</span>
            </button>

            <button
              id="nav-btn-caregiver"
              onClick={() => onNavigate('caregiver')}
              className={`px-3 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-1.5 ${
                currentView === 'caregiver'
                  ? 'bg-stone-800 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Caregiver</span>
              <span className="sm:hidden">Care</span>
            </button>
          </nav>

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
                  <span className="hidden md:inline">Offline Mode</span>
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
                  <span className="hidden md:inline">Online</span>
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
                    <span className="text-emerald-700 text-[11px]">Synced</span>
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
                title="Elderly Accessibility Features"
              >
                <Type className="w-4 h-4" />
              </button>

              {showAccessMenu && (
                <div 
                  id="accessibility-dropdown-menu"
                  className="absolute right-0 mt-2 w-64 bg-white border border-stone-200 rounded-2xl shadow-xl p-3 z-50 text-stone-800 text-xs space-y-2 animate-in fade-in"
                >
                  <div className="font-bold text-stone-900 pb-1 border-b border-stone-100 flex items-center justify-between">
                    <span>Elderly Accessibility</span>
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">Friendly</span>
                  </div>

                  <label className="flex items-center justify-between p-1.5 hover:bg-stone-50 rounded-lg cursor-pointer">
                    <span className="flex items-center gap-2">
                      <Type className="w-4 h-4 text-stone-600" />
                      Large Font Mode
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
                      High Contrast Mode
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
                      Audio Chimes & Cues
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
                      Reset to Default Demo State
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
              title="Toggle 16-Step Guided Product Walkthrough"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700 fill-amber-300" />
              <span className="hidden lg:inline">Product Tour</span>
              <span className="lg:hidden">Tour</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
