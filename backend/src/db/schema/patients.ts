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
    caregiverUserId: text("caregiver_user_id").references(() => user.id, { onDelete: "set null" }),
    caregiverId: text("caregiver_id"),
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
    accessibility: jsonb("accessibility").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("patient_profiles_caregiver_idx").on(table.caregiverUserId),
  ]
);

export const caregiverProfiles = pgTable(
  "caregiver_profiles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    relation: text("relation"),
    phone: text("phone"),
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
    linkedPatientIds: jsonb("linked_patient_ids").$type<string[]>().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("doctor_profiles_user_idx").on(table.userId),
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
