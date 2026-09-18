import { pgTable, text, integer, real, boolean, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { user } from "./auth.js";

export const gameSessions = pgTable(
  "game_sessions",
  {
    id: text("id").primaryKey(),
    patientId: text("patient_id").notNull(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    gameType: text("game_type").notNull(), // 'memory' | 'attention' | 'pattern' | 'routine'
    gameTitle: text("game_title").notNull(),
    score: integer("score").notNull().default(0),
    accuracy: real("accuracy").notNull().default(0), // 0 to 100
    responseTime: real("response_time").notNull().default(0), // seconds
    attempts: integer("attempts").notNull().default(1),
    difficulty: integer("difficulty").notNull().default(1), // 1 to 5
    completed: boolean("completed").notNull().default(true),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    playedAt: timestamp("played_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("game_sessions_patient_id_idx").on(table.patientId),
    index("game_sessions_game_type_idx").on(table.gameType),
    index("game_sessions_played_at_idx").on(table.playedAt),
  ]
);

export const adaptiveDifficulty = pgTable(
  "adaptive_difficulty",
  {
    id: text("id").primaryKey(),
    patientId: text("patient_id").notNull(),
    gameType: text("game_type").notNull(),
    currentDifficulty: integer("current_difficulty").notNull().default(1),
    recentAccuracyAverage: real("recent_accuracy_average").notNull().default(0),
    historyExplanation: jsonb("history_explanation").$type<string[]>().default([]),
    lastAdjustedDate: timestamp("last_adjusted_date", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("adaptive_difficulty_patient_game_idx").on(table.patientId, table.gameType),
  ]
);
