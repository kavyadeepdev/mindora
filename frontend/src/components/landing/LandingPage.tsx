import React from 'react';
import { 
  HeartHandshake, 
  Brain, 
  ShieldCheck, 
  Stethoscope,
  Smartphone,
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Sliders,
  Calendar,
  Users
} from 'lucide-react';
import { Language } from '../../types';
import { getTranslation } from '../../utils/translations';

interface LandingPageProps {
  onStartPatient: () => void;
  onOpenCaregiver: () => void;
  onOpenDoctor: () => void;
  onSelectDemoStep?: (stepNumber: number) => void;
  language: Language;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartPatient,
  onOpenCaregiver,
  onOpenDoctor,
  onSelectDemoStep,
  language
}) => {
  return (
    <div className="bg-stone-50 min-h-[calc(100vh-4.5rem)] text-stone-900">
      
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
        <div className="max-w-3xl mx-auto text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100/90 text-amber-900 border border-amber-300/80 text-xs font-bold mb-6">
            <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
            <span>Dedicated Multi-Portal Cognitive Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-stone-900 tracking-tight font-['Outfit'] leading-tight">
            {getTranslation('appName', language)}
          </h1>

          <p className="text-xl sm:text-2xl text-stone-700 font-medium mt-4 max-w-2xl mx-auto">
            {getTranslation('appTagline', language)}
          </p>

          <p className="text-stone-500 text-sm sm:text-base mt-4 max-w-xl mx-auto leading-relaxed">
            A tripartite architecture connecting <strong>Neurologists & Clinicians</strong>, <strong>Family Caretakers</strong>, and <strong>Elderly Individuals</strong> across dedicated subdomains.
          </p>
        </div>

        {/* 3 Dedicated Subdomain Portals Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-5xl mx-auto">
          
          {/* Portal 1: Doctor Subdomain */}
          <div className="bg-white border-2 border-teal-200/90 hover:border-teal-400 rounded-3xl p-6 sm:p-8 shadow-md flex flex-col justify-between transition group hover:shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center text-2xl shadow-xs group-hover:scale-105 transition">
                  <Stethoscope className="w-7 h-7" />
                </div>
                <span className="text-[11px] font-bold text-teal-900 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full font-mono">
                  doctor.mindora.app
                </span>
              </div>

              <h2 className="text-2xl font-extrabold text-stone-900 font-['Outfit'] mb-2">
                Doctor Portal
              </h2>

              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-4">
                Prescribe cognitive exercises, dictate the exact sequence and round count (3, 5, 7 rounds), set medical prescriptions, and approve patient screens.
              </p>

              <ul className="space-y-2 text-xs text-stone-600 font-medium mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>Activity Prescriptions & Round Control</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>Clinical Telemetry & Progress Trends</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>WhatsApp Web Device Authorization</span>
                </li>
              </ul>
            </div>

            <button
              id="landing-open-doctor-btn"
              onClick={onOpenDoctor}
              className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Launch Doctor Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Portal 2: Caretaker Subdomain */}
          <div className="bg-white border-2 border-amber-200/90 hover:border-amber-400 rounded-3xl p-6 sm:p-8 shadow-md flex flex-col justify-between transition group hover:shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center text-2xl shadow-xs group-hover:scale-105 transition">
                  <ShieldCheck className="w-7 h-7 text-amber-700" />
                </div>
                <span className="text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full font-mono">
                  caretaker.mindora.app
                </span>
              </div>

              <h2 className="text-2xl font-extrabold text-stone-900 font-['Outfit'] mb-2">
                Caretaker Portal
              </h2>

              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-4">
                Manage daily medication, hydration, and activity reminders for loved ones. Approve incoming screen connections with one tap.
              </p>

              <ul className="space-y-2 text-xs text-stone-600 font-medium mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Daily Reminders & Schedule Manager</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>One-Tap Patient Screen Pairing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Multi-Patient Family Directory</span>
                </li>
              </ul>
            </div>

            <button
              id="landing-open-caregiver-btn"
              onClick={onOpenCaregiver}
              className="w-full py-3.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Launch Caretaker Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Portal 3: Patient Subdomain */}
          <div className="bg-gradient-to-b from-amber-500/10 to-orange-500/5 border-2 border-amber-400 rounded-3xl p-6 sm:p-8 shadow-md flex flex-col justify-between transition group hover:shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-600 text-white flex items-center justify-center text-3xl shadow-sm group-hover:scale-105 transition">
                  🌸
                </div>
                <span className="text-[11px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full font-mono">
                  patient.mindora.app
                </span>
              </div>

              <h2 className="text-2xl font-extrabold text-stone-900 font-['Outfit'] mb-2">
                Patient Companion
              </h2>

              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-4">
                Zero-friction dementia experience. No passwords or codes. Plays doctor-prescribed games in exact order with calm voice guidance.
              </p>

              <ul className="space-y-2 text-xs text-stone-700 font-medium mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
                  <span>WhatsApp Web Zero-Password Pairing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
                  <span>Prescribed Activity Sequencing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
                  <span>Voice Welcome & 5 Indian Languages</span>
                </li>
              </ul>
            </div>

            <button
              id="landing-open-patient-btn"
              onClick={onStartPatient}
              className="w-full py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Launch Patient Screen</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Product Tour link */}
        {onSelectDemoStep && (
          <div className="text-center mt-8">
            <button
              onClick={() => onSelectDemoStep(1)}
              className="text-xs font-bold text-amber-900 hover:text-amber-950 underline underline-offset-4 cursor-pointer inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span>Take the Interactive 16-Step Monorepo Tour</span>
            </button>
          </div>
        )}
      </section>

      {/* Non-Diagnostic Clinical Positioning Banner */}
      <section className="bg-amber-100/60 border-y border-amber-200/80 py-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            Healthcare Positioning & Clinical Governance
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 font-['Outfit'] mb-3">
            Cognitive Engagement & Caregiver Telemetry Framework
          </h2>
          <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-medium max-w-3xl mx-auto">
            MINDORA is strictly a cognitive wellness and routine assistance platform. It does <strong>not</strong> provide medical diagnoses, predict neurological decline, or replace clinical consultation. It empowers doctors and caretakers with objective observational metrics and stress-free routine structure.
          </p>
        </div>
      </section>

    </div>
  );
};
