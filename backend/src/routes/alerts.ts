import { FastifyPluginAsync } from "fastify";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { randomUUID } from "crypto";
import { db } from "../db/index.js";
import { caregiverAlerts } from "../db/schema/care.js";

const alertSchema = z.object({
  id: z.string().optional(),
  patientId: z.string().min(1),
  type: z.enum(["success", "warning", "info", "notice"]).default("info"),
  title: z.string().min(1),
  message: z.string().min(1),
  actionLabel: z.string().optional(),
  actionType: z.string().optional(),
});

export const alertsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/", async (request, reply) => {
    const query = request.query as { patientId?: string; unreadOnly?: string };
    const conditions = [];

    if (query.patientId) conditions.push(eq(caregiverAlerts.patientId, query.patientId));
    if (query.unreadOnly === "true") conditions.push(eq(caregiverAlerts.read, false));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const items = await db
      .select()
      .from(caregiverAlerts)
      .where(whereClause)
      .orderBy(desc(caregiverAlerts.createdAt));

    return reply.send({ items, count: items.length });
  });

  fastify.post("/", async (request, reply) => {
    const parseResult = alertSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: parseResult.error.format() });
    }

    const data = parseResult.data;
    const id = data.id || randomUUID();

    const [created] = await db
      .insert(caregiverAlerts)
      .values({
        id,
        patientId: data.patientId,
        type: data.type,
        title: data.title,
        message: data.message,
        read: false,
        actionLabel: data.actionLabel,
        actionType: data.actionType,
        createdAt: new Date(),
      })
      .returning();

    return reply.status(201).send(created);
  });

  fastify.patch("/:id/read", async (request, reply) => {
    const { id } = request.params as { id: string };

    const [updated] = await db
      .update(caregiverAlerts)
      .set({ read: true })
      .where(eq(caregiverAlerts.id, id))
      .returning();

    if (!updated) {
      return reply.status(404).send({ error: "Alert not found" });
    }

    return reply.send(updated);
  });
};
