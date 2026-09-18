import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Users, 
  Sliders, 
  Bell, 
  Smartphone, 
  Activity, 
  TrendingUp, 
  CheckCircle2, 
  Plus, 
  Save, 
  Clock, 
  Check, 
  X, 
  Trash2, 
  ShieldCheck, 
  AlertCircle,
  HelpCircle,
  Pill,
  Droplet,
  Calendar,
  Sparkles,
  RefreshCw,
  Type,
  Contrast,
  Volume2,
  Eye,
  Settings,
  UserCheck,
  ChevronRight
} from 'lucide-react';
import { 
  DoctorProfile, 
  PatientProfile, 
  PatientActivityPlan, 
  Reminder, 
  DevicePairingRequest, 
  GameSession, 
  Language,
  GameType,
  AccessibilitySettings
} from '../../types';
import { StorageService } from '../../services/storage';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { MOCK_PERFORMANCE_TRENDS } from '../../data/mockData';

interface DoctorDashboardProps {
  doctor: DoctorProfile;
  patients: PatientProfile[];
  activePatient: PatientProfile;
  onSelectPatient: (patientId: string) => void;
  language: Language;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  doctor,
  patients,
  activePatient,
  onSelectPatient,
  language
}) => {
  const [activeTab, setActiveTab] = useState<'regimen' | 'patients' | 'reminders' | 'telemetry' | 'devices' | 'accessibility'>('regimen');
  const [plan, setPlan] = useState<PatientActivityPlan>(() => StorageService.getActivityPlan(activePatient.id));
  const [reminders, setReminders] = useState<Reminder[]>(() => StorageService.getReminders());
  const [pendingRequests, setPendingRequests] = useState<DevicePairingRequest[]>(() => StorageService.getPairingRequests());
  const [linkedDevices, setLinkedDevices] = useState<DevicePairingRequest[]>(() => StorageService.getLinkedDevices());
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Per-Patient Accessibility State
  const [patientAccessibility, setPatientAccessibility] = useState<AccessibilitySettings>(() => 
    StorageService.getPatientAccessibility(activePatient.id)
  );
  const [patientLanguage, setPatientLanguage] = useState<Language>(activePatient.language);
  const [accessSavedSuccess, setAccessSavedSuccess] = useState(false);

  // New reminder modal state
  const [showAddReminderModal, setShowAddReminderModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('09:00 AM');
  const [newType, setNewType] = useState<'medicine' | 'hydration' | 'activity' | 'appointment'>('medicine');
  const [newNotes, setNewNotes] = useState('');

  // Reload data when active patient changes
  useEffect(() => {
    setPlan(StorageService.getActivityPlan(activePatient.id));
    setReminders(StorageService.getReminders().filter(r => r.patientId === activePatient.id));
    setPatientAccessibility(StorageService.getPatientAccessibility(activePatient.id));
    setPatientLanguage(activePatient.language);
  }, [activePatient.id]);

  // Listen to pairing updates
  useEffect(() => {
    const handlePairingUpdate = () => {
      setPendingRequests(StorageService.getPairingRequests());
      setLinkedDevices(StorageService.getLinkedDevices());
    };
    window.addEventListener('mindora-pairing-updated', handlePairingUpdate);
    return () => window.removeEventListener('mindora-pairing-updated', handlePairingUpdate);
  }, []);

  // Update game prescription in plan
  const handleToggleGame = (gameType: GameType) => {
    setPlan(prev => ({
      ...prev,
      activities: prev.activities.map(a => 
        a.gameType === gameType ? { ...a, enabled: !a.enabled } : a
      )
    }));
  };

  const handleUpdateRounds = (gameType: GameType, rounds: number) => {
    setPlan(prev => ({
      ...prev,
      activities: prev.activities.map(a => 
        a.gameType === gameType ? { ...a, rounds } : a
      )
    }));
  };

  const handleUpdateOrder = (gameType: GameType, order: number) => {
    setPlan(prev => ({
      ...prev,
      activities: prev.activities.map(a => 
        a.gameType === gameType ? { ...a, order } : a
      )
    }));
  };

  const handleUpdateNotes = (gameType: GameType, doctorNotes: string) => {
    setPlan(prev => ({
      ...prev,
      activities: prev.activities.map(a => 
        a.gameType === gameType ? { ...a, doctorNotes } : a
      )
    }));
  };

  const handleSavePlan = () => {
    const updatedPlan: PatientActivityPlan = {
      ...plan,
      lastUpdated: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    };
    StorageService.saveActivityPlan(updatedPlan);
    setPlan(updatedPlan);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Accessibility saving handler
  const handleSaveAccessibility = () => {
    StorageService.savePatientAccessibility(activePatient.id, patientAccessibility);
    // If language changed, update patient record
    if (patientLanguage !== activePatient.language) {
      const updated = { ...activePatient, language: patientLanguage, accessibility: patientAccessibility };
      StorageService.savePatient(updated);
      const all = StorageService.getAllPatients().map(p => p.id === activePatient.id ? updated : p);
      StorageService.saveAllPatients(all);
    }
    setAccessSavedSuccess(true);
    setTimeout(() => setAccessSavedSuccess(false), 3000);
  };

  // Device Pairing Handlers
  const handleApproveDevice = (requestId: string) => {
    StorageService.approveDevicePairingRequest(requestId, activePatient.id, doctor.name);
    setPendingRequests(StorageService.getPairingRequests());
    setLinkedDevices(StorageService.getLinkedDevices());
  };

  const handleRejectDevice = (requestId: string) => {
    StorageService.rejectDevicePairingRequest(requestId);
    setPendingRequests(StorageService.getPairingRequests());
  };

  const handleRevokeDevice = (deviceId: string) => {
    StorageService.revokeLinkedDevice(deviceId);
    setLinkedDevices(StorageService.getLinkedDevices());
  };

  // Reminder Management
  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newRem: Reminder = {
      id: `rem-doc-${Date.now()}`,
      patientId: activePatient.id,
      type: newType,
      title: newTitle,
      time: newTime,
      status: 'pending',
      notes: newNotes || 'Prescribed by Doctor'
    };

    const current = StorageService.getReminders();
    const updated = [newRem, ...current];
    StorageService.saveReminders(updated);
    setReminders(updated.filter(r => r.patientId === activePatient.id));
    setShowAddReminderModal(false);
    setNewTitle('');
    setNewNotes('');
  };

  const handleDeleteReminder = (id: string) => {
    const current = StorageService.getReminders();
    const updated = current.filter(r => r.id !== id);
    StorageService.saveReminders(updated);
    setReminders(updated.filter(r => r.patientId === activePatient.id));
  };

  const activeLinkedCount = linkedDevices.filter(d => d.patientId === activePatient.id).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* =========================================================================
            LEFT SIDEBAR: Doctor Profile, Patient Picker, & Vertical Navigation Tabs
           ========================================================================= */}
        <aside className="w-full lg:w-80 shrink-0 space-y-6">
          
          {/* Doctor Info Card */}
          <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs">
            <div className="flex items-center gap-3.5 pb-4 border-b border-stone-100">
              <div className="w-12 h-12 rounded-2xl bg-teal-600/10 border border-teal-600/20 flex items-center justify-center text-teal-800 text-xl font-bold shadow-xs shrink-0">
                <Stethoscope className="w-6 h-6 text-teal-700" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-extrabold text-stone-900 font-['Outfit'] truncate">
                  {doctor.name}
                </h2>
                <span className="inline-block text-[10px] font-bold text-teal-900 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full mt-0.5">
                  Neurologist & Clinical Lead
                </span>
              </div>
            </div>
            <p className="text-xs text-stone-500 mt-3 leading-relaxed">
              {doctor.hospital}
            </p>
          </div>

          {/* Patient Selector / Cohort Switcher */}
          <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-teal-600" />
                Select Patient ({patients.length})
              </span>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                Active Cohort
              </span>
            </div>

            <div className="space-y-2">
              {patients.map((p) => {
                const isSelected = p.id === activePatient.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => onSelectPatient(p.id)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50/80 border-teal-500 shadow-xs'
                        : 'bg-stone-50 border-stone-200/80 hover:bg-stone-100 hover:border-stone-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      isSelected 
                        ? 'bg-teal-700 text-white shadow-xs' 
                        : 'bg-stone-200 text-stone-700'
                    }`}>
                      {p.name.split(' ').map(n => n[0]).join('')}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-xs text-stone-900 truncate">
                          {p.name}
                        </h4>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 truncate mt-0.5">
                        {p.age}y • {p.stage || 'Cognitive Care'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Left Vertical Navigation Tabs */}
          <div className="bg-white border border-stone-200 rounded-3xl p-3 shadow-xs space-y-1">
            <span className="px-3 pt-2 pb-1 text-[11px] font-extrabold uppercase tracking-wider text-stone-400 block">
              Clinical Control Panel
            </span>

            <button
              id="tab-doctor-regimen"
              onClick={() => setActiveTab('regimen')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'regimen'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sliders className="w-4 h-4" />
                <span>Activity Regimen</span>
              </div>
              <ChevronRight className={`w-4 h-4 ${activeTab === 'regimen' ? 'text-white' : 'text-stone-400'}`} />
            </button>

            <button
              id="tab-doctor-reminders"
              onClick={() => setActiveTab('reminders')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'reminders'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4" />
                <span>Medical Reminders</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'reminders' ? 'bg-teal-700 text-white' : 'bg-stone-100 text-stone-600'
              }`}>
                {reminders.length}
              </span>
            </button>

            <button
              id="tab-doctor-devices"
              onClick={() => setActiveTab('devices')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'devices'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4" />
                <span>Device Pairing</span>
              </div>
              {pendingRequests.length > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500 text-white animate-pulse">
                  {pendingRequests.length}
                </span>
              )}
            </button>

            <button
              id="tab-doctor-accessibility"
              onClick={() => setActiveTab('accessibility')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'accessibility'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Type className="w-4 h-4" />
                <span>Patient Accessibility</span>
              </div>
              <ChevronRight className={`w-4 h-4 ${activeTab === 'accessibility' ? 'text-white' : 'text-stone-400'}`} />
            </button>

            <button
              id="tab-doctor-telemetry"
              onClick={() => setActiveTab('telemetry')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'telemetry'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4" />
                <span>Clinical Telemetry</span>
              </div>
              <ChevronRight className={`w-4 h-4 ${activeTab === 'telemetry' ? 'text-white' : 'text-stone-400'}`} />
            </button>

            <button
              id="tab-doctor-patients"
              onClick={() => setActiveTab('patients')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'patients'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span>Cohort Directory</span>
              </div>
              <ChevronRight className={`w-4 h-4 ${activeTab === 'patients' ? 'text-white' : 'text-stone-400'}`} />
            </button>
          </div>

        </aside>

        {/* =========================================================================
            RIGHT CONTAINER: Active Tab Content
           ========================================================================= */}
        <main className="flex-1 min-w-0 w-full space-y-6">
          
          {/* Active Patient Top Banner */}
          <div className="bg-white border border-stone-200 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-black text-base shadow-xs shrink-0">
                {activePatient.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-black text-stone-900 font-['Outfit']">
                    {activePatient.name}
                  </h2>
                  <span className="text-xs font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                    {activePatient.age} years • {activePatient.gender}
                  </span>
                  <span className="text-xs font-bold text-teal-900 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                    {activePatient.stage || 'Stage 2/3 MCI'}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Diagnosis: <strong className="text-stone-700">{activePatient.diagnosis || "Mild Cognitive Decline"}</strong> • Location: {activePatient.location}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${
                activeLinkedCount > 0
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-stone-50 text-stone-600 border-stone-200'
              }`}>
                <Smartphone className="w-3.5 h-3.5" />
                {activeLinkedCount > 0 ? `${activeLinkedCount} Screen Active` : 'No Screen Linked'}
              </span>
            </div>
          </div>

          {/* TAB 1: ACTIVITY PRESCRIPTION & REGIMEN */}
          {activeTab === 'regimen' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-stone-200 gap-4">
                  <div>
                    <h3 className="text-xl font-extrabold text-stone-900 font-['Outfit'] flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-teal-700" />
                      Prescribe Cognitive Regimen
                    </h3>
                    <p className="text-xs text-stone-500 mt-1">
                      Configure which exercises {activePatient.name} performs, their sequential order, and round counts.
                    </p>
                  </div>

                  <button
                    id="save-doctor-plan-btn"
                    onClick={handleSavePlan}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Regimen</span>
                  </button>
                </div>

                {savedSuccess && (
                  <div className="mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Prescription saved successfully! Patient screen will automatically update its daily path.</span>
                  </div>
                )}

                {/* Clinical Goal Directive */}
                <div className="mt-6 p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80">
                  <label className="text-xs font-bold text-teal-950 block mb-1.5">
                    Clinical Directive / Treatment Goal
                  </label>
                  <input
                    type="text"
                    value={plan.clinicalGoal || ''}
                    onChange={(e) => setPlan(prev => ({ ...prev, clinicalGoal: e.target.value }))}
                    placeholder="e.g. Focus on gentle visual recall; avoid fast timers to minimize anxiety."
                    className="w-full text-xs bg-white border border-teal-300 rounded-xl px-3 py-2 font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* 4 Activities Prescription Grid */}
                <div className="space-y-4 mt-6">
                  {plan.activities.map((act) => (
                    <div 
                      key={act.gameType}
                      className={`p-5 rounded-2xl border transition ${
                        act.enabled 
                          ? 'bg-white border-stone-200 shadow-xs' 
                          : 'bg-stone-50 border-stone-200 opacity-60'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        
                        {/* Title & Enable Toggle */}
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id={`toggle-${act.gameType}`}
                            checked={act.enabled}
                            onChange={() => handleToggleGame(act.gameType)}
                            className="w-5 h-5 rounded-lg text-teal-600 focus:ring-teal-500 cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-stone-900 text-sm">{act.title}</h4>
                              <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                                {act.targetFocus}
                              </span>
                            </div>
                            <span className="text-xs text-stone-500">
                              {act.enabled ? 'Active in patient daily path' : 'Excluded from regimen'}
                            </span>
                          </div>
                        </div>

                        {/* Order & Rounds Selection Controls */}
                        <div className="flex items-center gap-3 flex-wrap">
                          {/* Order Select */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-stone-600">Step:</span>
                            <select
                              value={act.order}
                              disabled={!act.enabled}
                              onChange={(e) => handleUpdateOrder(act.gameType, Number(e.target.value))}
                              className="text-xs font-bold bg-stone-100 border border-stone-300 rounded-xl px-2.5 py-1.5 focus:outline-none disabled:opacity-40"
                            >
                              <option value={1}>1st Step</option>
                              <option value={2}>2nd Step</option>
                              <option value={3}>3rd Step</option>
                              <option value={4}>4th Step</option>
                            </select>
                          </div>

                          {/* Rounds Count Select */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-stone-600">Rounds:</span>
                            <select
                              value={act.rounds}
                              disabled={!act.enabled}
                              onChange={(e) => handleUpdateRounds(act.gameType, Number(e.target.value))}
                              className="text-xs font-bold bg-teal-50 border border-teal-300 text-teal-900 rounded-xl px-2.5 py-1.5 focus:outline-none disabled:opacity-40"
                            >
                              <option value={3}>3 Rounds (Gentle)</option>
                              <option value={5}>5 Rounds (Standard)</option>
                              <option value={7}>7 Rounds (Deep Focus)</option>
                            </select>
                          </div>
                        </div>

                      </div>

                      {/* Doctor Notes for Caretaker & Patient Context */}
                      <div className="mt-3 pt-3 border-t border-stone-100">
                        <input
                          type="text"
                          value={act.doctorNotes || ''}
                          onChange={(e) => handleUpdateNotes(act.gameType, e.target.value)}
                          placeholder="Clinical note: e.g. Encourage verbalizing answers before tapping."
                          className="w-full text-xs text-stone-600 placeholder-stone-400 bg-stone-50/60 rounded-lg px-3 py-1.5 border border-stone-200 focus:outline-none focus:bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MEDICAL REMINDERS */}
          {activeTab === 'reminders' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
                <div className="flex items-center justify-between pb-6 border-b border-stone-200">
                  <div>
                    <h3 className="text-xl font-extrabold text-stone-900 font-['Outfit'] flex items-center gap-2">
                      <Bell className="w-5 h-5 text-teal-700" />
                      Prescribed Medical Reminders
                    </h3>
                    <p className="text-xs text-stone-500 mt-1">
                      Medication, hydration, and appointments scheduled for {activePatient.name}.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowAddReminderModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-700 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Reminder</span>
                  </button>
                </div>

                <div className="space-y-3 mt-6">
                  {reminders.map((r) => (
                    <div 
                      key={r.id}
                      className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-100/70 text-teal-800 flex items-center justify-center shrink-0">
                          {r.type === 'medicine' && <Pill className="w-5 h-5 text-rose-600" />}
                          {r.type === 'hydration' && <Droplet className="w-5 h-5 text-sky-600" />}
                          {r.type === 'activity' && <Activity className="w-5 h-5 text-emerald-600" />}
                          {r.type === 'appointment' && <Calendar className="w-5 h-5 text-amber-600" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-stone-900 text-sm">{r.title}</h4>
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-stone-200 text-stone-700 px-2 py-0.5 rounded-md">
                              {r.type}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 mt-0.5">
                            Scheduled: <span className="font-semibold text-stone-700">{r.time}</span> {r.notes && `• ${r.notes}`}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteReminder(r.id)}
                        className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Remove Reminder"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DEVICE PAIRING (WHATSAPP WEB STYLE) */}
          {activeTab === 'devices' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
                <div className="flex items-center justify-between pb-6 border-b border-stone-200">
                  <div className="flex items-center gap-2.5">
                    <Smartphone className="w-5 h-5 text-teal-700" />
                    <div>
                      <h3 className="text-xl font-extrabold text-stone-900 font-['Outfit']">
                        WhatsApp Web-Style Screen Authorization
                      </h3>
                      <p className="text-xs text-stone-500 mt-1">
                        Authorizing patient screens remotely eliminates password friction for {activePatient.name}.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pending Requests Section */}
                <div className="mt-6">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-800 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                    Incoming Pairing Requests ({pendingRequests.length})
                  </h4>

                  {pendingRequests.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 text-center text-xs text-stone-500">
                      No pending requests. When {activePatient.name}'s tablet or screen opens <code className="bg-stone-200 px-1 py-0.5 rounded">patient.mindora.app</code>, the authorization code will appear here.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingRequests.map((req) => (
                        <div 
                          key={req.id}
                          className="p-4 rounded-2xl bg-amber-50/70 border border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-black text-amber-950 font-mono tracking-wider bg-white px-3 py-1 rounded-xl border border-amber-200">
                                {req.pairCode}
                              </span>
                              <span className="font-bold text-stone-900 text-xs">{req.deviceName}</span>
                            </div>
                            <p className="text-xs text-stone-500 mt-1">
                              Client: {req.browserInfo} • Requested: {req.requestedAt}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRejectDevice(req.id)}
                              className="px-3.5 py-2 rounded-xl border border-stone-300 text-stone-600 font-bold text-xs hover:bg-stone-100 transition cursor-pointer"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleApproveDevice(req.id)}
                              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <Check className="w-4 h-4" />
                              <span>Approve & Link to {activePatient.name}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Currently Linked Devices */}
                <div className="mt-8 pt-6 border-t border-stone-200">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-700 mb-3 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Authorized Patient Screens
                  </h4>

                  <div className="space-y-3">
                    {linkedDevices.map((d) => (
                      <div 
                        key={d.id}
                        className="p-4 rounded-2xl bg-white border border-stone-200 flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-mono font-bold text-xs">
                            {d.pairCode}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-stone-900 text-xs">{d.deviceName}</h5>
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                Linked to {d.patientName || activePatient.name}
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-400 mt-0.5">
                              Approved by {d.approvedBy} at {d.approvedAt}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRevokeDevice(d.id)}
                          className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-50 transition cursor-pointer"
                        >
                          Revoke Access
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: ACCESSIBILITY & COMFORT SETTINGS (PER PATIENT) */}
          {activeTab === 'accessibility' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-stone-200 gap-4">
                  <div>
                    <h3 className="text-xl font-extrabold text-stone-900 font-['Outfit'] flex items-center gap-2">
                      <Type className="w-5 h-5 text-teal-700" />
                      Accessibility & Display Configuration
                    </h3>
                    <p className="text-xs text-stone-500 mt-1">
                      Configure high contrast, text size, and auditory guidance specifically for <strong>{activePatient.name}</strong> so the patient doesn't have to fiddle with settings.
                    </p>
                  </div>

                  <button
                    id="save-accessibility-btn"
                    onClick={handleSaveAccessibility}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save for {activePatient.name.split(' ')[0]}</span>
                  </button>
                </div>

                {accessSavedSuccess && (
                  <div className="mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Accessibility preferences saved! {activePatient.name}'s linked screen will automatically apply these settings.</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  
                  {/* Large Font Mode */}
                  <div className="p-5 rounded-2xl border border-stone-200 bg-stone-50 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Type className="w-5 h-5 text-teal-700" />
                        <h4 className="font-bold text-stone-900 text-sm">Large Text Display</h4>
                      </div>
                      <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                        Scales all game titles, instructions, and buttons to 22-26px for elderly visual ease.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={patientAccessibility.largeText}
                        onChange={(e) => setPatientAccessibility(prev => ({ ...prev, largeText: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
                  </div>

                  {/* High Contrast Mode */}
                  <div className="p-5 rounded-2xl border border-stone-200 bg-stone-50 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Contrast className="w-5 h-5 text-amber-700" />
                        <h4 className="font-bold text-stone-900 text-sm">High Contrast Theme</h4>
                      </div>
                      <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                        Applies rich deep contrast with dark background and warm yellow/amber highlights.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={patientAccessibility.highContrast}
                        onChange={(e) => setPatientAccessibility(prev => ({ ...prev, highContrast: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
                  </div>

                  {/* Spoken Audio Feedback */}
                  <div className="p-5 rounded-2xl border border-stone-200 bg-stone-50 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-5 h-5 text-sky-700" />
                        <h4 className="font-bold text-stone-900 text-sm">Auditory Narration</h4>
                      </div>
                      <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                        Reads aloud greetings, activity prompts, and reminder steps using gentle acoustic voices.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={patientAccessibility.audioFeedback}
                        onChange={(e) => setPatientAccessibility(prev => ({ ...prev, audioFeedback: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
                  </div>

                  {/* Reduce Motion */}
                  <div className="p-5 rounded-2xl border border-stone-200 bg-stone-50 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Eye className="w-5 h-5 text-indigo-700" />
                        <h4 className="font-bold text-stone-900 text-sm">Reduced Motion</h4>
                      </div>
                      <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                        Disables rapid sliding and parallax to protect vestibular stability and avoid disorientation.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={patientAccessibility.reduceMotion}
                        onChange={(e) => setPatientAccessibility(prev => ({ ...prev, reduceMotion: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
                  </div>

                </div>

                {/* Patient Primary Language Select */}
                <div className="mt-6 p-5 rounded-2xl border border-stone-200 bg-stone-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-stone-900 text-sm">Patient Primary Native Language</h4>
                    <p className="text-xs text-stone-500 mt-1">
                      Sets the default display and text-to-speech dialect for {activePatient.name}'s screen.
                    </p>
                  </div>

                  <select
                    value={patientLanguage}
                    onChange={(e) => setPatientLanguage(e.target.value as Language)}
                    className="bg-white border border-stone-300 text-stone-900 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value="as">অসমীয়া (Assamese)</option>
                    <option value="bn">বাংলা (Bengali)</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                    <option value="kn">ಕನ್ನಡ (Kannada)</option>
                    <option value="en">English (Universal)</option>
                  </select>
                </div>

              </div>
            </div>
          )}

          {/* TAB 5: CLINICAL TELEMETRY */}
          {activeTab === 'telemetry' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
                <div className="pb-6 border-b border-stone-200">
                  <h3 className="text-xl font-extrabold text-stone-900 font-['Outfit'] flex items-center gap-2">
                    <Activity className="w-5 h-5 text-teal-700" />
                    Cognitive Performance & Pacing Trends
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    7-Day rolling accuracy and response speed telemetry for {activePatient.name}.
                  </p>
                </div>

                <div className="h-72 w-full mt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={MOCK_PERFORMANCE_TRENDS}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="day" tick={{ fill: '#6B7280', fontSize: 12 }} />
                      <YAxis yAxisId="left" domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 12 }} />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 10]} tick={{ fill: '#6B7280', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#111827', 
                          color: '#fff', 
                          borderRadius: '12px', 
                          border: 'none',
                          fontSize: '12px'
                        }} 
                      />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="accuracy" 
                        stroke="#0D9488" 
                        strokeWidth={3} 
                        dot={{ fill: '#0D9488', r: 4 }}
                        name="Accuracy %" 
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="responseTime" 
                        stroke="#F59E0B" 
                        strokeWidth={2} 
                        strokeDasharray="4 4"
                        dot={{ fill: '#F59E0B', r: 3 }}
                        name="Pacing (sec)" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PATIENT DIRECTORY */}
          {activeTab === 'patients' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
                <div className="pb-6 border-b border-stone-200">
                  <h3 className="text-xl font-extrabold text-stone-900 font-['Outfit'] flex items-center gap-2">
                    <Users className="w-5 h-5 text-teal-700" />
                    Patient Cohort Directory
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    All dementia patients under Dr. Debojit Sarma's clinical care.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  {patients.map((p) => {
                    const isSelected = p.id === activePatient.id;
                    return (
                      <div
                        key={p.id}
                        className={`p-5 rounded-3xl border transition ${
                          isSelected
                            ? 'bg-teal-50/70 border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                            : 'bg-stone-50 border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-900 flex items-center justify-center font-black text-sm mb-3">
                          {p.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <h4 className="font-extrabold text-stone-900 text-base">{p.name}</h4>
                        <span className="text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full inline-block mt-1">
                          {p.stage || 'MCI'}
                        </span>
                        <p className="text-xs text-stone-500 mt-2">
                          {p.age} years • {p.gender} • {p.location}
                        </p>
                        <p className="text-xs text-stone-600 mt-1">
                          Diagnosis: <strong>{p.diagnosis || "Early Cognitive Decline"}</strong>
                        </p>

                        <button
                          onClick={() => onSelectPatient(p.id)}
                          className={`w-full mt-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                            isSelected
                              ? 'bg-teal-700 text-white'
                              : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          {isSelected ? 'Active Subject' : 'Select Patient'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </main>

      </div>

      {/* Modal: Add Doctor Reminder */}
      {showAddReminderModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <h4 className="font-extrabold text-stone-900 font-['Outfit'] text-lg">
                Prescribe Reminder for {activePatient.name}
              </h4>
              <button
                onClick={() => setShowAddReminderModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReminder} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Reminder Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Donepezil 5mg or Afternoon Hydration"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-sm border border-stone-300 rounded-xl px-3 py-2 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Time</label>
                  <input
                    type="text"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full text-sm border border-stone-300 rounded-xl px-3 py-2 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Category</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full text-sm border border-stone-300 rounded-xl px-3 py-2 focus:outline-none focus:border-teal-500 bg-white"
                  >
                    <option value="medicine">Medicine</option>
                    <option value="hydration">Hydration</option>
                    <option value="activity">Activity</option>
                    <option value="appointment">Appointment</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Clinical Notes / Dosage</label>
                <input
                  type="text"
                  placeholder="e.g. Take with warm water after lunch"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full text-sm border border-stone-300 rounded-xl px-3 py-2 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddReminderModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-600 text-xs font-bold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
