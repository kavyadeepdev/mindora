import { pgTable, text, boolean, timestamp, index } from "drizzle-orm/pg-core";

export const reminders = pgTable(
  "reminders",
  {
    id: text("id").primaryKey(),
    patientId: text("patient_id").notNull(),
    type: text("type").notNull(), // 'medicine' | 'hydration' | 'activity' | 'appointment'
    title: text("title").notNull(),
    titleAssamese: text("title_assamese"),
    titleHindi: text("title_hindi"),
    titleBengali: text("title_bengali"),
    titleKannada: text("title_kannada"),
    time: text("time").notNull(), // e.g. "09:00 AM"
    status: text("status").notNull().default("pending"), // 'pending' | 'completed' | 'missed'
    notes: text("notes"),
    notesAssamese: text("notes_assamese"),
    notesHindi: text("notes_hindi"),
    notesBengali: text("notes_bengali"),
    notesKannada: text("notes_kannada"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("reminders_patient_id_idx").on(table.patientId),
    index("reminders_status_idx").on(table.status),
  ]
);

export const caregiverAlerts = pgTable(
  "caregiver_alerts",
  {
    id: text("id").primaryKey(),
    patientId: text("patient_id").notNull(),
    type: text("type").notNull().default("info"), // 'success' | 'warning' | 'info' | 'notice'
    title: text("title").notNull(),
    message: text("message").notNull(),
    read: boolean("read").notNull().default(false),
    actionLabel: text("action_label"),
    actionType: text("action_type"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("caregiver_alerts_patient_id_idx").on(table.patientId),
    index("caregiver_alerts_read_idx").on(table.read),
  ]
);
