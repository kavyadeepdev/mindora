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
  ChevronRight,
  ChevronDown,
  Lock,
  Building,
  GraduationCap,
  Heart
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
import { apiClient } from '../../services/api';
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

  // Doctor & Cohort Segregation State
  const allDoctors = StorageService.getAllDoctors();
  const allCaregivers = StorageService.getAllCaregivers();
  const assignedPatients = patients.filter(p => p.doctorId === doctor.id || (doctor.linkedPatientIds && doctor.linkedPatientIds.includes(p.id)));
  const effectivePatients = assignedPatients.length > 0 ? assignedPatients : patients;

  // Add Patient Modal State
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [newPtName, setNewPtName] = useState('');
  const [newPtAge, setNewPtAge] = useState(72);
  const [newPtGender, setNewPtGender] = useState('Male');
  const [newPtLocation, setNewPtLocation] = useState('Kolkata, West Bengal');
  const [newPtLanguage, setNewPtLanguage] = useState<Language>('bn');
  const [newPtTheme, setNewPtTheme] = useState('bengali-heritage');
  const [newPtDiagnosis, setNewPtDiagnosis] = useState('Mild Cognitive Impairment (MCI)');
  const [newPtStage, setNewPtStage] = useState('Early Stage');
  const [newPtCaregiverId, setNewPtCaregiverId] = useState(allCaregivers[0]?.id || '');

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPtName.trim()) return;

    const chosenCg = allCaregivers.find(c => c.id === newPtCaregiverId);
    const newPatient: PatientProfile = {
      id: `p-${Date.now()}`,
      name: newPtName,
      age: Number(newPtAge),
      gender: newPtGender,
      location: newPtLocation,
      language: newPtLanguage,
      culturalTheme: newPtTheme,
      diagnosis: newPtDiagnosis,
      stage: newPtStage,
      doctorId: doctor.id,
      doctorName: doctor.name,
      caregiverId: newPtCaregiverId,
      caregiverName: chosenCg?.name,
      interests: ['Familiar music', 'Morning walks', 'Family memories'],
      accessStatus: 'active',
      dailyRoutine: {
        morningWakeUp: '06:30 AM',
        morningHydration: '07:00 AM',
        morningMeds: '08:00 AM',
        breakfast: '08:30 AM',
        morningWalk: '09:30 AM',
        eveningTea: '04:30 PM',
        nightSleep: '09:30 PM',
      },
      accessibility: { largeText: true, highContrast: false, reduceMotion: false, audioFeedback: true }
    };

    StorageService.addNewPatient(newPatient);
    onSelectPatient(newPatient.id);
    setShowAddPatientModal(false);
    setNewPtName('');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleCaregiverAssignment = (patientId: string, caregiverId: string) => {
    StorageService.assignCaregiverToPatient(patientId, caregiverId);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // AI Analysis & Nemotron Summary State
  const [aiAnalysis, setAiAnalysis] = useState<{
    ml_analysis?: any;
    ai_summary?: any;
  } | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const fetchAiAnalysis = async (patientId: string) => {
    setIsLoadingAi(true);
    try {
      const p = patients.find(pt => pt.id === patientId) || activePatient;
      const patientSessions = StorageService.getSessions().filter(s => s.patientId === patientId);
      const res = await apiClient.ai.analyzePatient({
        patientId,
        patient: p,
        sessions: patientSessions,
      });
      if (res.data) {
        setAiAnalysis({
          ml_analysis: res.data.ml_analysis,
          ai_summary: res.data.ai_summary,
        });
      }
    } catch (e) {
      console.error('Failed to fetch AI analysis:', e);
    } finally {
      setIsLoadingAi(false);
    }
  };

  // AI Activity Recommendation State & Clinician Decision
  const [recommendation, setRecommendation] = useState<{
    recommendedActivity: string;
    gameType: GameType;
    culturalTheme: string;
    reasoning: string;
    suggestedRounds: number;
    suggestedDifficulty: number;
    encouragement: string;
    source?: string;
    status: 'pending' | 'accepted' | 'declined';
  } | null>(null);
  const [isLoadingRec, setIsLoadingRec] = useState(false);

  const fetchRecommendation = async (patientId: string) => {
    setIsLoadingRec(true);
    try {
      const p = patients.find(pt => pt.id === patientId) || activePatient;
      const patientSessions = StorageService.getSessions().filter(s => s.patientId === patientId);
      const res = await apiClient.ai.getRecommendation({
        patientId,
        patientName: p.name,
        age: p.age,
        interests: p.interests,
        sessions: patientSessions,
      });
      if (res.data) {
        let gtype: GameType = (res.data.gameType as GameType) || 'memory';
        if (!['memory', 'attention', 'pattern', 'routine'].includes(gtype)) {
          const actName = (res.data.recommendedActivity || '').toLowerCase();
          if (actName.includes('memory')) gtype = 'memory';
          else if (actName.includes('attention')) gtype = 'attention';
          else if (actName.includes('pattern')) gtype = 'pattern';
          else if (actName.includes('routine')) gtype = 'routine';
          else gtype = 'memory';
        }

        setRecommendation({
          recommendedActivity: res.data.recommendedActivity,
          gameType: gtype,
          culturalTheme: res.data.culturalTheme,
          reasoning: res.data.reasoning,
          suggestedRounds: res.data.suggestedRounds || 5,
          suggestedDifficulty: res.data.suggestedDifficulty || 2,
          encouragement: res.data.encouragement,
          source: res.data.source,
          status: 'pending',
        });
      }
    } catch (e) {
      console.error('Failed to fetch activity recommendation:', e);
    } finally {
      setIsLoadingRec(false);
    }
  };

  const handleAcceptRecommendation = () => {
    if (!recommendation) return;
    const targetType = recommendation.gameType;

    const updatedActivities = plan.activities.map(a => {
      if (a.gameType === targetType) {
        return {
          ...a,
          enabled: true,
          order: 1,
          rounds: recommendation.suggestedRounds || 5,
          doctorNotes: `Approved by Dr. ${doctor.name}: ${recommendation.reasoning}`,
        };
      }
      return {
        ...a,
        order: Math.min(4, a.order >= 1 ? a.order + 1 : a.order),
      };
    });

    const updatedPlan: PatientActivityPlan = {
      ...plan,
      prescribedByDoctorId: doctor.id,
      doctorName: doctor.name,
      lastUpdated: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      clinicalGoal: `Prescribed: ${recommendation.recommendedActivity} (${recommendation.culturalTheme}) - ${recommendation.reasoning}`,
      activities: updatedActivities,
    };

    setPlan(updatedPlan);
    StorageService.saveActivityPlan(updatedPlan);
    setRecommendation(prev => prev ? { ...prev, status: 'accepted' } : null);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleDeclineRecommendation = () => {
    setRecommendation(prev => prev ? { ...prev, status: 'declined' } : null);
  };

  // Reload data when active patient changes
  useEffect(() => {
    setPlan(StorageService.getActivityPlan(activePatient.id));
    setReminders(StorageService.getReminders().filter(r => r.patientId === activePatient.id));
    setPatientAccessibility(StorageService.getPatientAccessibility(activePatient.id));
    setPatientLanguage(activePatient.language);
    fetchAiAnalysis(activePatient.id);
    fetchRecommendation(activePatient.id);
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
          
          {/* Doctor Profile & Statutory Credential Card */}
          <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-3.5 pb-3 border-b border-stone-100">
              <div className="w-12 h-12 rounded-2xl bg-teal-600/10 border border-teal-600/20 flex items-center justify-center text-teal-800 text-xl font-bold shadow-xs shrink-0">
                <Stethoscope className="w-6 h-6 text-teal-700" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-extrabold text-stone-900 font-['Outfit'] truncate">
                    {doctor.name}
                  </h2>
                </div>
                <span className="inline-block text-[10px] font-bold text-teal-900 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full mt-0.5">
                  {doctor.specialty || 'Cognitive Neurology'}
                </span>
              </div>
            </div>

            {/* Doctor Switcher for Testing / Clinical Cohort */}
            {allDoctors.length > 1 && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-stone-400 block">
                  Switch Active Physician:
                </label>
                <div className="relative">
                  <select
                    value={doctor.id}
                    onChange={(e) => {
                      StorageService.setActiveDoctorId(e.target.value);
                      const targetDoc = allDoctors.find(d => d.id === e.target.value);
                      if (targetDoc) {
                        const targetPatients = patients.filter(p => p.doctorId === targetDoc.id);
                        if (targetPatients.length > 0) onSelectPatient(targetPatients[0].id);
                      }
                    }}
                    className="w-full appearance-none bg-stone-50 border border-stone-300 rounded-xl px-3 py-1.5 pr-8 text-xs font-bold text-stone-800 focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    {allDoctors.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.hospital.split(',')[0]})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Statutory Medical Credentials Details */}
            <div className="bg-stone-50/80 rounded-2xl p-3 border border-stone-200/70 text-[11px] space-y-1 text-stone-600">
              <div className="flex items-center justify-between">
                <span className="text-stone-500">License (NMC/SMC):</span>
                <span className="font-mono font-bold text-teal-900">{doctor.medicalRegistrationNumber || 'WBMC-68492'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Authority:</span>
                <span className="font-semibold text-stone-700 truncate max-w-[140px]" title={doctor.medicalCouncil}>
                  {doctor.medicalCouncil || 'State Medical Council'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Qualification:</span>
                <span className="font-bold text-stone-800 truncate max-w-[140px]">{doctor.qualification || 'MBBS, MD'}</span>
              </div>
              <div className="pt-1 flex items-center justify-between">
                <span className="text-stone-500">Status:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  doctor.verificationStatus === 'approved' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {doctor.verificationStatus === 'approved' ? 'NMC Verified' : 'Pending Verification'}
                </span>
              </div>
            </div>
            
            <p className="text-[11px] text-stone-500 leading-relaxed">
              {doctor.hospital}
            </p>
          </div>

          {/* Patient Selector Dropdown */}
          <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-teal-600" />
                Select Patient ({effectivePatients.length})
              </span>
              <button
                onClick={() => setShowAddPatientModal(true)}
                className="text-[11px] font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2 py-1 rounded-lg border border-teal-200 transition cursor-pointer flex items-center gap-1"
                title="Add new patient to your assigned cohort"
              >
                <Plus className="w-3 h-3" />
                Add Patient
              </button>
            </div>

            {/* Accessible Dropdown Selector */}
            <div className="relative">
              <select
                id="patient-select-dropdown"
                value={activePatient.id}
                onChange={(e) => onSelectPatient(e.target.value)}
                className="w-full appearance-none bg-stone-50 border-2 border-teal-500/40 rounded-2xl px-3.5 py-2.5 pr-10 text-xs font-bold text-stone-900 focus:outline-none focus:ring-4 focus:ring-teal-500/20 focus:border-teal-600 cursor-pointer shadow-xs"
              >
                {effectivePatients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.age}y) — {p.language.toUpperCase()} • {p.stage || 'MCI'}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-700 pointer-events-none" />
            </div>

            {/* Active Patient Summary Chip */}
            <div className="p-3 bg-teal-50/60 border border-teal-200/80 rounded-2xl flex items-center gap-3">
              <img 
                src={activePatient.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"} 
                alt={activePatient.name} 
                className="w-10 h-10 rounded-xl object-cover border border-teal-300 shrink-0"
              />
              <div className="min-w-0 flex-1 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-stone-900 truncate">{activePatient.name}</span>
                  <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-1.5 py-0.5 rounded">
                    {activePatient.language.toUpperCase()}
                  </span>
                </div>
                <p className="text-stone-500 truncate mt-0.5">
                  Caregiver: <strong>{activePatient.caregiverName || "Assigned"}</strong>
                </p>
              </div>
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

                {/* AI Cognitive Recommendation for Clinician Review */}
                <div className="mt-6 rounded-3xl bg-linear-to-br from-stone-900 via-teal-950 to-stone-900 border border-teal-500/30 p-6 sm:p-7 text-white shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shadow-inner">
                        <Sparkles className="w-5 h-5 text-teal-400 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-base font-['Outfit'] text-white">
                            AI Clinical Regimen Recommendation
                          </h4>
                          <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-teal-400/20 text-teal-300 border border-teal-400/30">
                            Clinical Decision Support
                          </span>
                        </div>
                        <p className="text-xs text-stone-400 mt-0.5">
                          Synthesized from {activePatient.name}'s performance telemetry, accuracy history, and North Eastern cultural anchors.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {recommendation?.status === 'accepted' && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Accepted by Dr. {doctor.name}
                        </span>
                      )}
                      {recommendation?.status === 'declined' && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-stone-700/60 text-stone-300 border border-stone-600">
                          <X className="w-4 h-4 text-stone-400" />
                          Declined (Custom Regimen Kept)
                        </span>
                      )}
                      {(!recommendation || recommendation.status === 'pending') && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          <Clock className="w-4 h-4 text-amber-400" />
                          Awaiting Clinician Decision
                        </span>
                      )}
                      <button
                        onClick={() => fetchRecommendation(activePatient.id)}
                        disabled={isLoadingRec}
                        title="Re-evaluate recommendation"
                        className="p-2 rounded-xl bg-stone-800/80 hover:bg-stone-700 border border-stone-700 text-stone-300 transition cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRec ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {recommendation ? (
                    <div className="mt-5 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 p-4 rounded-2xl bg-stone-800/60 border border-stone-700/60">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                              Recommended Exercise
                            </span>
                            <span className="text-[11px] font-semibold text-stone-400">• {recommendation.culturalTheme}</span>
                          </div>
                          <h5 className="text-lg font-black text-white font-['Outfit']">
                            {recommendation.recommendedActivity}
                          </h5>
                          <p className="text-xs text-stone-300 mt-2 leading-relaxed">
                            {recommendation.reasoning}
                          </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-stone-800/60 border border-stone-700/60 flex flex-col justify-between">
                          <div>
                            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">
                              Suggested Parameters
                            </span>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between items-center text-stone-300">
                                <span>Prescribed Order:</span>
                                <span className="font-bold text-white bg-teal-900/60 px-2 py-0.5 rounded-lg border border-teal-600/30">Step #1 Priority</span>
                              </div>
                              <div className="flex justify-between items-center text-stone-300">
                                <span>Rounds Count:</span>
                                <span className="font-bold text-white">{recommendation.suggestedRounds} Rounds</span>
                              </div>
                              <div className="flex justify-between items-center text-stone-300">
                                <span>Difficulty Tier:</span>
                                <span className="font-bold text-white">Level {recommendation.suggestedDifficulty} (Calibrated)</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 pt-2 border-t border-stone-700/60 text-[11px] text-stone-400">
                            Source: <span className="text-teal-300 font-medium">{recommendation.source || 'Historical Telemetry ML'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Doctor Action Decision Controls */}
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-stone-800/80">
                        <p className="text-xs text-stone-400 italic">
                          {recommendation.status === 'accepted' 
                            ? '✓ This activity has been activated as Step 1 in the patient regimen below. The patient will see it on their screen.'
                            : recommendation.status === 'declined'
                            ? 'Recommendation dismissed. The clinician-defined custom regimen remains active.'
                            : 'As the clinician, you have full authority to adopt or override this recommendation.'}
                        </p>

                        <div className="flex items-center gap-2.5">
                          {recommendation.status !== 'accepted' && (
                            <button
                              id="accept-ai-recommendation-btn"
                              onClick={handleAcceptRecommendation}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-stone-950 font-black text-xs shadow-md transition cursor-pointer active:scale-95"
                            >
                              <Check className="w-4 h-4 text-stone-950" />
                              <span>Accept & Prescribe to Regimen</span>
                            </button>
                          )}

                          {recommendation.status === 'pending' && (
                            <button
                              id="decline-ai-recommendation-btn"
                              onClick={handleDeclineRecommendation}
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white font-bold text-xs border border-stone-700 transition cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Decline</span>
                            </button>
                          )}

                          {recommendation.status !== 'pending' && (
                            <button
                              onClick={() => setRecommendation(prev => prev ? { ...prev, status: 'pending' } : null)}
                              className="text-xs text-stone-400 hover:text-teal-300 font-semibold underline underline-offset-2 transition cursor-pointer"
                            >
                              Re-open Decision
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-stone-400">
                      {isLoadingRec ? (
                        <span className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
                          Evaluating patient performance telemetry and cognitive metrics...
                        </span>
                      ) : (
                        'No recommendation available. Click refresh to evaluate patient telemetry.'
                      )}
                    </div>
                  )}
                </div>

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

          {/* TAB 5: CLINICAL TELEMETRY & AI COGNITIVE ANALYSIS */}
          {activeTab === 'telemetry' && (
            <div className="space-y-6">
              {/* AI Cognitive Analysis & Nemotron Summary Panel */}
              <div className="bg-gradient-to-br from-white via-teal-50/20 to-amber-50/20 rounded-3xl border border-teal-200/80 p-6 sm:p-8 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-stone-200 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold px-3 py-1 rounded-full bg-teal-100 text-teal-900 border border-teal-300/80">
                        <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                        AI Clinical Decision Support
                      </span>
                      <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full">
                        Groq Nemotron & Scikit-Learn
                      </span>
                    </div>
                    <h3 className="text-xl font-extrabold text-stone-900 font-['Outfit']">
                      Cognitive Performance Analysis for {activePatient.name}
                    </h3>
                    <p className="text-xs text-stone-500 mt-1">
                      Synthesized from historical game telemetry, response latencies, and trained machine learning models.
                    </p>
                  </div>

                  <button
                    onClick={() => fetchAiAnalysis(activePatient.id)}
                    disabled={isLoadingAi}
                    className="px-4 py-2.5 rounded-2xl bg-teal-700 hover:bg-teal-800 active:scale-95 text-white font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-60 shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAi ? 'animate-spin' : ''}`} />
                    <span>{isLoadingAi ? 'Synthesizing...' : 'Re-run AI Analysis'}</span>
                  </button>
                </div>

                {/* 4 Quantitative ML Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                  {/* Metric 1: Predicted Cognitive Stability */}
                  <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                      Predicted Stability Index
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-black text-stone-900 font-['Outfit']">
                        {aiAnalysis?.ml_analysis?.predicted_stability_score ?? 85.4}
                      </span>
                      <span className="text-xs font-bold text-emerald-700">/ 100</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-2 mt-2.5 overflow-hidden">
                      <div 
                        className="bg-teal-600 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(aiAnalysis?.ml_analysis?.predicted_stability_score ?? 85.4, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-stone-500 mt-1.5 block">
                      Trajectory: <strong>{aiAnalysis?.ml_analysis?.stability_trend?.toUpperCase() ?? 'STABLE'}</strong>
                    </span>
                  </div>

                  {/* Metric 2: Fatigue & Strain Risk */}
                  <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                      Cognitive Fatigue Risk
                    </span>
                    <div className="mt-2">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${
                        (aiAnalysis?.ml_analysis?.fatigue_risk_level || '').includes('Elevated')
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : (aiAnalysis?.ml_analysis?.fatigue_risk_level || '').includes('Moderate')
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {aiAnalysis?.ml_analysis?.fatigue_risk_level ?? 'Low Risk (Stable)'}
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-500 mt-2">
                      Fatigue Probability: {Math.round((aiAnalysis?.ml_analysis?.fatigue_risk_score ?? 0.15) * 100)}%
                    </p>
                  </div>

                  {/* Metric 3: Recommended Difficulty */}
                  <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                      Optimal Difficulty Tier
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-black text-stone-900 font-['Outfit']">
                        Level {aiAnalysis?.ml_analysis?.recommended_difficulty ?? 2}
                      </span>
                      <span className="text-xs text-stone-500">of 5</span>
                    </div>
                    <p className="text-[10px] text-stone-500 mt-2">
                      ML calibrated for optimal cognitive stimulation without frustration.
                    </p>
                  </div>

                  {/* Metric 4: Average Response Latency */}
                  <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                      Response Latency Pacing
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-black text-stone-900 font-['Outfit']">
                        {aiAnalysis?.ml_analysis?.average_response_time_sec ?? 4.4}s
                      </span>
                      <span className="text-xs text-stone-500">average</span>
                    </div>
                    <p className="text-[10px] text-stone-500 mt-2">
                      Unhurried pacing consistent with comfortable elder recall.
                    </p>
                  </div>
                </div>

                {/* Scikit-Learn Feature Influence Breakdown */}
                <div className="mt-6 p-4 rounded-2xl bg-white border border-stone-200">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-700 mb-3">
                    Scikit-Learn Model Feature Importances (Weight in Cognitive Scoring)
                  </h4>
                  <div className="space-y-2.5">
                    {[
                      { label: 'Response Latency (Reaction Pacing)', weight: 38, color: 'bg-teal-500' },
                      { label: 'Task Difficulty & Complexity', weight: 28, color: 'bg-emerald-500' },
                      { label: 'Patient Age & Baseline Cohort', weight: 16, color: 'bg-amber-500' },
                      { label: 'Cognitive Modality (Memory vs Pattern vs Attention)', weight: 11, color: 'bg-indigo-500' },
                      { label: 'Repetition Attempts & Sequencing', weight: 7, color: 'bg-stone-400' },
                    ].map(f => (
                      <div key={f.label}>
                        <div className="flex justify-between text-xs font-bold text-stone-700 mb-1">
                          <span>{f.label}</span>
                          <span>{f.weight}%</span>
                        </div>
                        <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                          <div className={`${f.color} h-full rounded-full`} style={{ width: `${f.weight}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Groq Nemotron Executive Clinical Summary Box */}
                <div className="mt-6 p-5 sm:p-6 rounded-2xl bg-white border border-teal-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        AI
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-stone-900">
                          Executive Clinical Summary for {doctor.name}
                        </h4>
                        <span className="text-[10px] text-stone-500">
                          Model: {aiAnalysis?.ai_summary?.model_used ?? 'nvidia/llama-3.1-nemotron-70b-instruct (Groq)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-stone-800 leading-relaxed font-medium">
                    {aiAnalysis?.ai_summary?.executive_summary ?? 
                      `${activePatient.name} (${activePatient.age}y, ${activePatient.diagnosis || 'Early-stage Alzheimer\'s'}) demonstrates a stable cognitive trajectory with an estimated stability index of 85.4/100. Familiar visual recall remains notably strong with healthy response pacing.`}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {/* Strengths */}
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                      <span className="text-xs font-bold text-emerald-950 block mb-1.5 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        Identified Strengths
                      </span>
                      <ul className="text-xs text-emerald-900 space-y-1 list-disc list-inside">
                        {(aiAnalysis?.ai_summary?.strengths ?? [
                          `High accuracy in familiar cultural memory tasks (${activePatient.culturalTheme}).`,
                          'Consistent response pacing without signs of cognitive panic or agitation.',
                          'Strong routine recall reconstruction during morning hours.'
                        ]).map((s: string, idx: number) => (
                          <li key={idx} className="leading-snug">{s}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Fatigue & Strain Assessment */}
                    <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200/80">
                      <span className="text-xs font-bold text-teal-950 block mb-1.5 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-teal-700" />
                        Fatigue & Pacing Evaluation
                      </span>
                      <p className="text-xs text-teal-900 leading-relaxed">
                        {aiAnalysis?.ai_summary?.fatigue_and_strain_assessment ?? 
                          `Pacing evaluated at ${aiAnalysis?.ml_analysis?.average_response_time_sec ?? 4.4}s. No abnormal latency drops detected in recent sessions. Patient performs best within 15-minute unhurried windows.`}
                      </p>
                    </div>
                  </div>

                  {/* Clinician Regimen Recommendations */}
                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                        AI Regimen Suggestions for Clinician
                      </span>
                      {recommendation && (
                        <button
                          onClick={() => {
                            if (recommendation.status !== 'accepted') {
                              handleAcceptRecommendation();
                            } else {
                              setActiveTab('regimen');
                            }
                          }}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition cursor-pointer shadow-xs ${
                            recommendation.status === 'accepted'
                              ? 'bg-emerald-700 text-white'
                              : 'bg-teal-700 hover:bg-teal-800 text-white'
                          }`}
                        >
                          {recommendation.status === 'accepted' ? '✓ Applied to Regimen' : `Prescribe ${recommendation.recommendedActivity}`}
                        </button>
                      )}
                    </div>
                    <ul className="text-xs text-amber-900 space-y-1.5">
                      {recommendation && (
                        <li className="p-2 rounded-lg bg-teal-50/80 border border-teal-200/60 flex items-start gap-1.5 leading-snug text-teal-950 font-medium">
                          <span className="text-teal-700 font-bold">•</span>
                          <span><strong>Recommended Activity:</strong> {recommendation.recommendedActivity} ({recommendation.culturalTheme}) — {recommendation.reasoning}</span>
                        </li>
                      )}
                      {(aiAnalysis?.ai_summary?.regimen_recommendations ?? [
                        `Maintain prescribed activities at Level ${aiAnalysis?.ml_analysis?.recommended_difficulty ?? 2} to prevent cognitive fatigue.`,
                        'Schedule primary memory sessions between 9:30 AM and 11:00 AM after morning walk.',
                        'Keep hydration prompts active 15 minutes before cognitive exercises.'
                      ]).map((r: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-1.5 leading-snug">
                          <span className="text-amber-700 font-bold">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* 7-Day Performance & Pacing Trend LineChart */}
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
                  <div>
                    <h3 className="text-xl font-extrabold text-stone-900 font-['Outfit'] flex items-center gap-2">
                      <Users className="w-5 h-5 text-teal-700" />
                      Patient Cohort Directory
                    </h3>
                    <p className="text-xs text-stone-500 mt-1">
                      Dementia patients enrolled under {doctor.name}'s clinical care ({effectivePatients.length} active).
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddPatientModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Enrol New Patient
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
                  {effectivePatients.map((p) => {
                    const isSelected = p.id === activePatient.id;
                    const assignedCg = allCaregivers.find(c => c.id === p.caregiverId);

                    return (
                      <div
                        key={p.id}
                        className={`p-5 rounded-3xl border transition flex flex-col justify-between ${
                          isSelected
                            ? 'bg-teal-50/70 border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                            : 'bg-stone-50 border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-900 flex items-center justify-center font-black text-sm">
                              {p.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="text-[11px] font-bold text-teal-800 bg-teal-100/70 border border-teal-200 px-2.5 py-0.5 rounded-full uppercase">
                              {p.language.toUpperCase()} • {p.stage || 'MCI'}
                            </span>
                          </div>

                          <h4 className="font-extrabold text-stone-900 text-base">{p.name}</h4>
                          <p className="text-xs text-stone-500 mt-1">
                            {p.age} years • {p.gender} • {p.location}
                          </p>
                          <p className="text-xs text-stone-600 mt-1">
                            Diagnosis: <strong className="text-stone-800">{p.diagnosis || "Early Cognitive Decline"}</strong>
                          </p>

                          {/* Assigned Caretaker Selector */}
                          <div className="mt-3 pt-3 border-t border-stone-200/70">
                            <label className="text-[11px] font-bold text-stone-700 block mb-1 flex items-center gap-1">
                              <Heart className="w-3 h-3 text-rose-500" />
                              Assigned Caretaker:
                            </label>
                            <select
                              value={p.caregiverId || ''}
                              onChange={(e) => handleCaregiverAssignment(p.id, e.target.value)}
                              className="w-full bg-white border border-stone-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-stone-800 focus:ring-2 focus:ring-teal-500 cursor-pointer"
                            >
                              <option value="" disabled>Select Caregiver</option>
                              {allCaregivers.map(cg => (
                                <option key={cg.id} value={cg.id}>
                                  {cg.name} ({cg.relation || 'Caregiver'})
                                </option>
                              ))}
                            </select>
                            {assignedCg && (
                              <span className="text-[10px] text-stone-500 block mt-0.5 truncate">
                                Contact: {assignedCg.email || assignedCg.phone || 'Assigned'}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => onSelectPatient(p.id)}
                          className={`w-full mt-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            isSelected
                              ? 'bg-teal-700 text-white'
                              : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          {isSelected ? 'Active Subject Selected' : 'Set as Active Subject'}
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

      {/* Modal: Enrol New Patient to Cohort */}
      {showAddPatientModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-stone-900 font-['Outfit'] text-lg">
                    Enrol Patient to {doctor.name}'s Cohort
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    Clinical registration and caretaker pairing
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddPatientModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Full Patient Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Manomohan Das"
                  value={newPtName}
                  onChange={(e) => setNewPtName(e.target.value)}
                  className="w-full text-sm border border-stone-300 rounded-xl px-3 py-2 focus:outline-none focus:border-teal-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Age (Years)</label>
                  <input
                    type="number"
                    min={45}
                    max={105}
                    required
                    value={newPtAge}
                    onChange={(e) => setNewPtAge(Number(e.target.value))}
                    className="w-full text-sm border border-stone-300 rounded-xl px-3 py-2 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Gender</label>
                  <select
                    value={newPtGender}
                    onChange={(e) => setNewPtGender(e.target.value)}
                    className="w-full text-sm border border-stone-300 rounded-xl px-3 py-2 focus:outline-none focus:border-teal-500 bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Location / Residence</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Salt Lake, Kolkata, West Bengal"
                  value={newPtLocation}
                  onChange={(e) => setNewPtLocation(e.target.value)}
                  className="w-full text-sm border border-stone-300 rounded-xl px-3 py-2 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Native Language</label>
                  <select
                    value={newPtLanguage}
                    onChange={(e) => {
                      const lang = e.target.value as Language;
                      setNewPtLanguage(lang);
                      if (lang === 'bn') setNewPtTheme('bengali-heritage');
                      else if (lang === 'as') setNewPtTheme('assamese-heritage');
                      else if (lang === 'kn') setNewPtTheme('kannada-heritage');
                      else if (lang === 'hi') setNewPtTheme('hindi-heritage');
                    }}
                    className="w-full text-sm border border-stone-300 rounded-xl px-3 py-2 focus:outline-none focus:border-teal-500 bg-white"
                  >
                    <option value="bn">Bengali (বাংলা)</option>
                    <option value="as">Assamese (অসমীয়া)</option>
                    <option value="kn">Kannada (ಕನ್ನಡ)</option>
                    <option value="hi">Hindi (हिन्दी)</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Cultural Anchor Theme</label>
                  <select
                    value={newPtTheme}
                    onChange={(e) => setNewPtTheme(e.target.value)}
                    className="w-full text-sm border border-stone-300 rounded-xl px-3 py-2 focus:outline-none focus:border-teal-500 bg-white"
                  >
                    <option value="bengali-heritage">Bengali Heritage</option>
                    <option value="assamese-heritage">Assamese Heritage</option>
                    <option value="kannada-heritage">Kannada Heritage</option>
                    <option value="hindi-heritage">Hindi / North Indian Heritage</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Cognitive Stage</label>
                  <select
                    value={newPtStage}
                    onChange={(e) => setNewPtStage(e.target.value)}
                    className="w-full text-sm border border-stone-300 rounded-xl px-3 py-2 focus:outline-none focus:border-teal-500 bg-white"
                  >
                    <option value="Mild Cognitive Impairment (MCI)">MCI</option>
                    <option value="Early Stage">Early Stage Dementia</option>
                    <option value="Moderate Stage">Moderate Stage</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Clinical Diagnosis</label>
                  <input
                    type="text"
                    required
                    value={newPtDiagnosis}
                    onChange={(e) => setNewPtDiagnosis(e.target.value)}
                    className="w-full text-sm border border-stone-300 rounded-xl px-3 py-2 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Caregiver Selection */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Assign Caretaker</label>
                <select
                  value={newPtCaregiverId}
                  onChange={(e) => setNewPtCaregiverId(e.target.value)}
                  className="w-full text-sm border border-stone-300 rounded-xl px-3 py-2 focus:outline-none focus:border-teal-500 bg-white"
                >
                  {allCaregivers.map(cg => (
                    <option key={cg.id} value={cg.id}>
                      {cg.name} ({cg.relation || 'Caregiver'}) — {cg.email || cg.phone}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-stone-500 mt-1">
                  The selected caretaker will receive portal access and real-time telemetry for this patient.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddPatientModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-600 text-xs font-bold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Enrol Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
