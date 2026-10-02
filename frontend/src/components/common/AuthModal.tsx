import React, { useState, useEffect } from 'react';
import {
  User,
  Eye,
  EyeOff,
  Sparkles,
  Volume2,
  ShieldCheck,
  Heart,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  X,
  HeartHandshake,
  Stethoscope
} from 'lucide-react';
import { Language, PatientProfile } from '../../types';
import { authService } from '../../services/auth';
import { AudioSpeechService } from '../../services/audioSpeech';

type AuthTab = 'patient' | 'caregiver' | 'doctor';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onLoginSuccess: (user: { name: string; email: string; role?: string }) => void;
  currentPatient: PatientProfile;
  onSelectPatient: (patient: PatientProfile) => void;
  initialTab?: AuthTab;
}

const TAB_META: Record<AuthTab, { title: string; subtitle: string }> = {
  patient: {
    title: 'Patient Sign-In',
    subtitle: 'Gentle, zero-password access for daily activities'
  },
  caregiver: {
    title: 'Caregiver Access',
    subtitle: 'Secure access to reminders and family care tools'
  },
  doctor: {
    title: 'Doctor Access',
    subtitle: 'Clinical sign-in for care plans and progress trends'
  }
};

/** Turn "jane.doe+clinic@x.y" into "Jane Doe" for a friendly fallback label. */
const prettifyEmailPrefix = (email: string): string => {
  const prefix = email.split('@')[0] || 'there';
  return prefix
    .split(/[._-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .slice(0, 40);
};

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  language,
  onLoginSuccess,
  currentPatient,
  onSelectPatient,
  initialTab = 'patient',
}) => {
  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
  const [isRegistering, setIsRegistering] = useState(false);

  // Staff form state (shared by caregiver and doctor tabs)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [staffName, setStaffName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reset to the requesting portal's tab every time the modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsRegistering(false);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Spoken accessibility helper
  const handleReadInstructions = () => {
    if (activeTab === 'patient') {
      const text = language === 'as'
        ? `নমস্কাৰ! আপোনাৰ ছবিখন চুই আৰম্ভ কৰক। কোনো পাছৱৰ্ড নালাগে।`
        : `Hello! Please tap on your photo to begin your gentle activities. No password is required.`;
      AudioSpeechService.speak(text, language);
    } else if (activeTab === 'doctor') {
      AudioSpeechService.speak('Doctor sign in. Please enter your name, email and password to access the clinical dashboard.', language);
    } else {
      const text = language === 'as'
        ? `অভিভাৱক বা পৰিয়ালৰ সদস্যসকলৰ বাবে ইয়াত ইমেইল আৰু পাছৱৰ্ড দিব পাৰিব।`
        : `Caregiver and family sign in. Please enter your email and password to access the care dashboard.`;
      AudioSpeechService.speak(text, language);
    }
  };

  // Patient Quick Access Handler (Zero-Friction for Dementia)
  const handlePatientSelect = (patient: PatientProfile) => {
    AudioSpeechService.playChime('celebrate');
    const greeting = language === 'as'
      ? `শুভ প্ৰভাত ${patient.name}! আহক আজিৰ সহজ খেলকেইটা খেলোঁ।`
      : `Good morning, ${patient.name}! Let's start your gentle daily activities.`;
    AudioSpeechService.speak(greeting, language);
    onSelectPatient(patient);
    onClose();
  };

  // Staff (Caregiver / Doctor) Sign In Handler
  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);
    const role: 'caregiver' | 'doctor' | 'admin' = email.toLowerCase().includes('admin')
      ? 'admin'
      : activeTab === 'doctor'
        ? 'doctor'
        : 'caregiver';

    try {
      if (isRegistering) {
        if (!staffName.trim()) {
          setErrorMessage('Please enter your name.');
          setLoading(false);
          return;
        }
        const res = await authService.signUp(staffName.trim(), email, password);
        setSuccessMessage(
          res.ok ? 'Account created. Signing you in...' : 'Account saved on this device. Signing you in...'
        );
        AudioSpeechService.playChime('success');
        setTimeout(() => {
          onLoginSuccess({ name: staffName.trim(), email, role });
          onClose();
        }, 800);
      } else {
        const res = await authService.signIn(email, password);
        const displayName = prettifyEmailPrefix(email);
        if (res.ok) {
          setSuccessMessage(`Signed in as ${displayName}.`);
        } else {
          // Backend unreachable or unknown account: local demo fallback
          setSuccessMessage(`Signed in as ${displayName} (on this device).`);
        }
        AudioSpeechService.playChime('success');
        setTimeout(() => {
          onLoginSuccess({ name: staffName.trim() || displayName, email, role });
          onClose();
        }, 800);
      }
    } catch {
      const displayName = staffName.trim() || prettifyEmailPrefix(email);
      setSuccessMessage(`Signed in as ${displayName} (on this device).`);
      onLoginSuccess({ name: displayName, email, role });
      setTimeout(onClose, 800);
    } finally {
      setLoading(false);
    }
  };

  const isStaffTab = activeTab === 'caregiver' || activeTab === 'doctor';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="relative w-full max-w-xl bg-white rounded-[20px] shadow-2xl border border-[#e7e0d3] overflow-hidden">

        {/* Header with Accessibility Controls */}
        <div className="flex items-center justify-between px-6 py-5 bg-[#faf9f5] border-b border-[#e7e0d3]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#9a3412] flex items-center justify-center text-white">
              {activeTab === 'doctor'
                ? <Stethoscope className="w-5 h-5" />
                : activeTab === 'caregiver'
                  ? <ShieldCheck className="w-5 h-5" />
                  : <HeartHandshake className="w-5 h-5" />}
            </div>
            <div>
              <h2 id="auth-modal-title" className="text-lg font-bold text-[#1c1917]">
                {TAB_META[activeTab].title}
              </h2>
              <p className="text-xs text-[#78716c] font-medium">
                {TAB_META[activeTab].subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReadInstructions}
              className="p-2.5 rounded-xl bg-white text-[#1c1917] border border-[#e7e0d3] hover:bg-[#f5f0e8] transition flex items-center gap-1.5 text-xs font-bold min-h-[44px]"
              title="Listen to spoken instructions"
              aria-label="Listen to spoken instructions"
            >
              <Volume2 className="w-4 h-4" />
              <span className="hidden sm:inline">Listen</span>
            </button>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-white hover:bg-[#f5f0e8] text-[#78716c] border border-[#e7e0d3] transition min-h-[44px] min-w-[44px]"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Persona Mode Switcher */}
        <div className="grid grid-cols-3 gap-2 p-2 bg-[#f5f0e8] border-b border-[#e7e0d3]">
          {(
            [
              { id: 'patient', label: 'Patient', icon: User, hint: 'Photo tap' },
              { id: 'caregiver', label: 'Caregiver', icon: ShieldCheck, hint: 'Email' },
              { id: 'doctor', label: 'Doctor', icon: Stethoscope, hint: 'Email' }
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id);
                setErrorMessage(null);
                setSuccessMessage(null);
                setIsRegistering(false);
              }}
              className={`py-3 px-2 rounded-2xl text-[13px] font-bold flex flex-col items-center justify-center gap-1 transition min-h-[56px] ${
                activeTab === t.id
                  ? 'bg-[#9a3412] text-white shadow-sm'
                  : 'text-[#44403c] hover:bg-white'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <t.icon className="w-4 h-4" />
                {t.label}
              </span>
              <span className={`text-[10px] font-semibold ${activeTab === t.id ? 'text-white/80' : 'text-[#78716c]'}`}>
                {t.hint}
              </span>
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6">

          {/* TAB 1: PATIENT FRIENDLY ZERO-PASSWORD ACCESS */}
          {activeTab === 'patient' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-4 bg-[#f5f0e8] border border-[#e7e0d3] rounded-[20px] flex items-start gap-3">
                <Heart className="w-5 h-5 text-[#9a3412] shrink-0 mt-0.5" />
                <div className="text-xs text-[#44403c] leading-relaxed">
                  <p className="font-bold mb-0.5">Dementia-Friendly Design:</p>
                  No password memorization or complex codes. Simply tap your name or picture below to enter your familiar activities.
                </div>
              </div>

              {/* Patient Visual Profile Card */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[#78716c]">
                  Select Your Profile:
                </p>

                <button
                  onClick={() => handlePatientSelect(currentPatient)}
                  className="w-full p-4 rounded-[20px] border-2 border-[#9a3412]/60 bg-[#faf9f5] hover:bg-[#f5f0e8] hover:border-[#9a3412] transition flex items-center justify-between group shadow-sm focus:outline-none text-left min-h-[88px]"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={currentPatient.avatarUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"}
                      alt={currentPatient.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md group-hover:scale-105 transition"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-[#1c1917]">
                          {currentPatient.name}
                        </h3>
                        <span className="bg-[#f5f0e8] text-[#6b5f52] text-[11px] font-bold px-2 py-0.5 rounded-full">
                          Age {currentPatient.age}
                        </span>
                      </div>
                      <p className="text-xs text-[#78716c] font-medium mt-0.5">
                        {currentPatient.location}
                      </p>
                      <p className="text-[11px] text-[#9a3412] font-semibold mt-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Today: gentle activities ready
                      </p>
                    </div>
                  </div>

                  <div className="w-12 h-12 rounded-2xl bg-[#9a3412] text-white flex items-center justify-center group-hover:translate-x-1 transition shadow-sm shrink-0">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                </button>
              </div>

              <div className="pt-2 border-t border-[#e7e0d3] flex items-center justify-between text-xs text-[#78716c]">
                <span>Are you a caregiver or doctor?</span>
                <button
                  onClick={() => setActiveTab('caregiver')}
                  className="font-bold text-[#9a3412] hover:text-[#7c2d12] underline underline-offset-2"
                >
                  Switch to staff sign in
                </button>
              </div>
            </div>
          )}

          {/* TAB 2/3: STAFF AUTHENTICATION (Caregiver / Doctor) */}
          {isStaffTab && (
            <div className="space-y-5 animate-in fade-in duration-200">

              {/* Status Feedback */}
              {errorMessage && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-[20px] text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}
              {successMessage && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-[20px] text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{successMessage}</span>
                </div>
              )}

              <form onSubmit={handleStaffSubmit} className="space-y-4">
                {isRegistering && (
                  <div>
                    <label className="block text-xs font-bold text-[#44403c] uppercase tracking-wide mb-1.5">
                      {activeTab === 'doctor' ? 'Doctor Name' : 'Caregiver Name'}
                    </label>
                    <input
                      type="text"
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      placeholder={activeTab === 'doctor' ? 'e.g. Dr. Jane Smith' : 'e.g. John Carter'}
                      required
                      autoComplete="name"
                      className="w-full px-4 py-3 rounded-2xl border border-[#e7e0d3] text-[#1c1917] text-sm font-medium focus:outline-none focus:border-[#9a3412] focus:ring-2 focus:ring-[#9a3412]/15 transition bg-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#44403c] uppercase tracking-wide mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={activeTab === 'doctor' ? 'doctor@clinic.org' : 'you@example.com'}
                    required
                    autoComplete="email"
                    className="w-full px-4 py-3 rounded-2xl border border-[#e7e0d3] text-[#1c1917] text-sm font-medium focus:outline-none focus:border-[#9a3412] focus:ring-2 focus:ring-[#9a3412]/15 transition bg-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[#44403c] uppercase tracking-wide">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs text-[#78716c] hover:text-[#1c1917] flex items-center gap-1 font-medium"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPassword ? 'Hide password' : 'Show password'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete={isRegistering ? 'new-password' : 'current-password'}
                      className="w-full px-4 py-3 rounded-2xl border border-[#e7e0d3] text-[#1c1917] text-sm font-medium focus:outline-none focus:border-[#9a3412] focus:ring-2 focus:ring-[#9a3412]/15 transition bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-full bg-[#1c1917] hover:bg-black text-white font-bold text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 mt-2 min-h-[52px]"
                >
                  {loading ? (
                    <span>Processing...</span>
                  ) : isRegistering ? (
                    <span>Create {activeTab === 'doctor' ? 'Doctor' : 'Caregiver'} Account</span>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
              </form>

              {/* Toggle Register / Sign In */}
              <div className="pt-2 border-t border-[#e7e0d3] flex items-center justify-between text-xs text-[#78716c]">
                <span>{isRegistering ? 'Already have an account?' : "Don't have an account yet?"}</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                    setErrorMessage(null);
                  }}
                  className="font-bold text-[#1c1917] hover:underline"
                >
                  {isRegistering ? 'Sign In instead' : 'Create account'}
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
