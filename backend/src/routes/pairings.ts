import { FastifyPluginAsync } from "fastify";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { randomUUID } from "crypto";
import { db } from "../db/index.js";
import { devicePairings } from "../db/schema/patients.js";

const pairingSchema = z.object({
  pairCode: z.string().min(1),
  deviceName: z.string().min(1),
  browserInfo: z.string().optional(),
  patientId: z.string().optional(),
  patientName: z.string().optional(),
});

export const pairingsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all device pairings (both pending and approved)
  fastify.get("/", async (_request, reply) => {
    const pairings = await db
      .select()
      .from(devicePairings)
      .orderBy(desc(devicePairings.createdAt));
    return reply.send({ items: pairings, count: pairings.length });
  });

  // Request new device pairing
  fastify.post("/", async (request, reply) => {
    const parseResult = pairingSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: parseResult.error.format() });
    }

    const data = parseResult.data;
    const ip = request.ip || "127.0.0.1";
    const [created] = await db
      .insert(devicePairings)
      .values({
        id: randomUUID(),
        pairCode: data.pairCode,
        deviceName: data.deviceName,
        browserInfo: data.browserInfo || "Browser",
        ipAddress: ip,
        status: "pending",
        patientId: data.patientId,
        patientName: data.patientName,
        requestedAt: "Just now",
        createdAt: new Date(),
      })
      .returning();

    return reply.status(201).send(created);
  });

  // Approve device pairing
  fastify.patch("/:id/approve", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { approvedBy } = (request.body as { approvedBy?: string }) || {};

    const [updated] = await db
      .update(devicePairings)
      .set({
        status: "approved",
        approvedBy: approvedBy || "Authorized Clinician",
        approvedAt: new Date().toISOString(),
        token: `tok_paired_${randomUUID().replace(/-/g, "")}`,
      })
      .where(eq(devicePairings.id, id))
      .returning();

    if (!updated) {
      return reply.status(404).send({ error: "Pairing request not found" });
    }

    return reply.send(updated);
  });

  // Reject device pairing
  fastify.patch("/:id/reject", async (request, reply) => {
    const { id } = request.params as { id: string };

    const [updated] = await db
      .update(devicePairings)
      .set({
        status: "rejected",
      })
      .where(eq(devicePairings.id, id))
      .returning();

    if (!updated) {
      return reply.status(404).send({ error: "Pairing request not found" });
    }

    return reply.send(updated);
  });
};
