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

export const patientProfiles = pgTable(
  "patient_profiles",
  {
    id: text("id").primaryKey(),
    caregiverUserId: text("caregiver_user_id").references(() => user.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    age: integer("age").notNull(),
    gender: text("gender"),
    location: text("location"),
    language: text("language").notNull().default("en"), // 'en' | 'hi' | 'as'
    interests: jsonb("interests").$type<string[]>().default([]),
    avatarUrl: text("avatar_url"),
    dailyRoutine: jsonb("daily_routine").$type<DailyRoutineSchedule>(),
    culturalTheme: text("cultural_theme").notNull().default("tea-gardens"),
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
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
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
