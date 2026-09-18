import { FastifyPluginAsync } from "fastify";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { randomUUID } from "crypto";
import { db } from "../db/index.js";
import { patientActivityPlans, ActivityPlanItem } from "../db/schema/patients.js";

const activityPlanSchema = z.object({
  prescribedByDoctorId: z.string().optional(),
  doctorName: z.string().optional(),
  clinicalGoal: z.string().optional(),
  activities: z.array(
    z.object({
      gameType: z.enum(["memory", "attention", "pattern", "routine"]),
      title: z.string(),
      enabled: z.boolean(),
      order: z.number().int(),
      rounds: z.number().int(),
      targetFocus: z.string(),
      doctorNotes: z.string().optional(),
    })
  ),
});

export const activityPlansRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/:patientId", async (request, reply) => {
    const { patientId } = request.params as { patientId: string };
    const [plan] = await db
      .select()
      .from(patientActivityPlans)
      .where(eq(patientActivityPlans.patientId, patientId))
      .limit(1);

    if (!plan) {
      return reply.status(404).send({ error: "Activity plan not found for patient" });
    }
    return reply.send(plan);
  });

  fastify.put("/:patientId", async (request, reply) => {
    const { patientId } = request.params as { patientId: string };
    const parseResult = activityPlanSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: parseResult.error.format() });
    }

    const data = parseResult.data;
    const nowStr = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const [existing] = await db
      .select()
      .from(patientActivityPlans)
      .where(eq(patientActivityPlans.patientId, patientId))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(patientActivityPlans)
        .set({
          prescribedByDoctorId: data.prescribedByDoctorId,
          doctorName: data.doctorName,
          clinicalGoal: data.clinicalGoal,
          activities: data.activities as ActivityPlanItem[],
          lastUpdated: nowStr,
          updatedAt: new Date(),
        })
        .where(eq(patientActivityPlans.id, existing.id))
        .returning();
      return reply.send(updated);
    } else {
      const [created] = await db
        .insert(patientActivityPlans)
        .values({
          id: randomUUID(),
          patientId,
          prescribedByDoctorId: data.prescribedByDoctorId,
          doctorName: data.doctorName,
          clinicalGoal: data.clinicalGoal,
          activities: data.activities as ActivityPlanItem[],
          lastUpdated: nowStr,
          updatedAt: new Date(),
        })
        .returning();
      return reply.status(201).send(created);
    }
  });
};
