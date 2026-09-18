import { FastifyPluginAsync } from "fastify";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { randomUUID } from "crypto";
import { db } from "../db/index.js";
import { patientProfiles, caregiverProfiles } from "../db/schema/patients.js";
import { getAuthSession, requireAuth } from "../plugins/auth.js";

const patientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  age: z.number().int().min(1).max(130),
  gender: z.string().optional(),
  location: z.string().optional(),
  language: z.enum(["en", "hi", "as"]).default("en"),
  interests: z.array(z.string()).default([]),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  culturalTheme: z.string().default("tea-gardens"),
  dailyRoutine: z
    .object({
      morningWakeUp: z.string().default("06:30 AM"),
      morningHydration: z.string().default("07:00 AM"),
      morningMeds: z.string().default("08:00 AM"),
      breakfast: z.string().default("08:30 AM"),
      morningWalk: z.string().default("09:30 AM"),
      eveningTea: z.string().default("04:30 PM"),
      nightSleep: z.string().default("09:30 PM"),
    })
    .optional(),
});

export const patientsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all patients
  fastify.get("/", async (request, reply) => {
    const sessionAuth = await getAuthSession(request);
    let patients;

    if (sessionAuth?.user) {
      patients = await db
        .select()
        .from(patientProfiles)
        .where(eq(patientProfiles.caregiverUserId, sessionAuth.user.id));
    } else {
      patients = await db.select().from(patientProfiles).limit(50);
    }

    return reply.send({ items: patients, count: patients.length });
  });

  // Get specific patient
  fastify.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const [patient] = await db
      .select()
      .from(patientProfiles)
      .where(eq(patientProfiles.id, id))
      .limit(1);

    if (!patient) {
      return reply.status(404).send({ error: "Patient not found" });
    }

    return reply.send(patient);
  });

  // Create patient profile
  fastify.post("/", async (request, reply) => {
    const parseResult = patientSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: parseResult.error.format() });
    }

    const sessionAuth = await getAuthSession(request);
    const caregiverUserId = sessionAuth?.user?.id ?? null;
    const data = parseResult.data;
    const id = data.id || randomUUID();

    const [created] = await db
      .insert(patientProfiles)
      .values({
        id,
        caregiverUserId,
        name: data.name,
        age: data.age,
        gender: data.gender,
        location: data.location,
        language: data.language,
        interests: data.interests,
        avatarUrl: data.avatarUrl,
        culturalTheme: data.culturalTheme,
        dailyRoutine: data.dailyRoutine,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return reply.status(201).send(created);
  });

  // Update patient profile
  fastify.put("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parseResult = patientSchema.partial().safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({ error: parseResult.error.format() });
    }

    const data = parseResult.data;

    const [updated] = await db
      .update(patientProfiles)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(patientProfiles.id, id))
      .returning();

    if (!updated) {
      return reply.status(404).send({ error: "Patient not found" });
    }

    return reply.send(updated);
  });

  // Get caregiver profile for logged in user
  fastify.get("/caregiver/profile", { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.user!.id;

    const [profile] = await db
      .select()
      .from(caregiverProfiles)
      .where(eq(caregiverProfiles.userId, userId))
      .limit(1);

    if (!profile) {
      return reply.send({
        userId,
        name: request.user!.name,
        relation: "Family Caregiver",
        phone: "",
        linkedPatientIds: [],
      });
    }

    return reply.send(profile);
  });
};
