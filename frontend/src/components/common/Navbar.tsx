import React, { useState } from 'react';
import {
  HeartHandshake,
  User,
  Type,
  Contrast,
  RotateCcw,
  LogOut,
  LogIn,
  Volume2,
  VolumeX,
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
  currentUser: { name: string; email: string; role?: string } | null;
  onOpenAuthModal: (tab?: 'patient' | 'caregiver' | 'doctor') => void;
  onSignOut: () => void;
  patient: PatientProfile;
  onSwitchPortal?: (portal: SubdomainPortal) => void;
}

const roleLabel: Record<string, string> = {
  doctor: 'Doctor',
  caregiver: 'Caregiver',
  admin: 'Admin'
};

export const Navbar: React.FC<NavbarProps> = ({
  portal,
  currentView,
  onNavigate,
  language,
  onLanguageChange,
  accessibility,
  onAccessibilityChange,
  currentUser,
  onOpenAuthModal,
  onSignOut,
  patient,
  onSwitchPortal
}) => {
  const [showAccessMenu, setShowAccessMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const goHome = () => {
    if (portal === 'doctor') onNavigate('doctor');
    else if (portal === 'caretaker') onNavigate('caregiver');
    else if (portal === 'patient') onNavigate('patient');
    else if (portal === 'admin') onNavigate('admin');
    else onNavigate('landing');
  };

  const patientInitials = patient.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-40 bg-[#faf9f5]/90 backdrop-blur-md border-b border-[#e7e0d3]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-[68px] gap-3">

          <button
            id="nav-logo-btn"
            onClick={goHome}
            className="flex items-center gap-3 text-left rounded-2xl p-1 focus:outline-none group min-h-[52px]"
            aria-label="Mindora home"
          >
            <span className="w-11 h-11 rounded-2xl bg-[#9a3412] text-white flex items-center justify-center shadow-[0_8px_24px_rgba(154,52,18,0.25)] group-hover:bg-[#7c2d12] transition">
              <HeartHandshake className="w-5 h-5" />
            </span>
            <span className="font-display font-semibold text-[22px] leading-none text-[#1c1917]">
              {getTranslation('appName', language)}
            </span>
          </button>

          <div className="flex items-center gap-2">
            <select
              id="language-select-dropdown"
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as Language)}
              className="bg-white border border-[#e7e0d3] text-[#1c1917] text-[12px] font-bold rounded-full px-3 py-2.5 min-h-[44px] cursor-pointer"
              title="Select interface language"
              aria-label="Select interface language"
            >
              <option value="en">EN</option>
              <option value="hi">हिंदी</option>
              <option value="as">অসমীয়া</option>
              <option value="bn">বাংলা</option>
              <option value="kn">ಕನ್ನಡ</option>
            </select>

            <div className="relative">
              <button
                id="accessibility-options-btn"
                onClick={() => setShowAccessMenu(!showAccessMenu)}
                className={`w-[44px] h-[44px] rounded-full border flex items-center justify-center transition ${
                  accessibility.largeText || accessibility.highContrast
                    ? 'bg-[#9a3412] text-white border-[#9a3412]'
                    : 'bg-white text-[#44403c] border-[#e7e0d3] hover:bg-[#f5f0e8]'
                }`}
                title={getTranslation('elderlyAccessibility', language)}
                aria-expanded={showAccessMenu}
              >
                <Type className="w-4 h-4" />
              </button>

              {showAccessMenu && (
                <div
                  id="accessibility-dropdown-menu"
                  className="absolute right-0 mt-2 w-72 bg-white border border-[#e7e0d3] rounded-[20px] shadow-[0_18px_50px_rgba(28,25,23,0.14)] p-3 z-50 text-[13px]"
                >
                  <p className="font-bold text-[#1c1917] px-2 pb-2">{getTranslation('elderlyAccessibility', language)}</p>
                  <label className="flex items-center justify-between p-2.5 hover:bg-[#faf9f5] rounded-2xl cursor-pointer min-h-[48px]">
                    <span className="flex items-center gap-2 font-semibold">
                      <Type className="w-4 h-4" />
                      {getTranslation('largeText', language)}
                    </span>
                    <input
                      type="checkbox"
                      checked={accessibility.largeText}
                      onChange={(e) => onAccessibilityChange({ ...accessibility, largeText: e.target.checked })}
                      className="w-5 h-5 accent-[#9a3412] cursor-pointer"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2.5 hover:bg-[#faf9f5] rounded-2xl cursor-pointer min-h-[48px]">
                    <span className="flex items-center gap-2 font-semibold">
                      <Contrast className="w-4 h-4" />
                      {getTranslation('highContrast', language)}
                    </span>
                    <input
                      type="checkbox"
                      checked={accessibility.highContrast}
                      onChange={(e) => onAccessibilityChange({ ...accessibility, highContrast: e.target.checked })}
                      className="w-5 h-5 accent-[#9a3412] cursor-pointer"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2.5 hover:bg-[#faf9f5] rounded-2xl cursor-pointer min-h-[48px]">
                    <span className="flex items-center gap-2 font-semibold">
                      {accessibility.audioFeedback ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      {getTranslation('audioChimesCues', language)}
                    </span>
                    <input
                      type="checkbox"
                      checked={accessibility.audioFeedback}
                      onChange={(e) => onAccessibilityChange({ ...accessibility, audioFeedback: e.target.checked })}
                      className="w-5 h-5 accent-[#9a3412] cursor-pointer"
                    />
                  </label>
                  <button
                    onClick={() => {
                      StorageService.resetToDemo();
                      window.location.reload();
                    }}
                    className="w-full mt-1 flex items-center gap-2 p-2.5 rounded-2xl text-[#78716c] hover:text-[#be123c] hover:bg-[#faf9f5] text-[12px] font-semibold min-h-[44px]"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {getTranslation('resetToDemo', language)}
                  </button>
                </div>
              )}
            </div>

            <div className="pl-1 border-l border-[#e7e0d3] flex items-center gap-2">
              {portal === 'patient' ? (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-white border border-[#e7e0d3] text-[12px] font-bold min-h-[44px]">
                    <span className="w-8 h-8 rounded-full bg-[#9a3412] text-white flex items-center justify-center text-[12px] font-bold">
                      {patientInitials}
                    </span>
                    <span className="hidden sm:inline max-w-[110px] truncate">{patient.name}</span>
                  </span>
                  <button
                    id="nav-patient-switch-btn"
                    onClick={() => onOpenAuthModal('patient')}
                    className="px-4 py-2.5 rounded-full text-[12px] font-bold bg-white hover:bg-[#f5f0e8] text-[#1c1917] border border-[#e7e0d3] min-h-[44px]"
                  >
                    {getTranslation('switchUser', language)}
                  </button>
                </div>
              ) : currentUser ? (
                <div className="relative">
                  <button
                    id="nav-user-profile-btn"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-white hover:bg-[#f5f0e8] border border-[#e7e0d3] text-[12px] font-bold min-h-[44px]"
                    aria-expanded={showUserMenu}
                  >
                    <span className="w-8 h-8 rounded-full bg-[#1c1917] text-white flex items-center justify-center text-[13px] font-bold">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="hidden sm:inline max-w-[110px] truncate">{currentUser.name}</span>
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-60 bg-white border border-[#e7e0d3] rounded-[20px] shadow-[0_18px_50px_rgba(28,25,23,0.14)] p-2 z-50 text-[13px]">
                      <div className="px-3 py-2 border-b border-[#f5f0e8] mb-1">
                        <p className="text-[12px] font-bold text-[#0f766e]">
                          {roleLabel[currentUser.role || ''] || 'Account'}
                        </p>
                        <p className="font-bold truncate mt-1">{currentUser.name}</p>
                        <p className="text-[12px] text-[#78716c] truncate">{currentUser.email}</p>
                      </div>
                      {currentUser.role === 'admin' && portal !== 'admin' && (
                        <button
                          onClick={() => {
                            if (onSwitchPortal) onSwitchPortal('admin');
                            else onNavigate('admin');
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-3 py-2.5 hover:bg-[#faf9f5] rounded-2xl font-bold flex items-center gap-2 min-h-[44px]"
                        >
                          <ShieldAlert className="w-4 h-4" />
                          Admin Governance
                        </button>
                      )}
                      <button
                        onClick={() => {
                          onSignOut();
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-3 py-2.5 hover:bg-[#fef2f2] text-[#be123c] rounded-2xl font-bold flex items-center gap-2 min-h-[44px]"
                      >
                        <LogOut className="w-4 h-4" />
                        {getTranslation('signOut', language)}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  id="nav-login-btn"
                  onClick={() => onOpenAuthModal()}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[12px] font-bold bg-[#1c1917] hover:bg-black text-white min-h-[44px]"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">{getTranslation('signIn', language)}</span>
                </button>
              )}
              {portal === 'caretaker' && currentView === 'caregiver' && (
                <button
                  id="nav-patient-handover-btn"
                  onClick={() => onNavigate('patient')}
                  className="hidden md:flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[12px] font-bold bg-[#9a3412] hover:bg-[#7c2d12] text-white min-h-[44px]"
                  title={`Hand over device to ${patient.name}`}
                >
                  <User className="w-4 h-4" />
                  {patient.name.split(' ')[0]}
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
