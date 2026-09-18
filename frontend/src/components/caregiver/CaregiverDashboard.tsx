import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar 
} from 'recharts';
import { 
  ShieldCheck, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  RefreshCw, 
  Sparkles, 
  User, 
  Calendar, 
  Activity, 
  FileText, 
  Wifi, 
  WifiOff, 
  HelpCircle,
  Pill,
  Droplet,
  Heart,
  Smartphone,
  Sliders,
  Check,
  Type,
  Contrast,
  Volume2,
  Eye,
  ChevronRight,
  Users,
  Save
} from 'lucide-react';
import { 
  PatientProfile, 
  CaregiverProfile, 
  GameSession, 
  Reminder, 
  AlertItem, 
  Language,
  AccessibilitySettings 
} from '../../types';
import { StorageService } from '../../services/storage';
import { GeminiClientService, CaregiverAiSummary } from '../../services/geminiClient';
import { MOCK_PERFORMANCE_TRENDS } from '../../data/mockData';
import { getTranslation } from '../../utils/translations';

interface CaregiverDashboardProps {
  patient: PatientProfile;
  caregiver: CaregiverProfile;
  sessions: GameSession[];
  reminders: Reminder[];
  alerts: AlertItem[];
  isOffline: boolean;
  onToggleReminder: (id: string) => void;
  onAddReminder: (reminder: Partial<Reminder>) => void;
  onSync: () => void;
  isSyncing: boolean;
  language: Language;
  patients?: PatientProfile[];
  onSelectPatient?: (patientId: string) => void;
}

