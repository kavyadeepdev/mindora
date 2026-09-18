import { FastifyPluginAsync } from "fastify";
import { eq, desc, and, sql } from "drizzle-orm";
import { z } from "zod";
import { randomUUID } from "crypto";
import { db } from "../db/index.js";
import { gameSessions, adaptiveDifficulty } from "../db/schema/games.js";
import { caregiverAlerts } from "../db/schema/care.js";
import { getAuthSession } from "../plugins/auth.js";

const recordSessionSchema = z.object({
  id: z.string().optional(),
  patientId: z.string().min(1, "patientId is required"),
  gameType: z.enum(["memory", "attention", "pattern", "routine"]),
  gameTitle: z.string().min(1),
  score: z.number().int().nonnegative(),
  accuracy: z.number().min(0).max(100),
  responseTime: z.number().nonnegative(),
  attempts: z.number().int().positive().default(1),
  difficulty: z.number().int().min(1).max(5).default(1),
  completed: z.boolean().default(true),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const gamesRoutes: FastifyPluginAsync = async (fastify) => {
  // Record a new game session & automatically calculate adaptive difficulty
  fastify.post("/sessions", async (request, reply) => {
    const parseResult = recordSessionSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: "Validation failed",
        details: parseResult.error.format(),
      });
    }

    const payload = parseResult.data;
    const sessionId = payload.id || randomUUID();
    const sessionAuth = await getAuthSession(request);
    const userId = sessionAuth?.user?.id ?? null;

    // 1. Insert session record
    const [savedSession] = await db
      .insert(gameSessions)
      .values({
        id: sessionId,
        patientId: payload.patientId,
        userId,
        gameType: payload.gameType,
        gameTitle: payload.gameTitle,
        score: payload.score,
        accuracy: payload.accuracy,
        responseTime: payload.responseTime,
        attempts: payload.attempts,
        difficulty: payload.difficulty,
        completed: payload.completed,
        notes: payload.notes,
        metadata: payload.metadata || {},
        playedAt: new Date(),
        createdAt: new Date(),
      })
      .returning();

    // 2. Compute adaptive difficulty based on recent game performance
    const recentSessions = await db
      .select({
        accuracy: gameSessions.accuracy,
        difficulty: gameSessions.difficulty,
        score: gameSessions.score,
      })
      .from(gameSessions)
      .where(
        and(
          eq(gameSessions.patientId, payload.patientId),
          eq(gameSessions.gameType, payload.gameType)
        )
      )
      .orderBy(desc(gameSessions.playedAt))
      .limit(5);

    const accuracies = recentSessions.map((s) => s.accuracy);
    const avgAccuracy =
      accuracies.reduce((acc, curr) => acc + curr, 0) / (accuracies.length || 1);

    // Fetch existing adaptive state if present
    const [existingAdaptive] = await db
      .select()
      .from(adaptiveDifficulty)
      .where(
        and(
          eq(adaptiveDifficulty.patientId, payload.patientId),
          eq(adaptiveDifficulty.gameType, payload.gameType)
        )
      )
      .limit(1);

    let nextDifficulty = existingAdaptive?.currentDifficulty ?? payload.difficulty;
    const history = existingAdaptive?.historyExplanation || [];
    let adjustmentNote = "";

    // Adaptive threshold logic:
    // If last 3 sessions have average accuracy >= 85%, advance difficulty
    if (recentSessions.length >= 3 && avgAccuracy >= 85 && nextDifficulty < 5) {
      nextDifficulty += 1;
      adjustmentNote = `Advanced difficulty to Level ${nextDifficulty} after consistent high accuracy (${avgAccuracy.toFixed(1)}%).`;
      history.push(`${new Date().toISOString().split("T")[0]}: ${adjustmentNote}`);
    } else if (recentSessions.length >= 3 && avgAccuracy < 50 && nextDifficulty > 1) {
      nextDifficulty -= 1;
      adjustmentNote = `Adjusted difficulty gently to Level ${nextDifficulty} to prevent frustration (average accuracy: ${avgAccuracy.toFixed(1)}%).`;
      history.push(`${new Date().toISOString().split("T")[0]}: ${adjustmentNote}`);
    }

    // 3. Upsert adaptive difficulty
    let updatedAdaptive;
    if (existingAdaptive) {
      [updatedAdaptive] = await db
        .update(adaptiveDifficulty)
        .set({
          currentDifficulty: nextDifficulty,
          recentAccuracyAverage: avgAccuracy,
          historyExplanation: history.slice(-10),
          lastAdjustedDate: new Date(),
        })
        .where(eq(adaptiveDifficulty.id, existingAdaptive.id))
        .returning();
    } else {
      [updatedAdaptive] = await db
        .insert(adaptiveDifficulty)
        .values({
          id: randomUUID(),
          patientId: payload.patientId,
          gameType: payload.gameType,
          currentDifficulty: nextDifficulty,
          recentAccuracyAverage: avgAccuracy,
          historyExplanation: adjustmentNote ? [adjustmentNote] : [],
          lastAdjustedDate: new Date(),
        })
        .returning();
    }

    // 4. Trigger caregiver alert if performance dropped significantly or a milestone was achieved
    let createdAlert = null;
    if (payload.accuracy < 40) {
      const [alert] = await db
        .insert(caregiverAlerts)
        .values({
          id: randomUUID(),
          patientId: payload.patientId,
          type: "warning",
          title: `Low engagement in ${payload.gameTitle}`,
          message: `Accuracy was ${payload.accuracy}% during the latest ${payload.gameTitle} session. You may want to check in or offer assistance.`,
          read: false,
          actionLabel: "View Session",
          actionType: "view_session",
          createdAt: new Date(),
        })
        .returning();
      createdAlert = alert;
    } else if (payload.score >= 500 && payload.accuracy >= 90) {
      const [alert] = await db
        .insert(caregiverAlerts)
        .values({
          id: randomUUID(),
          patientId: payload.patientId,
          type: "success",
          title: `High achievement in ${payload.gameTitle}!`,
          message: `Outstanding performance with ${payload.accuracy}% accuracy and score of ${payload.score}!`,
          read: false,
          actionLabel: "Celebrate",
          actionType: "view_progress",
          createdAt: new Date(),
        })
        .returning();
      createdAlert = alert;
    }

    return reply.status(201).send({
      session: savedSession,
      adaptiveDifficulty: updatedAdaptive,
      alert: createdAlert,
    });
  });

  // Query recorded game sessions
  fastify.get("/sessions", async (request, reply) => {
    const query = request.query as {
      patientId?: string;
      gameType?: string;
      limit?: string;
      offset?: string;
    };

    const limit = Math.min(parseInt(query.limit || "50", 10), 100);
    const offset = parseInt(query.offset || "0", 10);

    const conditions = [];
    if (query.patientId) {
      conditions.push(eq(gameSessions.patientId, query.patientId));
    }
    if (query.gameType) {
      conditions.push(eq(gameSessions.gameType, query.gameType));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const sessions = await db
      .select()
      .from(gameSessions)
      .where(whereClause)
      .orderBy(desc(gameSessions.playedAt))
      .limit(limit)
      .offset(offset);

    return reply.send({
      items: sessions,
      count: sessions.length,
      limit,
      offset,
    });
  });

  // Get aggregated cognitive performance analytics for a patient
  fastify.get("/analytics/:patientId", async (request, reply) => {
    const { patientId } = request.params as { patientId: string };

    const patientSessions = await db
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.patientId, patientId))
      .orderBy(desc(gameSessions.playedAt));

    if (patientSessions.length === 0) {
      return reply.send({
        patientId,
        totalSessions: 0,
        totalScore: 0,
        overallAccuracyAverage: 0,
        averageResponseTime: 0,
        breakdownByGame: {},
        recentSessions: [],
      });
    }

    const totalSessions = patientSessions.length;
    const totalScore = patientSessions.reduce((sum, s) => sum + s.score, 0);
    const overallAccuracyAverage =
      patientSessions.reduce((sum, s) => sum + s.accuracy, 0) / totalSessions;
    const averageResponseTime =
      patientSessions.reduce((sum, s) => sum + s.responseTime, 0) / totalSessions;

    // Breakdown per gameType
    const breakdownByGame: Record<
      string,
      { count: number; averageAccuracy: number; averageScore: number }
    > = {};

    for (const session of patientSessions) {
      const type = session.gameType;
      if (!breakdownByGame[type]) {
        breakdownByGame[type] = { count: 0, averageAccuracy: 0, averageScore: 0 };
      }
      breakdownByGame[type].count += 1;
      breakdownByGame[type].averageAccuracy += session.accuracy;
      breakdownByGame[type].averageScore += session.score;
    }

    for (const type of Object.keys(breakdownByGame)) {
      const count = breakdownByGame[type].count;
      breakdownByGame[type].averageAccuracy = +(breakdownByGame[type].averageAccuracy / count).toFixed(1);
      breakdownByGame[type].averageScore = +(breakdownByGame[type].averageScore / count).toFixed(0);
    }

    return reply.send({
      patientId,
      totalSessions,
      totalScore,
      overallAccuracyAverage: +overallAccuracyAverage.toFixed(1),
      averageResponseTime: +averageResponseTime.toFixed(2),
      breakdownByGame,
      recentSessions: patientSessions.slice(0, 10),
    });
  });

  // Get current adaptive difficulty states for a patient
  fastify.get("/difficulty/:patientId", async (request, reply) => {
    const { patientId } = request.params as { patientId: string };

    const states = await db
      .select()
      .from(adaptiveDifficulty)
      .where(eq(adaptiveDifficulty.patientId, patientId));

    return reply.send({
      patientId,
      difficulties: states,
    });
  });

  // Manually update or override adaptive difficulty
  fastify.patch("/difficulty/:patientId", async (request, reply) => {
    const { patientId } = request.params as { patientId: string };
    const bodySchema = z.object({
      gameType: z.enum(["memory", "attention", "pattern", "routine"]),
      difficulty: z.number().int().min(1).max(5),
      reason: z.string().optional(),
    });

    const parseResult = bodySchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: parseResult.error.format() });
    }

    const { gameType, difficulty, reason } = parseResult.data;
    const note = reason || `Manual adjustment to Level ${difficulty}`;

    const [existing] = await db
      .select()
      .from(adaptiveDifficulty)
      .where(
        and(
          eq(adaptiveDifficulty.patientId, patientId),
          eq(adaptiveDifficulty.gameType, gameType)
        )
      )
      .limit(1);

    if (existing) {
      const updatedHistory = [...(existing.historyExplanation || []), note].slice(-10);
      const [updated] = await db
        .update(adaptiveDifficulty)
        .set({
          currentDifficulty: difficulty,
          historyExplanation: updatedHistory,
          lastAdjustedDate: new Date(),
        })
        .where(eq(adaptiveDifficulty.id, existing.id))
        .returning();

      return reply.send(updated);
    }

    const [created] = await db
      .insert(adaptiveDifficulty)
      .values({
        id: randomUUID(),
        patientId,
        gameType,
        currentDifficulty: difficulty,
        recentAccuracyAverage: 0,
        historyExplanation: [note],
        lastAdjustedDate: new Date(),
      })
      .returning();

    return reply.status(201).send(created);
  });
};
