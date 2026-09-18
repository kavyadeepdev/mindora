import { FastifyPluginAsync } from "fastify";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { randomUUID } from "crypto";
import { db } from "../db/index.js";
import { reminders } from "../db/schema/care.js";

const reminderSchema = z.object({
  id: z.string().optional(),
  patientId: z.string().min(1),
  type: z.enum(["medicine", "hydration", "activity", "appointment"]),
  title: z.string().min(1),
  titleAssamese: z.string().optional(),
  titleHindi: z.string().optional(),
  time: z.string().min(1),
  status: z.enum(["pending", "completed", "missed"]).default("pending"),
  notes: z.string().optional(),
});

export const remindersRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/", async (request, reply) => {
    const query = request.query as { patientId?: string; status?: string };
    const conditions = [];

    if (query.patientId) conditions.push(eq(reminders.patientId, query.patientId));
    if (query.status) conditions.push(eq(reminders.status, query.status));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const items = await db.select().from(reminders).where(whereClause).orderBy(desc(reminders.createdAt));

    return reply.send({ items, count: items.length });
  });

  fastify.post("/", async (request, reply) => {
    const parseResult = reminderSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: parseResult.error.format() });
    }

    const data = parseResult.data;
    const id = data.id || randomUUID();

    const [created] = await db
      .insert(reminders)
      .values({
        id,
        patientId: data.patientId,
        type: data.type,
        title: data.title,
        titleAssamese: data.titleAssamese,
        titleHindi: data.titleHindi,
        time: data.time,
        status: data.status,
        notes: data.notes,
        createdAt: new Date(),
      })
      .returning();

    return reply.status(201).send(created);
  });

  fastify.patch("/:id/status", async (request, reply) => {
    const { id } = request.params as { id: string };
    const bodySchema = z.object({
      status: z.enum(["pending", "completed", "missed"]),
    });

    const parseResult = bodySchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: parseResult.error.format() });
    }

    const [updated] = await db
      .update(reminders)
      .set({ status: parseResult.data.status })
      .where(eq(reminders.id, id))
      .returning();

    if (!updated) {
      return reply.status(404).send({ error: "Reminder not found" });
    }

    return reply.send(updated);
  });
};