export const CaregiverDashboard: React.FC<CaregiverDashboardProps> = ({
  patient,
  caregiver,
  sessions,
  reminders,
  alerts,
  isOffline,
  onToggleReminder,
  onAddReminder,
  onSync,
  isSyncing,
  language,
  patients = [],
  onSelectPatient
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'history' | 'reminders' | 'adaptive' | 'devices' | 'regimen' | 'accessibility'>('overview');
  const [aiSummary, setAiSummary] = useState<CaregiverAiSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showAddReminderModal, setShowAddReminderModal] = useState(false);
  const [pendingPairRequests, setPendingPairRequests] = useState(() => StorageService.getPairingRequests());
  const [linkedDevices, setLinkedDevices] = useState(() => StorageService.getLinkedDevices());
  const doctorPlan = StorageService.getActivityPlan(patient.id);

  // Per-Patient Accessibility State
  const [patientAccessibility, setPatientAccessibility] = useState<AccessibilitySettings>(() => 
    StorageService.getPatientAccessibility(patient.id)
  );
  const [patientLanguage, setPatientLanguage] = useState<Language>(patient.language);
  const [accessSavedSuccess, setAccessSavedSuccess] = useState(false);

  useEffect(() => {
    setPatientAccessibility(StorageService.getPatientAccessibility(patient.id));
    setPatientLanguage(patient.language);
  }, [patient.id]);

  // Handle saving patient accessibility
  const handleSaveAccessibility = () => {
    StorageService.savePatientAccessibility(patient.id, patientAccessibility);
    if (patientLanguage !== patient.language) {
      const updated = { ...patient, language: patientLanguage, accessibility: patientAccessibility };
      StorageService.savePatient(updated);
      const all = StorageService.getAllPatients().map(p => p.id === patient.id ? updated : p);
      StorageService.saveAllPatients(all);
    }
    setAccessSavedSuccess(true);
    setTimeout(() => setAccessSavedSuccess(false), 3000);
  };

  // New reminder form state
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('14:00');
  const [newType, setNewType] = useState<'medicine' | 'hydration' | 'activity' | 'appointment'>('medicine');
  const [newNotes, setNewNotes] = useState('');

  // Handle device approval
  const handleApprovePairing = (requestId: string) => {
    StorageService.approveDevicePairingRequest(requestId, patient.id, caregiver.name);
    setPendingPairRequests(StorageService.getPairingRequests());
    setLinkedDevices(StorageService.getLinkedDevices());
  };

  const handleRejectPairing = (requestId: string) => {
    StorageService.rejectDevicePairingRequest(requestId);
    setPendingPairRequests(StorageService.getPairingRequests());
  };

  const handleRevokeDevice = (deviceId: string) => {
    StorageService.revokeLinkedDevice(deviceId);
    setLinkedDevices(StorageService.getLinkedDevices());
  };

  const getReminderTitle = (r: Reminder) => {
    if (language === 'as' && r.titleAssamese) return r.titleAssamese;
    if (language === 'hi' && r.titleHindi) return r.titleHindi;
    if (language === 'bn' && r.titleBengali) return r.titleBengali;
    if (language === 'kn' && r.titleKannada) return r.titleKannada;
    return r.title;
  };

  const getReminderNotes = (r: Reminder) => {
    if (language === 'as' && r.notesAssamese) return r.notesAssamese;
    if (language === 'hi' && r.notesHindi) return r.notesHindi;
    if (language === 'bn' && r.notesBengali) return r.notesBengali;
    if (language === 'kn' && r.notesKannada) return r.notesKannada;
    return r.notes || '';
  };

  const handleGenerateSummary = async () => {
    setLoadingSummary(true);
    try {
      const summary = await GeminiClientService.getCaregiverSummary();
      setAiSummary(summary);
    } catch {
      // handled
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddReminder({
      title: newTitle,
      time: newTime,
      type: newType,
      notes: newNotes,
      status: 'pending'
    });

    setNewTitle('');
    setNewNotes('');
    setShowAddReminderModal(false);
  };

  const pendingSyncSessions = sessions.filter(s => !s.synced);
  const latestSession = sessions[0];
  const adaptiveStates = StorageService.getAdaptiveStates();
  const activeLinkedScreens = linkedDevices.filter(d => d.patientId === patient.id).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* =========================================================================
            LEFT SIDEBAR: Caregiver Info, Patient Picker, & Vertical Navigation Tabs
           ========================================================================= */}
        <aside className="w-full lg:w-80 shrink-0 space-y-6">
          
          {/* Caregiver Info Card */}
          <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs">
            <div className="flex items-center gap-3.5 pb-4 border-b border-stone-100">
              <div className="w-12 h-12 rounded-2xl bg-amber-600/10 border border-amber-600/20 flex items-center justify-center text-amber-800 text-xl font-bold shadow-xs shrink-0">
                <ShieldCheck className="w-6 h-6 text-amber-700" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-extrabold text-stone-900 font-['Outfit'] truncate">
                  {caregiver.name}
                </h2>
                <span className="inline-block text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full mt-0.5">
                  {caregiver.relation}
                </span>
              </div>
            </div>
            <p className="text-xs text-stone-500 mt-3 leading-relaxed">
              Contact: {caregiver.phone}
            </p>
          </div>

          {/* Patient Selector / Cohort Switcher */}
          {patients.length > 0 && onSelectPatient && (
            <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-600" />
                  Select Patient ({patients.length})
                </span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                  Active Patient
                </span>
              </div>

              <div className="space-y-2">
                {patients.map((p) => {
                  const isSelected = p.id === patient.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => onSelectPatient(p.id)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-amber-50/80 border-amber-500 shadow-xs'
                          : 'bg-stone-50 border-stone-200/80 hover:bg-stone-100 hover:border-stone-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected 
                          ? 'bg-amber-600 text-white shadow-xs' 
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
                            <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0" />
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
          )}

          {/* Left Vertical Navigation Tabs */}
          <div className="bg-white border border-stone-200 rounded-3xl p-3 shadow-xs space-y-1">
            <span className="px-3 pt-2 pb-1 text-[11px] font-extrabold uppercase tracking-wider text-stone-400 block">
              Caregiver Navigation
            </span>

            <button
              id="tab-overview"
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4" />
                <span>Daily Routine & Overview</span>
              </div>
              <ChevronRight className={`w-4 h-4 ${activeTab === 'overview' ? 'text-white' : 'text-stone-400'}`} />
            </button>

            <button
              id="tab-reminders"
              onClick={() => setActiveTab('reminders')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'reminders'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4" />
                <span>Daily Reminders</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'reminders' ? 'bg-amber-700 text-white' : 'bg-stone-100 text-stone-600'
              }`}>
                {reminders.length}
              </span>
            </button>

            <button
              id="tab-trends"
              onClick={() => setActiveTab('trends')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'trends'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4" />
                <span>7-Day Trends</span>
              </div>
              <ChevronRight className={`w-4 h-4 ${activeTab === 'trends' ? 'text-white' : 'text-stone-400'}`} />
            </button>

            <button
              id="tab-history"
              onClick={() => setActiveTab('history')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4" />
                <span>Activity History</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'history' ? 'bg-amber-700 text-white' : 'bg-stone-100 text-stone-600'
              }`}>
                {sessions.length}
              </span>
            </button>

            <button
              id="tab-devices"
              onClick={() => setActiveTab('devices')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'devices'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4" />
                <span>Device Pairing</span>
              </div>
              {pendingPairRequests.length > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500 text-white animate-pulse">
                  {pendingPairRequests.length}
                </span>
              )}
            </button>

            <button
              id="tab-regimen"
              onClick={() => setActiveTab('regimen')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'regimen'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sliders className="w-4 h-4" />
                <span>Doctor's Regimen</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-teal-50 text-teal-800 border border-teal-200">
                Dr. Plan
              </span>
            </button>

            <button
              id="tab-adaptive"
              onClick={() => setActiveTab('adaptive')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'adaptive'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4" />
                <span>Adaptive Rules</span>
              </div>
              <ChevronRight className={`w-4 h-4 ${activeTab === 'adaptive' ? 'text-white' : 'text-stone-400'}`} />
            </button>

            <button
              id="tab-accessibility"
              onClick={() => setActiveTab('accessibility')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'accessibility'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Type className="w-4 h-4" />
                <span>Patient Accessibility</span>
              </div>
              <ChevronRight className={`w-4 h-4 ${activeTab === 'accessibility' ? 'text-white' : 'text-stone-400'}`} />
            </button>
          </div>

        </aside>

        {/* =========================================================================
            RIGHT CONTAINER: Active Tab Content
           ========================================================================= */}
        <main className="flex-1 min-w-0 w-full space-y-6">
          
          {/* Active Patient Top Banner & Cloud Sync */}
          <div className="bg-white border border-stone-200 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-black text-base shadow-xs shrink-0">
                {patient.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-black text-stone-900 font-['Outfit']">
                    {patient.name}
                  </h2>
                  <span className="text-xs font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                    {patient.age}y • {patient.location}
                  </span>
                  <span className="text-xs font-bold text-teal-900 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                    {patient.stage || 'Stage 3 MCI'}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Assigned Clinician: <strong className="text-stone-700">Dr. Debojit Sarma</strong> • Primary Dialect: <span className="uppercase font-semibold">{patient.language}</span>
                </p>
              </div>
            </div>

            {/* Sync & Screen Status */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${
                activeLinkedScreens > 0
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-stone-50 text-stone-600 border-stone-200'
              }`}>
                <Smartphone className="w-3.5 h-3.5" />
                {activeLinkedScreens > 0 ? `${activeLinkedScreens} Screen Active` : 'No Screen Linked'}
              </span>

              {isOffline ? (
                <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-1.5">
                  <WifiOff className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                  <span>Offline ({pendingSyncSessions.length} queued)</span>
                </div>
              ) : (
                <button
                  onClick={onSync}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{pendingSyncSessions.length > 0 ? `Sync ${pendingSyncSessions.length}` : 'Synced'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
              <span className="text-xs font-medium text-stone-500">Activities Completed</span>
              <div className="text-2xl font-black text-stone-900 mt-1">{sessions.length}</div>
              <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">
                Prescribed by Doctor
              </span>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
              <span className="text-xs font-medium text-stone-500">Average Accuracy</span>
              <div className="text-2xl font-black text-stone-900 mt-1">
                {sessions.length > 0 ? Math.round(sessions.reduce((acc, s) => acc + s.accuracy, 0) / sessions.length) : 88}%
              </div>
              <span className="text-[11px] text-stone-500 font-medium mt-0.5 block">
                Steady cognitive pacing
              </span>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
              <span className="text-xs font-medium text-stone-500">Active Reminders</span>
              <div className="text-2xl font-black text-amber-700 mt-1">{reminders.length}</div>
              <span className="text-[11px] text-amber-800 font-medium mt-0.5 block">
                Meds & Hydration
              </span>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
              <span className="text-xs font-medium text-stone-500">Comfort & Engagement</span>
              <div className="text-2xl font-black text-emerald-700 mt-1">High</div>
              <span className="text-[11px] text-emerald-800 font-medium mt-0.5 block">
                Calm and reassured
              </span>
            </div>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* AI Daily Briefing */}
              <div className="bg-gradient-to-r from-amber-500/10 via-amber-100/30 to-stone-50 border border-amber-200 rounded-3xl p-6 shadow-xs">
                <div className="flex items-center justify-between pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                    <h3 className="font-extrabold text-stone-900 font-['Outfit'] text-base">
                      AI Caregiver Daily Briefing for {patient.name}
                    </h3>
                  </div>

                  <button
                    onClick={handleGenerateSummary}
                    disabled={loadingSummary}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingSummary ? 'animate-spin' : ''}`} />
                    <span>{loadingSummary ? 'Analyzing...' : 'Generate New Briefing'}</span>
                  </button>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed mt-2">
                  {aiSummary 
                    ? aiSummary.summary 
                    : `${patient.name} completed today's visual activities with steady focus and good patience. Morning medications are logged as pending.`}
                </p>
              </div>

              {/* Routine Checklist */}
              <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                  <h3 className="font-extrabold text-stone-900 font-['Outfit'] text-base flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-700" />
                    Today's Care Routine & Schedule
                  </h3>
                  <button
                    onClick={() => setShowAddReminderModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Reminder</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  {reminders.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => onToggleReminder(r.id)}
                      className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                        r.status === 'completed'
                          ? 'bg-emerald-50/60 border-emerald-200'
                          : 'bg-stone-50 border-stone-200 hover:bg-stone-100/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          r.status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-stone-200 text-stone-700'
                        }`}>
                          {r.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        </div>
                        <div>
                          <h4 className={`text-xs font-bold ${r.status === 'completed' ? 'line-through text-stone-500' : 'text-stone-900'}`}>
                            {getReminderTitle(r)}
                          </h4>
                          <span className="text-[11px] text-stone-500 font-medium">
                            {r.time} • {r.type}
                          </span>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        r.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                      }`}>
                        {r.status === 'completed' ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 7-DAY TRENDS */}
          {activeTab === 'trends' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
                <div className="pb-6 border-b border-stone-200">
                  <h3 className="text-xl font-extrabold text-stone-900 font-['Outfit'] flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-700" />
                    7-Day Cognitive Performance & Response Trends
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    Daily engagement accuracy and speed metrics for {patient.name}.
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
                        stroke="#D97706" 
                        strokeWidth={3} 
                        dot={{ fill: '#D97706', r: 4 }}
                        name="Accuracy %" 
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="responseTime" 
                        stroke="#059669" 
                        strokeWidth={2} 
                        strokeDasharray="4 4"
                        dot={{ fill: '#059669', r: 3 }}
                        name="Response Time (s)" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACTIVITY HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
                <div className="pb-6 border-b border-stone-200">
                  <h3 className="text-xl font-extrabold text-stone-900 font-['Outfit'] flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-700" />
                    Completed Game Sessions Log
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    Every cognitive warmup session completed by {patient.name}.
                  </p>
                </div>

                <div className="space-y-3 mt-6">
                  {sessions.map((s) => (
                    <div 
                      key={s.id}
                      className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-stone-900 text-sm">{s.gameTitle}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {s.accuracy}% Accuracy
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 mt-1">
                          Score: {s.score} • Pacing: {s.responseTime}s • Difficulty: Level {s.difficulty}
                        </p>
                      </div>
                      <span className="text-xs text-stone-400 font-medium">
                        {s.dateFormatted}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: REMINDERS */}
          {activeTab === 'reminders' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
                <div className="flex items-center justify-between pb-6 border-b border-stone-200">
                  <div>
                    <h3 className="text-xl font-extrabold text-stone-900 font-['Outfit'] flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-amber-700" />
                      Manage Scheduled Reminders
                    </h3>
                    <p className="text-xs text-stone-500 mt-1">
                      Medication, hydration, and daily care tasks for {patient.name}.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddReminderModal(true)}
                    className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 shadow-xs flex items-center gap-1.5 cursor-pointer"
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
                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                          {r.type === 'medicine' ? <Pill className="w-5 h-5 text-rose-600" /> : <Droplet className="w-5 h-5 text-sky-600" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-stone-900 text-sm">{getReminderTitle(r)}</h4>
                            <span className="text-[10px] font-bold uppercase bg-stone-200 text-stone-700 px-2 py-0.5 rounded-md">
                              {r.type}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 mt-0.5">
                            Time: <strong>{r.time}</strong> {r.notes && `• ${getReminderNotes(r)}`}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => onToggleReminder(r.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          r.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                        }`}
                      >
                        {r.status === 'completed' ? 'Completed' : 'Mark Done'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ADAPTIVE ENGINE RULES */}
          {activeTab === 'adaptive' && (
            <div className="space-y-6">
              <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs">
                <h3 className="text-lg font-bold text-stone-900 font-['Outfit'] mb-2">
                  Deterministic Adaptive Difficulty Rules
                </h3>
                <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-6">
                  MINDORA calculates rolling averages across recent activities to gently adjust levels without startling the patient.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 block mb-1">
                      Promotion Threshold
                    </span>
                    <div className="text-xl font-black text-emerald-800 mb-1">Rolling Avg ≥ 85%</div>
                    <p className="text-xs text-emerald-950 leading-relaxed">
                      Advances to next difficulty level (e.g. 4 to 5 cards) when ready.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-stone-100 border border-stone-200">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                      Comfort Zone
                    </span>
                    <div className="text-xl font-black text-stone-900 mb-1">56% to 84% Range</div>
                    <p className="text-xs text-stone-700 leading-relaxed">
                      Maintains current comfort level to build confidence without anxiety.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block mb-1">
                      Gentle Relief Threshold
                    </span>
                    <div className="text-xl font-black text-amber-800 mb-1">Rolling Avg ≤ 55%</div>
                    <p className="text-xs text-amber-950 leading-relaxed">
                      Gently eases difficulty to prevent frustration or cognitive fatigue.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: DEVICE PAIRING */}
          {activeTab === 'devices' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                  <div className="flex items-center gap-2.5">
                    <Smartphone className="w-5 h-5 text-amber-700" />
                    <h2 className="text-xl font-extrabold text-stone-900 font-['Outfit']">
                      Patient Screen Pairing Requests
                    </h2>
                  </div>
                  <span className="text-xs font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                    {pendingPairRequests.length} Pending Approval
                  </span>
                </div>

                <p className="text-xs text-stone-500 mt-2 mb-6">
                  When {patient.name} opens Mindora on a screen or tablet, approve it with one tap below.
                </p>

                {pendingPairRequests.length === 0 ? (
                  <div className="py-10 text-center text-stone-400 text-sm">
                    No incoming connection requests. All screens are currently connected.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingPairRequests.map(req => (
                      <div
                        key={req.id}
                        className="p-4 sm:p-5 rounded-2xl border-2 border-amber-300 bg-amber-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-black text-amber-900 font-mono tracking-wider bg-white px-2.5 py-0.5 rounded-md border border-amber-200">
                              {req.pairCode}
                            </span>
                            <span className="text-xs font-bold text-stone-800">
                              {req.deviceName}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 mt-1">
                            {req.browserInfo} • Requested {req.requestedAt}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRejectPairing(req.id)}
                            className="px-3 py-1.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-bold transition cursor-pointer"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleApprovePairing(req.id)}
                            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            <span>Approve Screen</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: DOCTOR'S PRESCRIBED REGIMEN */}
          {activeTab === 'regimen' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                  <div>
                    <h2 className="text-xl font-extrabold text-stone-900 font-['Outfit']">
                      Doctor's Prescribed Regimen for {patient.name}
                    </h2>
                    <p className="text-xs text-stone-500 mt-1">
                      Prescribed by {doctorPlan.doctorName} (Last updated: {doctorPlan.lastUpdated})
                    </p>
                  </div>
                  <span className="text-xs font-bold text-teal-900 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                    Doctor Controlled
                  </span>
                </div>

                {doctorPlan.clinicalGoal && (
                  <div className="my-4 p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80 text-xs text-teal-950 font-medium">
                    <strong>Clinical Directive:</strong> {doctorPlan.clinicalGoal}
                  </div>
                )}

                <div className="space-y-3 mt-4">
                  {doctorPlan.activities
                    .sort((a, b) => a.order - b.order)
                    .map((act) => (
                      <div
                        key={act.gameType}
                        className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                          act.enabled
                            ? 'bg-white border-stone-200'
                            : 'bg-stone-50 border-stone-200 opacity-60'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded-md">
                              Step {act.order}
                            </span>
                            <h4 className="font-bold text-stone-900 text-sm">{act.title}</h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              act.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                            }`}>
                              {act.enabled ? `${act.rounds} Rounds Active` : 'Disabled by Doctor'}
                            </span>
                          </div>
                          {act.doctorNotes && (
                            <p className="text-xs text-stone-500 mt-1 italic">
                              Doctor note: "{act.doctorNotes}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: ACCESSIBILITY & DISPLAY SETTINGS (PER PATIENT) */}
          {activeTab === 'accessibility' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-stone-200 gap-4">
                  <div>
                    <h3 className="text-xl font-extrabold text-stone-900 font-['Outfit'] flex items-center gap-2">
                      <Type className="w-5 h-5 text-amber-700" />
                      Accessibility & Comfort Settings
                    </h3>
                    <p className="text-xs text-stone-500 mt-1">
                      Configure display preferences for <strong>{patient.name}</strong> so the patient enjoys a seamless experience without needing to adjust settings herself.
                    </p>
                  </div>

                  <button
                    id="save-caregiver-access-btn"
                    onClick={handleSaveAccessibility}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save for {patient.name.split(' ')[0]}</span>
                  </button>
                </div>

                {accessSavedSuccess && (
                  <div className="mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Preferences saved! {patient.name}'s screen will immediately adopt these settings.</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {/* Large Font Mode */}
                  <div className="p-5 rounded-2xl border border-stone-200 bg-stone-50 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Type className="w-5 h-5 text-amber-700" />
                        <h4 className="font-bold text-stone-900 text-sm">Large Text Mode</h4>
                      </div>
                      <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                        Enlarges fonts across exercises, cards, and daily reminders for easier reading.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={patientAccessibility.largeText}
                        onChange={(e) => setPatientAccessibility(prev => ({ ...prev, largeText: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
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
                        Deep contrast theme with dark background and vibrant amber buttons.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={patientAccessibility.highContrast}
                        onChange={(e) => setPatientAccessibility(prev => ({ ...prev, highContrast: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>

                  {/* Spoken Audio Feedback */}
                  <div className="p-5 rounded-2xl border border-stone-200 bg-stone-50 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-5 h-5 text-sky-700" />
                        <h4 className="font-bold text-stone-900 text-sm">Auditory Speech & Chimes</h4>
                      </div>
                      <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                        Speaks daily greetings and celebration affirmations aloud with gentle chimes.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={patientAccessibility.audioFeedback}
                        onChange={(e) => setPatientAccessibility(prev => ({ ...prev, audioFeedback: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>

                  {/* Reduced Motion */}
                  <div className="p-5 rounded-2xl border border-stone-200 bg-stone-50 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Eye className="w-5 h-5 text-indigo-700" />
                        <h4 className="font-bold text-stone-900 text-sm">Reduced Motion</h4>
                      </div>
                      <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                        Softens card transitions and minimizes visual motion to prevent disorientation.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={patientAccessibility.reduceMotion}
                        onChange={(e) => setPatientAccessibility(prev => ({ ...prev, reduceMotion: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>
                </div>

                {/* Primary Language */}
                <div className="mt-6 p-5 rounded-2xl border border-stone-200 bg-stone-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-stone-900 text-sm">Patient's Preferred Native Language</h4>
                    <p className="text-xs text-stone-500 mt-1">
                      Sets the language for {patient.name}'s guided exercises and voice assistant.
                    </p>
                  </div>

                  <select
                    value={patientLanguage}
                    onChange={(e) => setPatientLanguage(e.target.value as Language)}
                    className="bg-white border border-stone-300 text-stone-900 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
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

        </main>

      </div>

      {/* Modal: Add Reminder */}
      {showAddReminderModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95">
            <h4 className="font-extrabold text-stone-900 font-['Outfit'] text-lg mb-4">
              Add New Reminder for {patient.name}
            </h4>

            <form onSubmit={handleCreateReminder} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Afternoon Hydration or Blood Pressure Check"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-sm border border-stone-300 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
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
                    className="w-full text-sm border border-stone-300 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Category</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full text-sm border border-stone-300 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 bg-white"
                  >
                    <option value="medicine">Medicine</option>
                    <option value="hydration">Hydration</option>
                    <option value="activity">Activity</option>
                    <option value="appointment">Appointment</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 1 glass of fresh water with lemon"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full text-sm border border-stone-300 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddReminderModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-600 text-xs font-bold hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer"
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
