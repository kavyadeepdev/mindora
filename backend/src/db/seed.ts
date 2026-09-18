import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse/sync";
import { randomUUID } from "crypto";
import { pool, db } from "./index.js";
import {
  patientProfiles,
  caregiverProfiles,
  doctorProfiles,
  patientActivityPlans,
  devicePairings,
} from "./schema/patients.js";
import {
  gameSessions,
  adaptiveDifficulty,
} from "./schema/games.js";
import {
  reminders,
  caregiverAlerts,
} from "./schema/care.js";
import {
  culturalMemories,
  familiarMemories,
  memoryCardItems,
  attentionPoolItems,
  patternSequences,
  performanceTrends,
} from "./schema/content.js";
import { user } from "./schema/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CSV_DIR = path.resolve(__dirname, "../../csv");

function readCsv(fileName: string): Record<string, string>[] {
  const filePath = path.join(CSV_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    console.warn(`[Seed] Warning: File not found ${filePath}`);
    return [];
  }
  const content = fs.readFileSync(filePath, "utf-8");
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}

export async function seed() {
  console.log("🌱 Starting Mindora database seed from CSVs & domain models...");

  try {
    // 1. Seed base default users (for foreign keys)
    console.log("-> Seeding default caregiver and doctor user accounts...");
    await db
      .insert(user)
      .values([
        {
          id: "user-caregiver-meera-01",
          name: "Meera Devi",
          email: "meera@mindora.care",
          emailVerified: true,
          image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
        },
        {
          id: "user-doctor-debojit-01",
          name: "Dr. Debojit Sarma",
          email: "dr.sarma@neurocare-assam.org",
          emailVerified: true,
          image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80",
        },
      ])
      .onConflictDoNothing();

    // 2. Seed Caregivers
    const caregiversData = readCsv("caregivers.csv");
    console.log(`-> Seeding ${caregiversData.length} caregiver profiles...`);
    for (const row of caregiversData) {
      const linked = row.linkedPatientIds
        ? row.linkedPatientIds.split(",").map((s) => s.trim())
        : [];
      await db
        .insert(caregiverProfiles)
        .values({
          id: row.id,
          userId: row.id === "caregiver-meera-01" ? "user-caregiver-meera-01" : undefined,
          name: row.name,
          relation: row.relation,
          phone: row.phone,
          linkedPatientIds: linked,
        })
        .onConflictDoUpdate({
          target: caregiverProfiles.id,
          set: {
            name: row.name,
            relation: row.relation,
            phone: row.phone,
            linkedPatientIds: linked,
          },
        });
    }

    // 3. Seed Doctors
    console.log("-> Seeding doctor profiles...");
    await db
      .insert(doctorProfiles)
      .values([
        {
          id: "doctor-debojit-01",
          userId: "user-doctor-debojit-01",
          name: "Dr. Debojit Sarma",
          specialty: "Cognitive Neurology & Dementia Care",
          hospital: "Guwahati Neurological Care & AIIMS Clinical Affiliate",
          phone: "+91 94350 78901",
          email: "dr.sarma@neurocare-assam.org",
          linkedPatientIds: ["patient-anima-01", "patient-tashi-02", "patient-bhaben-02", "patient-pratima-03"],
        },
      ])
      .onConflictDoUpdate({
        target: doctorProfiles.id,
        set: {
          name: "Dr. Debojit Sarma",
          specialty: "Cognitive Neurology & Dementia Care",
          hospital: "Guwahati Neurological Care & AIIMS Clinical Affiliate",
          phone: "+91 94350 78901",
          email: "dr.sarma@neurocare-assam.org",
          linkedPatientIds: ["patient-anima-01", "patient-tashi-02", "patient-bhaben-02", "patient-pratima-03"],
        },
      });

    // 4. Seed Patients
    const patientsData = readCsv("patients.csv");
    console.log(`-> Seeding ${patientsData.length} patient profiles...`);
    for (const row of patientsData) {
      const interests = row.interests
        ? row.interests.split(",").map((s) => s.trim())
        : [];
      const dailyRoutine = {
        morningWakeUp: row.morningWakeUp || "6:30 AM",
        morningHydration: row.morningHydration || "7:00 AM",
        morningMeds: row.morningMeds || "9:00 AM",
        breakfast: row.breakfast || "9:30 AM",
        morningWalk: row.morningWalk || "11:00 AM",
        eveningTea: row.eveningTea || "4:00 PM",
        nightSleep: row.nightSleep || "9:30 PM",
      };

      await db
        .insert(patientProfiles)
        .values({
          id: row.id,
          caregiverUserId: row.caregiverId === "caregiver-meera-01" ? "user-caregiver-meera-01" : null,
          caregiverId: row.caregiverId || "caregiver-meera-01",
          name: row.name,
          age: parseInt(row.age, 10) || 70,
          gender: row.gender || "Female",
          location: row.location || "Assam, India",
          language: row.language || "en",
          interests,
          avatarUrl: row.avatarUrl,
          dailyRoutine,
          culturalTheme: row.culturalTheme || "Assam Brahmaputra Valley",
          diagnosis: "Early-stage Alzheimer's Disease",
          stage: "Mild Cognitive Impairment (MCI)",
          accessibility: {
            largeText: true,
            highContrast: false,
            reduceMotion: true,
            audioFeedback: true,
          },
        })
        .onConflictDoUpdate({
          target: patientProfiles.id,
          set: {
            name: row.name,
            age: parseInt(row.age, 10) || 70,
            gender: row.gender || "Female",
            location: row.location || "Assam, India",
            language: row.language || "en",
            interests,
            avatarUrl: row.avatarUrl,
            dailyRoutine,
            culturalTheme: row.culturalTheme || "Assam Brahmaputra Valley",
          },
        });
    }

    // 5. Seed Activity Plans
    console.log("-> Seeding patient activity plans...");
    const activityPlans = [
      {
        id: "plan-anima-01",
        patientId: "patient-anima-01",
        prescribedByDoctorId: "doctor-debojit-01",
        doctorName: "Dr. Debojit Sarma",
        lastUpdated: "18 Sep 2026",
        clinicalGoal: "Stabilize visual recall and step sequencing through familiar daily stimuli.",
        activities: [
          {
            gameType: "memory" as const,
            title: "Memory Match",
            enabled: true,
            order: 1,
            rounds: 5,
            targetFocus: "Visual Association & Object Recall",
            doctorNotes: "Maintain gentle 5-second study window. Familiar flowers and utensils.",
          },
          {
            gameType: "attention" as const,
            title: "Attention Challenge",
            enabled: true,
            order: 2,
            rounds: 5,
            targetFocus: "Selective Focus & Visual Filtering",
            doctorNotes: "Keep contrast high; allow unhurried response time.",
          },
          {
            gameType: "pattern" as const,
            title: "Pattern Recognition",
            enabled: true,
            order: 3,
            rounds: 5,
            targetFocus: "Working Memory & Sequence Prediction",
            doctorNotes: "Support cognitive rhythm recognition.",
          },
          {
            gameType: "routine" as const,
            title: "Daily Routine Recall",
            enabled: true,
            order: 4,
            rounds: 5,
            targetFocus: "Executive Function & Chronological Ordering",
            doctorNotes: "Strengthen morning and hydration recall.",
          },
        ],
      },
    ];

    for (const plan of activityPlans) {
      await db
        .insert(patientActivityPlans)
        .values(plan)
        .onConflictDoUpdate({
          target: patientActivityPlans.id,
          set: plan,
        });
    }

    // 6. Seed Device Pairings
    console.log("-> Seeding device pairings...");
    await db
      .insert(devicePairings)
      .values([
        {
          id: "pair-req-100",
          pairCode: "MND-194",
          deviceName: "Bedroom Samsung Tab S9 Ultra",
          browserInfo: "Chrome 128 (Android 14)",
          ipAddress: "103.28.246.12 (Jorhat, Assam)",
          status: "approved",
          patientId: "patient-anima-01",
          patientName: "Anima Devi",
          approvedBy: "Dr. Debojit Sarma",
          requestedAt: "18 Sep 2026, 09:15 AM",
          approvedAt: "18 Sep 2026, 09:16 AM",
          token: "tok_paired_anima_dev_tab_194",
        },
        {
          id: "pair-req-101",
          pairCode: "MND-842",
          deviceName: "Living Room Tablet (Apple iPadOS 18)",
          browserInfo: "Mobile Safari 18.2",
          ipAddress: "103.28.246.12 (Jorhat, Assam)",
          status: "pending",
          patientId: "patient-anima-01",
          patientName: "Anima Devi",
          requestedAt: "Just now (Awaiting Doctor or Caretaker Approval)",
        },
      ])
      .onConflictDoNothing();

    // 7. Seed Reminders
    const remindersData = readCsv("reminders.csv");
    console.log(`-> Seeding ${remindersData.length} reminders...`);
    for (const row of remindersData) {
      await db
        .insert(reminders)
        .values({
          id: row.id,
          patientId: row.patientId || "patient-anima-01",
          type: row.type || "medicine",
          title: row.title,
          titleAssamese: row.titleAssamese || null,
          titleHindi: row.titleHindi || null,
          time: row.time || "09:00 AM",
          status: row.status || "pending",
          notes: row.notes || null,
        })
        .onConflictDoUpdate({
          target: reminders.id,
          set: {
            title: row.title,
            titleAssamese: row.titleAssamese || null,
            titleHindi: row.titleHindi || null,
            time: row.time || "09:00 AM",
            status: row.status || "pending",
            notes: row.notes || null,
          },
        });
    }

    // 8. Seed Caregiver Alerts
    const alertsData = readCsv("caregiver_alerts.csv");
    console.log(`-> Seeding ${alertsData.length} caregiver alerts...`);
    for (const row of alertsData) {
      await db
        .insert(caregiverAlerts)
        .values({
          id: row.id,
          patientId: "patient-anima-01",
          type: row.type || "info",
          title: row.title,
          message: row.message,
          read: row.read === "true",
          actionLabel: row.actionLabel || null,
        })
        .onConflictDoUpdate({
          target: caregiverAlerts.id,
          set: {
            type: row.type || "info",
            title: row.title,
            message: row.message,
            read: row.read === "true",
            actionLabel: row.actionLabel || null,
          },
        });
    }

    // 9. Seed Game Sessions
    const sessionsData = readCsv("game_sessions.csv");
    console.log(`-> Seeding ${sessionsData.length} historical game sessions...`);
    for (const row of sessionsData) {
      await db
        .insert(gameSessions)
        .values({
          id: row.id,
          patientId: row.patientId || "patient-anima-01",
          gameType: row.gameType,
          gameTitle: row.gameTitle,
          score: parseInt(row.score, 10) || 0,
          accuracy: parseFloat(row.accuracy) || 0,
          responseTime: parseFloat(row.responseTime) || 0,
          attempts: parseInt(row.attempts, 10) || 1,
          difficulty: parseInt(row.difficulty, 10) || 1,
          completed: row.completed === "true",
          notes: row.notes || null,
          playedAt: row.timestamp ? new Date(row.timestamp) : new Date(),
        })
        .onConflictDoUpdate({
          target: gameSessions.id,
          set: {
            score: parseInt(row.score, 10) || 0,
            accuracy: parseFloat(row.accuracy) || 0,
            responseTime: parseFloat(row.responseTime) || 0,
            attempts: parseInt(row.attempts, 10) || 1,
            difficulty: parseInt(row.difficulty, 10) || 1,
            completed: row.completed === "true",
            notes: row.notes || null,
          },
        });
    }

    // 10. Seed Adaptive Difficulty States
    const adaptiveData = readCsv("adaptive_difficulty.csv");
    console.log(`-> Seeding ${adaptiveData.length} adaptive difficulty states...`);
    for (const row of adaptiveData) {
      const history = row.historyExplanation
        ? row.historyExplanation.split("|").map((s) => s.trim())
        : [];
      const id = `adapt-anima-${row.gameType}`;
      await db
        .insert(adaptiveDifficulty)
        .values({
          id,
          patientId: "patient-anima-01",
          gameType: row.gameType,
          currentDifficulty: parseInt(row.currentDifficulty, 10) || 1,
          recentAccuracyAverage: parseFloat(row.recentAccuracyAverage) || 0,
          historyExplanation: history,
          lastAdjustedDate: new Date(),
        })
        .onConflictDoUpdate({
          target: adaptiveDifficulty.id,
          set: {
            currentDifficulty: parseInt(row.currentDifficulty, 10) || 1,
            recentAccuracyAverage: parseFloat(row.recentAccuracyAverage) || 0,
            historyExplanation: history,
            lastAdjustedDate: new Date(),
          },
        });
    }

    // 11. Seed Cultural Memories
    const culturalData = readCsv("cultural_memories.csv");
    console.log(`-> Seeding ${culturalData.length} cultural memory items...`);
    for (const row of culturalData) {
      await db
        .insert(culturalMemories)
        .values({
          id: row.id,
          title: row.title,
          titleAssamese: row.titleAssamese || null,
          category: row.category,
          description: row.description || null,
          emoji: row.emoji || null,
          theme: row.theme || null,
        })
        .onConflictDoUpdate({
          target: culturalMemories.id,
          set: {
            title: row.title,
            titleAssamese: row.titleAssamese || null,
            category: row.category,
            description: row.description || null,
            emoji: row.emoji || null,
            theme: row.theme || null,
          },
        });
    }

    // 12. Seed Familiar Memories
    const familiarData = readCsv("familiar_memories.csv");
    console.log(`-> Seeding ${familiarData.length} familiar memories stories...`);
    for (const row of familiarData) {
      const tags = row.tags ? row.tags.split(",").map((s) => s.trim()) : [];
      await db
        .insert(familiarMemories)
        .values({
          id: row.id,
          title: row.title,
          titleAssamese: row.titleAssamese || null,
          location: row.location || null,
          emoji: row.emoji || null,
          story: row.story,
          storyAssamese: row.storyAssamese || null,
          tags,
        })
        .onConflictDoUpdate({
          target: familiarMemories.id,
          set: {
            title: row.title,
            titleAssamese: row.titleAssamese || null,
            location: row.location || null,
            emoji: row.emoji || null,
            story: row.story,
            storyAssamese: row.storyAssamese || null,
            tags,
          },
        });
    }

    // 13. Seed Memory Card Items
    const cardData = readCsv("memory_card_items.csv");
    console.log(`-> Seeding ${cardData.length} memory card items...`);
    for (const row of cardData) {
      await db
        .insert(memoryCardItems)
        .values({
          id: row.id,
          name: row.name,
          nameAssamese: row.nameAssamese || null,
          nameHindi: row.nameHindi || null,
          emoji: row.emoji,
          color: row.color || "bg-amber-50 border-amber-200",
        })
        .onConflictDoUpdate({
          target: memoryCardItems.id,
          set: {
            name: row.name,
            nameAssamese: row.nameAssamese || null,
            nameHindi: row.nameHindi || null,
            emoji: row.emoji,
            color: row.color || "bg-amber-50 border-amber-200",
          },
        });
    }

    // 14. Seed Attention Pool Items
    const attentionData = readCsv("attention_pool_items.csv");
    console.log(`-> Seeding ${attentionData.length} attention pool items...`);
    for (const row of attentionData) {
      await db
        .insert(attentionPoolItems)
        .values({
          id: row.id,
          name: row.name,
          emoji: row.emoji,
          isRed: row.isRed?.toLowerCase().includes("true"),
          colorName: row.colorName || null,
        })
        .onConflictDoUpdate({
          target: attentionPoolItems.id,
          set: {
            name: row.name,
            emoji: row.emoji,
            isRed: row.isRed?.toLowerCase().includes("true"),
            colorName: row.colorName || null,
          },
        });
    }

    // 15. Seed Pattern Sequences
    const patternData = readCsv("pattern_sequences.csv");
    console.log(`-> Seeding ${patternData.length} pattern sequences...`);
    let pIdx = 1;
    for (const row of patternData) {
      const id = `pattern-${pIdx++}`;
      await db
        .insert(patternSequences)
        .values({
          id,
          level: parseInt(row.level, 10) || 1,
          sequence: row.sequence,
          correctNextEmoji: row.correctNextEmoji,
          correctNextLabel: row.correctNextLabel,
          optionsEmoji: row.optionsEmoji,
          optionsLabel: row.optionsLabel,
          patternRule: row.patternRule,
        })
        .onConflictDoUpdate({
          target: patternSequences.id,
          set: {
            level: parseInt(row.level, 10) || 1,
            sequence: row.sequence,
            correctNextEmoji: row.correctNextEmoji,
            correctNextLabel: row.correctNextLabel,
            optionsEmoji: row.optionsEmoji,
            optionsLabel: row.optionsLabel,
            patternRule: row.patternRule,
          },
        });
    }

    // 16. Seed Performance Trends
    const trendsData = readCsv("performance_trends.csv");
    console.log(`-> Seeding ${trendsData.length} performance trends entries...`);
    for (const row of trendsData) {
      await db
        .insert(performanceTrends)
        .values({
          id: `trend-${row.day}`,
          day: row.day,
          accuracy: parseFloat(row.accuracy) || 0,
          responseTime: parseFloat(row.responseTime) || 0,
          score: parseFloat(row.score) || 0,
        })
        .onConflictDoUpdate({
          target: performanceTrends.id,
          set: {
            accuracy: parseFloat(row.accuracy) || 0,
            responseTime: parseFloat(row.responseTime) || 0,
            score: parseFloat(row.score) || 0,
          },
        });
    }

    console.log("✅ Mindora database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

// Auto-run if executed directly via CLI
if (process.argv[1]?.includes("seed.ts")) {
  seed()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error(err);
      await pool.end();
      process.exit(1);
    });
}
