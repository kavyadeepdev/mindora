import { pgTable, text, integer, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { user } from "./auth.js";

export interface DailyRoutineSchedule {
  morningWakeUp: string;
  morningHydration: string;
  morningMeds: string;
  breakfast: string;
  morningWalk: string;
  eveningTea: string;
  nightSleep: string;
}

export interface ActivityPlanItem {
  gameType: "memory" | "attention" | "pattern" | "routine";
  title: string;
  enabled: boolean;
  order: number;
  rounds: number;
  targetFocus: string;
  doctorNotes?: string;
}

export const patientProfiles = pgTable(
  "patient_profiles",
  {
    id: text("id").primaryKey(),
    doctorId: text("doctor_id"),
    doctorName: text("doctor_name"),
    caregiverUserId: text("caregiver_user_id").references(() => user.id, { onDelete: "set null" }),
    caregiverId: text("caregiver_id"),
    caregiverName: text("caregiver_name"),
    name: text("name").notNull(),
    age: integer("age").notNull(),
    gender: text("gender"),
    location: text("location"),
    language: text("language").notNull().default("en"), // 'en' | 'hi' | 'as' | 'bn' | 'kn'
    interests: jsonb("interests").$type<string[]>().default([]),
    avatarUrl: text("avatar_url"),
    dailyRoutine: jsonb("daily_routine").$type<DailyRoutineSchedule>(),
    culturalTheme: text("cultural_theme").notNull().default("tea-gardens"),
    diagnosis: text("diagnosis"),
    stage: text("stage"),
    accessStatus: text("access_status").notNull().default("active"), // 'active' | 'pending' | 'revoked'
    accessibility: jsonb("accessibility").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("patient_profiles_doctor_idx").on(table.doctorId),
    index("patient_profiles_caregiver_idx").on(table.caregiverUserId),
    index("patient_profiles_access_idx").on(table.accessStatus),
  ]
);

export const caregiverProfiles = pgTable(
  "caregiver_profiles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email"),
    relation: text("relation"),
    phone: text("phone"),
    status: text("status").notNull().default("active"), // 'active' | 'revoked'
    linkedPatientIds: jsonb("linked_patient_ids").$type<string[]>().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("caregiver_profiles_user_idx").on(table.userId),
  ]
);

export const doctorProfiles = pgTable(
  "doctor_profiles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    specialty: text("specialty"),
    hospital: text("hospital"),
    phone: text("phone"),
    email: text("email"),
    medicalRegistrationNumber: text("medical_registration_number"), // Mandated statutory NMC/State Medical Council Reg No
    medicalCouncil: text("medical_council"), // e.g. "West Bengal Medical Council / NMC", "Karnataka Medical Council / NMC"
    registrationYear: integer("registration_year"),
    qualification: text("qualification"), // e.g. "MBBS, MD (Geriatrics)"
    verificationStatus: text("verification_status").notNull().default("pending_approval"), // 'pending_approval' | 'approved' | 'rejected' | 'revoked'
    rejectionReason: text("rejection_reason"),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    approvedBy: text("approved_by"),
    linkedPatientIds: jsonb("linked_patient_ids").$type<string[]>().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("doctor_profiles_user_idx").on(table.userId),
    index("doctor_profiles_verification_idx").on(table.verificationStatus),
  ]
);

export const adminAuditLogs = pgTable(
  "admin_audit_logs",
  {
    id: text("id").primaryKey(),
    actionType: text("action_type").notNull(), // 'doctor_approval' | 'doctor_rejection' | 'access_revocation' | 'caregiver_assigned' | 'patient_added' | 'patient_signin_approved'
    actorEmail: text("actor_email").notNull(),
    actorRole: text("actor_role").notNull(),
    targetId: text("target_id").notNull(),
    targetName: text("target_name"),
    details: text("details"),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("admin_audit_logs_action_idx").on(table.actionType),
  ]
);

export const patientActivityPlans = pgTable(
  "patient_activity_plans",
  {
    id: text("id").primaryKey(),
    patientId: text("patient_id").notNull(),
    prescribedByDoctorId: text("prescribed_by_doctor_id"),
    doctorName: text("doctor_name"),
    lastUpdated: text("last_updated"),
    clinicalGoal: text("clinical_goal"),
    activities: jsonb("activities").$type<ActivityPlanItem[]>().default([]),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("activity_plans_patient_id_idx").on(table.patientId),
  ]
);

export const devicePairings = pgTable(
  "device_pairings",
  {
    id: text("id").primaryKey(),
    pairCode: text("pair_code").notNull(),
    deviceName: text("device_name").notNull(),
    browserInfo: text("browser_info"),
    ipAddress: text("ip_address"),
    status: text("status").notNull().default("pending"), // 'pending' | 'approved' | 'rejected'
    patientId: text("patient_id"),
    patientName: text("patient_name"),
    approvedBy: text("approved_by"),
    requestedAt: text("requested_at"),
    approvedAt: text("approved_at"),
    token: text("token"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("device_pairings_pair_code_idx").on(table.pairCode),
    index("device_pairings_status_idx").on(table.status),
  ]
);
