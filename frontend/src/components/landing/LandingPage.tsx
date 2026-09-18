import React from 'react';
import { 
  HeartHandshake, 
  Brain, 
  ShieldCheck, 
  WifiOff, 
  Sparkles, 
  Mic, 
  ArrowRight, 
  CheckCircle2, 
  Smile, 
  Clock, 
  HelpCircle,
  Play
} from 'lucide-react';
import { Language } from '../../types';
import { getTranslation } from '../../utils/translations';

interface LandingPageProps {
  onStartPatient: () => void;
  onOpenCaregiver: () => void;
  onSelectDemoStep: (stepNumber: number) => void;
  language: Language;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartPatient,
  onOpenCaregiver,
  onSelectDemoStep,
  language
}) => {
  return (
    <div className="bg-stone-50 min-h-[calc(100vh-4.5rem)] text-stone-900">
      
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
        <div className="max-w-3xl mx-auto text-center">
          
          {/* Healthcare Platform Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100/90 text-amber-900 border border-amber-300/80 text-xs font-bold mb-6">
            <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
            <span>Everyday Memory & Care Companion</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-stone-900 tracking-tight font-['Outfit'] leading-tight sm:leading-none">
            MINDORA
          </h1>

          <p className="text-xl sm:text-2xl text-stone-700 font-medium mt-4 max-w-2xl mx-auto">
            A familiar companion for everyday memory, activity and care.
          </p>

          <p className="text-stone-500 text-sm sm:text-base mt-4 max-w-xl mx-auto leading-relaxed">
            Dignified, culturally rooted cognitive exercises and routine support engineered for families, caregivers, and elderly individuals.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-8">
            <button
              id="hero-start-patient-btn"
              onClick={onStartPatient}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-base shadow-lg transition flex items-center justify-center gap-2 cursor-pointer transform hover:scale-102"
            >
              <span>{getTranslation('patientMode', language)}</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              id="hero-open-caregiver-btn"
              onClick={onOpenCaregiver}
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white border-2 border-stone-300 hover:border-stone-400 text-stone-800 font-bold text-base shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-5 h-5 text-stone-600" />
              <span>{getTranslation('caregiverDashboard', language)}</span>
            </button>
          </div>

          {/* Demo Story Quick-Jump Link */}
          <div className="mt-4">
            <button
              onClick={() => onSelectDemoStep(1)}
              className="text-xs font-semibold text-amber-800 hover:text-amber-900 underline underline-offset-4 cursor-pointer inline-flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Launch Interactive Product Tour (16 Guided Steps)
            </button>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-5xl mx-auto">
          
          <div className="bg-white border border-stone-200/90 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 text-2xl mb-4">
                🌸
              </div>
              <h3 className="text-lg font-bold text-stone-900 font-['Outfit'] mb-2">
                Culturally Familiar Motifs
              </h3>
              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                Replaces alien stimuli with familiar local heritage: orchids, tea gardens, traditional masks, and folk rhythms for therapeutic comfort.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] font-semibold text-amber-800">
              Assamese • Hindi • English
            </div>
          </div>

          <div className="bg-white border border-stone-200/90 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 text-2xl mb-4">
                📶
              </div>
              <h3 className="text-lg font-bold text-stone-900 font-['Outfit'] mb-2">
                Offline-First Reliability
              </h3>
              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                Full client-side functionality allows elderly users in low-bandwidth or remote areas to play seamlessly. Reconciles transparently when connectivity resumes.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] font-semibold text-emerald-800">
              Zero-Downtime Local State
            </div>
          </div>

          <div className="bg-white border border-stone-200/90 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-800 text-2xl mb-4">
                ⚙️
              </div>
              <h3 className="text-lg font-bold text-stone-900 font-['Outfit'] mb-2">
                Deterministic Adaptive Engine
              </h3>
              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                Mathematical rule-based adjustments (≥85% promote, ≤55% ease) ensure activities adapt safely without confusing jumps, protecting patient confidence and dignity.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] font-semibold text-sky-800">
              Auditable Clinical Logic
            </div>
          </div>

        </div>
      </section>

      {/* Strict Non-Diagnostic Positioning Banner */}
      <section className="bg-amber-100/60 border-y border-amber-200/80 py-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            Healthcare Positioning & Medical Disclaimer
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 font-['Outfit'] mb-3">
            Cognitive Assistance & Memory Engagement Platform
          </h2>
          <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-medium max-w-3xl mx-auto">
            MINDORA is strictly an assistive daily engagement tool for patients and caregivers. It does <strong>not</strong> diagnose dementia, predict Alzheimer's disease, or substitute for professional neurological evaluation. All performance metrics track activity completion and response pacing to assist family oversight.
          </p>
        </div>
      </section>

    </div>
  );
};
