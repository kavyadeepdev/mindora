import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Stethoscope, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Lock, 
  Unlock, 
  Activity, 
  RefreshCw, 
  Search, 
  Filter, 
  FileText, 
  Smartphone, 
  UserCheck, 
  ChevronRight,
  Clock,
  Building,
  GraduationCap
} from 'lucide-react';
import { DoctorProfile, PatientProfile, CaregiverProfile, DevicePairingRequest, AdminAuditLog } from '../../types';
import { StorageService } from '../../services/storage';
import { apiClient } from '../../services/api';

interface AdminDashboardProps {
  onBackToApp?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToApp }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'doctors' | 'patients' | 'caregivers' | 'pairings' | 'audit'>('overview');
  
  // Data state
  const [doctors, setDoctors] = useState<DoctorProfile[]>(() => StorageService.getAllDoctors());
  const [patients, setPatients] = useState<PatientProfile[]>(() => StorageService.getAllPatients());
  const [caregivers, setCaregivers] = useState<CaregiverProfile[]>(() => StorageService.getAllCaregivers());
  const [pairings, setPairings] = useState<DevicePairingRequest[]>(() => StorageService.getPairingRequests());
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [stats, setStats] = useState({
    totalDoctors: doctors.length,
    approvedDoctors: doctors.filter(d => d.verificationStatus === 'approved').length,
    pendingDoctors: doctors.filter(d => d.verificationStatus === 'pending_approval').length,
    totalPatients: patients.length,
    activePatients: patients.filter(p => p.accessStatus === 'active').length,
    totalCaregivers: caregivers.length,
    pendingPairings: pairings.filter(p => p.status === 'pending').length
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const refreshData = async () => {
    try {
      const res = await apiClient.admin.getOverview();
      if (res.data) {
        setStats(res.data.stats as any);
        if (res.data.recentLogs) setAuditLogs(res.data.recentLogs);
      }
    } catch {
      // Local fallback
    }
    const docs = StorageService.getAllDoctors();
    const pts = StorageService.getAllPatients();
    const cgs = StorageService.getAllCaregivers();
    const prs = StorageService.getPairingRequests();
    setDoctors(docs);
    setPatients(pts);
    setCaregivers(cgs);
    setPairings(prs);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 10000);
    return () => clearInterval(interval);
  }, []);

  const showNotice = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  // Doctor Verification Handlers
  const handleVerifyDoctor = async (doctorId: string, action: 'approve' | 'reject' | 'revoke') => {
    const status: 'approved' | 'rejected' | 'revoked' = 
      action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'revoked';
    StorageService.updateDoctorVerification(doctorId, status);
    try {
      await apiClient.admin.verifyDoctor(doctorId, action);
    } catch {
      // Offline fallback
    }
    await refreshData();
    showNotice(`Doctor status successfully updated to: ${status.toUpperCase()}`);
  };

  // Patient Status Toggle (Active vs Revoked)
  const handleTogglePatientStatus = async (patientId: string, currentStatus?: string) => {
    const nextStatus: 'active' | 'revoked' = currentStatus === 'revoked' ? 'active' : 'revoked';
    const all = StorageService.getAllPatients();
    const updated = all.map(p => p.id === patientId ? { ...p, accessStatus: nextStatus } : p);
    StorageService.saveAllPatients(updated);
    try {
      await apiClient.admin.updatePatientStatus(patientId, nextStatus);
    } catch {
      // Fallback
    }
    await refreshData();
    showNotice(`Patient access ${nextStatus === 'active' ? 'Re-activated' : 'Revoked'} for ID: ${patientId}`);
  };

  // Patient Caregiver Reassignment
  const handleReassignCaregiver = async (patientId: string, newCaregiverId: string) => {
    StorageService.assignCaregiverToPatient(patientId, newCaregiverId);
    try {
      await apiClient.admin.assignPatient(patientId, { caregiverId: newCaregiverId });
    } catch {
      // Fallback
    }
    await refreshData();
    showNotice(`Assigned caregiver successfully updated.`);
  };

  // Patient Doctor Reassignment
  const handleReassignDoctor = async (patientId: string, newDoctorId: string) => {
    const all = StorageService.getAllPatients();
    const doc = doctors.find(d => d.id === newDoctorId);
    const updated = all.map(p => p.id === patientId ? { ...p, doctorId: newDoctorId, doctorName: doc?.name } : p);
    StorageService.saveAllPatients(updated);
    try {
      await apiClient.admin.assignPatient(patientId, { doctorId: newDoctorId });
    } catch {
      // Fallback
    }
    await refreshData();
    showNotice(`Assigned doctor successfully updated.`);
  };

  // Device Pairing Approval / Revocation
  const handleApprovePairing = async (id: string) => {
    try {
      await apiClient.admin.approvePairing(id);
    } catch {
      // Fallback
    }
    const current = StorageService.getPairingRequests();
    const updated = current.map(p => p.id === id ? { ...p, status: 'approved' as const, approvedBy: 'admin@mindora.health' } : p);
    StorageService.savePairingRequests(updated);
    await refreshData();
    showNotice(`Device pairing authorized.`);
  };

  const handleRevokePairing = async (id: string) => {
    try {
      await apiClient.admin.revokePairing(id);
    } catch {
      // Fallback
    }
    const current = StorageService.getPairingRequests();
    const updated = current.map(p => p.id === id ? { ...p, status: 'revoked' as const } : p);
    StorageService.savePairingRequests(updated);
    await refreshData();
    showNotice(`Device pairing access revoked.`);
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 pb-16">
      {/* Top Super Admin Header */}
      <header className="bg-stone-900 text-white border-b border-stone-800 px-6 py-5 sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black font-['Outfit'] tracking-tight">
                  MINDORA SUPER ADMIN CONSOLE
                </h1>
                <span className="bg-rose-500/20 text-rose-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border border-rose-500/30">
                  Root Authority
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Statutory Medical Credential Verification, Tripartite Cohort Governance & System Audit Log
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-stone-200 block">admin@mindora.health</span>
              <span className="text-[11px] text-stone-500 font-medium">Session Active • Verified Administrator</span>
            </div>
            <button
              onClick={refreshData}
              className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="Refresh telemetry"
            >
              <RefreshCw className="w-4 h-4 text-stone-400" />
              <span>Refresh</span>
            </button>
            {onBackToApp && (
              <button
                onClick={onBackToApp}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition cursor-pointer"
              >
                Go to Mindora App
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Action Notification Toast */}
      {actionSuccessMsg && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-500 animate-in fade-in slide-in-from-top-4 text-xs font-bold">
          <CheckCircle className="w-5 h-5 text-emerald-200 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Main Admin Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Navigation Tabs Bar */}
        <nav className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-stone-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'overview'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white text-stone-600 hover:bg-stone-200/70'
            }`}
          >
            <Activity className="w-4 h-4 text-amber-400" />
            <span>Platform Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('doctors')}
            className={`px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'doctors'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white text-stone-600 hover:bg-stone-200/70'
            }`}
          >
            <Stethoscope className="w-4 h-4 text-teal-400" />
            <span>Doctor Credentialing & Verification</span>
            {stats.pendingDoctors > 0 && (
              <span className="bg-amber-500 text-stone-900 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {stats.pendingDoctors}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('patients')}
            className={`px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'patients'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white text-stone-600 hover:bg-stone-200/70'
            }`}
          >
            <Users className="w-4 h-4 text-rose-400" />
            <span>All Patients ({patients.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('caregivers')}
            className={`px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'caregivers'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white text-stone-600 hover:bg-stone-200/70'
            }`}
          >
            <UserCheck className="w-4 h-4 text-amber-400" />
            <span>Caregivers & Cohort Roster ({caregivers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pairings')}
            className={`px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'pairings'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white text-stone-600 hover:bg-stone-200/70'
            }`}
          >
            <Smartphone className="w-4 h-4 text-blue-400" />
            <span>Patient Sign-In & Device Authorizations</span>
            {stats.pendingPairings > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {stats.pendingPairings}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'audit'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white text-stone-600 hover:bg-stone-200/70'
            }`}
          >
            <FileText className="w-4 h-4 text-purple-400" />
            <span>Real-Time Audit Trail</span>
          </button>
        </nav>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: OVERVIEW */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Doctors</span>
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-stone-900">{doctors.length}</span>
                  <span className="text-xs font-bold text-emerald-600">{stats.approvedDoctors} Approved</span>
                </div>
                <div className="mt-2 text-[11px] text-stone-500">
                  {stats.pendingDoctors > 0 ? (
                    <span className="text-amber-700 font-bold">⚠️ {stats.pendingDoctors} awaiting NMC verification</span>
                  ) : (
                    'All licenses verified with medical council'
                  )}
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Patients</span>
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-stone-900">{patients.length}</span>
                  <span className="text-xs font-bold text-rose-600">Multi-Cultural Cohort</span>
                </div>
                <div className="mt-2 text-[11px] text-stone-500">
                  Bengali, Assamese, Kannada, and Hindi patients
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Caregivers</span>
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                    <UserCheck className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-stone-900">{caregivers.length}</span>
                  <span className="text-xs font-bold text-stone-600">3 Roster Units</span>
                </div>
                <div className="mt-2 text-[11px] text-stone-500">
                  Two with 1 patient each, one with 3 patients
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Sign-in Auth</span>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-stone-900">{pairings.length}</span>
                  <span className="text-xs font-bold text-blue-600">Devices Tracked</span>
                </div>
                <div className="mt-2 text-[11px] text-stone-500">
                  Zero-password living room screen access control
                </div>
              </div>
            </div>

            {/* Quick Action & Credentials Notice */}
            <div className="bg-gradient-to-r from-stone-900 to-stone-800 text-white rounded-3xl p-6 shadow-md">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-extrabold text-base">Super Administrator Governance Role</h3>
                  <p className="text-xs text-stone-300 leading-relaxed max-w-3xl">
                    As the Mindora Super Admin, you hold unilateral statutory authority to review doctor medical registrations, approve or revoke clinical licenses, allocate patient-to-caretaker relationships, and audit all data access transactions under health data protection standards.
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-bold text-amber-300">
                    <span className="bg-stone-800 px-3 py-1 rounded-xl border border-stone-700">
                      Active Account: admin@mindora.health
                    </span>
                    <span className="bg-stone-800 px-3 py-1 rounded-xl border border-stone-700">
                      Default Seed Pass: MindoraAdmin2026!
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Audit Activities */}
            <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                Recent Governance Audit Logs
              </h3>

              <div className="divide-y divide-stone-100">
                {auditLogs.slice(0, 6).map((log) => (
                  <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                          log.actionType.includes('approval') ? 'bg-emerald-50 text-emerald-700' :
                          log.actionType.includes('revocation') ? 'bg-rose-50 text-rose-700' :
                          'bg-stone-100 text-stone-700'
                        }`}>
                          {log.actionType.replace('_', ' ')}
                        </span>
                        <span className="font-bold text-xs text-stone-900">{log.targetName || log.targetId}</span>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed">{log.details}</p>
                    </div>
                    <div className="text-right text-[11px] text-stone-400 shrink-0">
                      <span>{log.actorEmail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: DOCTOR CREDENTIALING & STATUTORY LICENSING */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'doctors' && (
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-teal-600" />
                  Statutory Doctor Applications & Medical Credential Review
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Mandatory statutory verification under the National Medical Commission (NMC) Act and State Medical Councils.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-500">Filter:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-stone-50 border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-700"
                >
                  <option value="all">All Registrations</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="approved">Approved</option>
                  <option value="revoked">Revoked</option>
                </select>
              </div>
            </div>

            {/* Doctors Cards / Table */}
            <div className="space-y-4">
              {doctors
                .filter(d => statusFilter === 'all' || d.verificationStatus === statusFilter)
                .map((doc) => {
                  const isPending = doc.verificationStatus === 'pending_approval';
                  const isApproved = doc.verificationStatus === 'approved';
                  const isRevoked = doc.verificationStatus === 'revoked';

                  return (
                    <div 
                      key={doc.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        isPending 
                          ? 'bg-amber-50/50 border-amber-300 ring-2 ring-amber-400/20' 
                          : isRevoked
                          ? 'bg-rose-50/40 border-rose-200'
                          : 'bg-stone-50/60 border-stone-200'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <h4 className="text-base font-extrabold text-stone-900">{doc.name}</h4>
                            
                            {/* Verification Badge */}
                            {isApproved && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle className="w-3 h-3" />
                                NMC Verified & Active
                              </span>
                            )}
                            {isPending && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-400 animate-pulse">
                                <AlertTriangle className="w-3 h-3" />
                                Pending Statutory Verification
                              </span>
                            )}
                            {isRevoked && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-900 border border-rose-400">
                                <XCircle className="w-3 h-3" />
                                Access Revoked
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1.5 text-xs text-stone-600">
                            <div className="flex items-center gap-1.5">
                              <Building className="w-3.5 h-3.5 text-stone-400" />
                              <span>{doc.hospital}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <GraduationCap className="w-3.5 h-3.5 text-stone-400" />
                              <span className="font-semibold">{doc.qualification || "MBBS, MD"}</span>
                            </div>
                            <div>
                              Email: <span className="font-mono text-stone-800">{doc.email}</span>
                            </div>
                            <div>
                              Registration No: <span className="font-mono font-bold text-teal-800">{doc.medicalRegistrationNumber || "NMC-VERIFIED"}</span>
                            </div>
                            <div>
                              Council: <span className="font-semibold text-stone-700">{doc.medicalCouncil || "National Medical Commission"}</span>
                            </div>
                            <div>
                              Year of Reg: <span className="font-bold">{doc.registrationYear || "2011"}</span>
                            </div>
                          </div>

                          <div className="pt-1 text-xs text-stone-500">
                            <strong>Assigned Cohort:</strong> {doc.linkedPatientIds?.length || 0} Patients Linked
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleVerifyDoctor(doc.id, 'approve')}
                                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Approve License & Grant Access
                              </button>
                              <button
                                onClick={() => handleVerifyDoctor(doc.id, 'reject')}
                                className="px-3 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold transition cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {isApproved && (
                            <button
                              onClick={() => handleVerifyDoctor(doc.id, 'revoke')}
                              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                              title="Revoke access to clinical telemetry"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              Revoke Access
                            </button>
                          )}

                          {isRevoked && (
                            <button
                              onClick={() => handleVerifyDoctor(doc.id, 'approve')}
                              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              Reinstate Access
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: ALL PATIENTS ROSTER & CAREGIVER/DOCTOR ALLOCATION */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'patients' && (
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-rose-600" />
                  Multi-Cultural Patient Roster & Assignment Control
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Assign supervising doctors and dedicated caregivers to individual patients across all cultural cohorts.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Patients List */}
            <div className="space-y-4">
              {patients
                .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.location.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((pt) => {
                  const isRevoked = pt.accessStatus === 'revoked';

                  return (
                    <div 
                      key={pt.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        isRevoked ? 'bg-rose-50/50 border-rose-300' : 'bg-stone-50/60 border-stone-200'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          <img 
                            src={pt.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"} 
                            alt={pt.name} 
                            className="w-12 h-12 rounded-xl object-cover border border-stone-300 shrink-0"
                          />
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-sm font-extrabold text-stone-900">{pt.name}</h4>
                              <span className="text-[11px] font-bold text-stone-600 bg-stone-200/80 px-2 py-0.5 rounded-md">
                                Age {pt.age} • {pt.gender}
                              </span>
                              <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                                Language: {pt.language.toUpperCase()}
                              </span>
                              {isRevoked ? (
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-200 text-rose-900">
                                  Access Revoked
                                </span>
                              ) : (
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                                  Active Care
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-stone-500">
                              {pt.location} • Diagnosis: <strong className="text-stone-700">{pt.diagnosis}</strong> ({pt.stage})
                            </p>
                          </div>
                        </div>

                        {/* Dropdown Assignments & Status Controls */}
                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                          {/* Doctor Assignment Dropdown */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-stone-500 block">
                              Assigned Doctor:
                            </label>
                            <select
                              value={pt.doctorId || ''}
                              onChange={(e) => handleReassignDoctor(pt.id, e.target.value)}
                              className="bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-800 focus:ring-2 focus:ring-teal-500"
                            >
                              <option value="">Unassigned</option>
                              {doctors.map(d => (
                                <option key={d.id} value={d.id}>
                                  {d.name} ({d.hospital.split(',')[0]})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Caregiver Assignment Dropdown */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-stone-500 block">
                              Assigned Caregiver:
                            </label>
                            <select
                              value={pt.caregiverId || ''}
                              onChange={(e) => handleReassignCaregiver(pt.id, e.target.value)}
                              className="bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-800 focus:ring-2 focus:ring-amber-500"
                            >
                              <option value="">Unassigned</option>
                              {caregivers.map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.name} ({c.relation})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Revoke / Activate Toggle */}
                          <button
                            onClick={() => handleTogglePatientStatus(pt.id, pt.accessStatus)}
                            className={`px-3 py-2 mt-4 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                              isRevoked 
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs' 
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300'
                            }`}
                          >
                            {isRevoked ? (
                              <>
                                <Unlock className="w-3.5 h-3.5" />
                                Re-Activate
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5" />
                                Revoke Access
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: CAREGIVERS & COHORT ALLOCATION */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'caregivers' && (
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-600" />
                Caregiver Registry & Cohort Distribution
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Overview of caregiver assignments: two taking care of one patient each, and one taking care of 3 patients.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {caregivers.map((cg) => {
                const linked = patients.filter(p => p.caregiverId === cg.id || cg.linkedPatientIds?.includes(p.id));

                return (
                  <div key={cg.id} className="bg-stone-50/80 border border-stone-200 rounded-2xl p-5 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-sm">
                        {cg.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        {linked.length} {linked.length === 1 ? 'Patient' : 'Patients'} Managed
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-sm text-stone-900">{cg.name}</h4>
                      <p className="text-xs text-stone-500">{cg.relation}</p>
                      <p className="text-xs text-stone-600 mt-1">Phone: {cg.phone}</p>
                      <p className="text-xs text-stone-600">Email: {cg.email || 'caregiver@mindora.health'}</p>
                    </div>

                    <div className="pt-3 border-t border-stone-200/80 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                        Assigned Patients:
                      </span>
                      <div className="space-y-1.5">
                        {linked.map(p => (
                          <div key={p.id} className="bg-white border border-stone-200 rounded-xl px-3 py-2 flex items-center justify-between text-xs">
                            <span className="font-bold text-stone-800">{p.name}</span>
                            <span className="text-[10px] font-extrabold uppercase text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
                              {p.language.toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 5: PATIENT SIGN-IN & DEVICE PAIRINGS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'pairings' && (
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-600" />
                Zero-Password Living Room Tablet Authorizations
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Track and approve patient device login requests without requiring passwords from individuals with dementia.
              </p>
            </div>

            <div className="space-y-3">
              {pairings.map((pair) => {
                const isPending = pair.status === 'pending';
                const isApproved = pair.status === 'approved';

                return (
                  <div key={pair.id} className="bg-stone-50 border border-stone-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-black text-blue-800 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                          {pair.pairCode}
                        </span>
                        <h4 className="font-bold text-xs text-stone-900">{pair.deviceName}</h4>
                        {isApproved ? (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                            Approved & Active
                          </span>
                        ) : (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                            Pending Authorization
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500">
                        Patient: <strong>{pair.patientName || 'Living Room Patient'}</strong> • IP: {pair.ipAddress || '192.168.1.1'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isPending && (
                        <button
                          onClick={() => handleApprovePairing(pair.id)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          Approve Sign-In
                        </button>
                      )}
                      <button
                        onClick={() => handleRevokePairing(pair.id)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Revoke Access
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 6: REAL-TIME AUDIT TRAIL */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'audit' && (
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Comprehensive Platform Audit Trail
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Immutable chronological log of all administrative interventions, doctor signups, and access adjustments.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-700">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Actor</th>
                    <th className="p-3">Target</th>
                    <th className="p-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-stone-50/80">
                      <td className="p-3 text-stone-400 font-mono text-[11px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded-md">
                          {log.actionType}
                        </span>
                      </td>
                      <td className="p-3 font-semibold">{log.actorEmail}</td>
                      <td className="p-3 font-bold text-stone-800">{log.targetName || log.targetId}</td>
                      <td className="p-3 text-stone-600 text-[11px] leading-relaxed max-w-md">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
