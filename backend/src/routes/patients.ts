import { FastifyPluginAsync } from "fastify";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { randomUUID } from "crypto";
import { db } from "../db/index.js";
import { patientProfiles, caregiverProfiles, doctorProfiles, adminAuditLogs } from "../db/schema/patients.js";
import { getAuthSession, requireAuth } from "../plugins/auth.js";

const patientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  age: z.number().int().min(1).max(130),
  gender: z.string().optional(),
  location: z.string().optional(),
  language: z.enum(["en", "hi", "as", "bn", "kn"]).default("en"),
  interests: z.array(z.string()).default([]),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  culturalTheme: z.string().default("bengali-heritage"),
  diagnosis: z.string().optional(),
  stage: z.string().optional(),
  doctorId: z.string().optional(),
  doctorName: z.string().optional(),
  caregiverId: z.string().optional(),
  caregiverName: z.string().optional(),
  accessStatus: z.enum(["active", "pending", "revoked"]).default("active"),
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
  // Get patients with optional doctorId or caregiverId filter
  fastify.get("/", async (request, reply) => {
    const { doctorId, caregiverId } = request.query as { doctorId?: string; caregiverId?: string };
    const sessionAuth = await getAuthSession(request);

    let conditions: any[] = [];

    if (doctorId) {
      conditions.push(eq(patientProfiles.doctorId, doctorId));
    } else if (caregiverId) {
      conditions.push(eq(patientProfiles.caregiverId, caregiverId));
    } else if (sessionAuth?.user) {
      // Check if user is doctor, caregiver, or admin
      if ((sessionAuth.user as any).role === "doctor") {
        const [doc] = await db.select().from(doctorProfiles).where(eq(doctorProfiles.userId, sessionAuth.user.id)).limit(1);
        if (doc) conditions.push(eq(patientProfiles.doctorId, doc.id));
      } else if ((sessionAuth.user as any).role === "caregiver") {
        conditions.push(eq(patientProfiles.caregiverUserId, sessionAuth.user.id));
      }
    }

    let patients;
    if (conditions.length > 0) {
      patients = await db
        .select()
        .from(patientProfiles)
        .where(and(...conditions));
    } else {
      patients = await db.select().from(patientProfiles).limit(100);
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

  // Create patient profile (Typically by Doctor or Admin)
  fastify.post("/", async (request, reply) => {
    const parseResult = patientSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: parseResult.error.format() });
    }

    const sessionAuth = await getAuthSession(request);
    const data = parseResult.data;
    const id = data.id || `p-${randomUUID().slice(0, 8)}`;

    let doctorId = data.doctorId || null;
    let doctorName = data.doctorName || null;
    let caregiverId = data.caregiverId || null;
    let caregiverName = data.caregiverName || null;
    let caregiverUserId: string | null = null;

    // Resolve doctor if session is doctor
    if (!doctorId && sessionAuth?.user && (sessionAuth.user as any).role === "doctor") {
      const [doc] = await db.select().from(doctorProfiles).where(eq(doctorProfiles.userId, sessionAuth.user.id)).limit(1);
      if (doc) {
        doctorId = doc.id;
        doctorName = doc.name;
      }
    }

    // Resolve caregiver details if caregiverId provided
    if (caregiverId) {
      const [cg] = await db.select().from(caregiverProfiles).where(eq(caregiverProfiles.id, caregiverId)).limit(1);
      if (cg) {
        caregiverName = cg.name;
        caregiverUserId = cg.userId;

        // Update caregiver linked patient list
        const existingLinks = (cg.linkedPatientIds as string[]) || [];
        if (!existingLinks.includes(id)) {
          await db
            .update(caregiverProfiles)
            .set({ linkedPatientIds: [...existingLinks, id] })
            .where(eq(caregiverProfiles.id, caregiverId));
        }
      }
    }

    const [created] = await db
      .insert(patientProfiles)
      .values({
        id,
        doctorId,
        doctorName,
        caregiverUserId,
        caregiverId,
        caregiverName,
        name: data.name,
        age: data.age,
        gender: data.gender,
        location: data.location,
        language: data.language,
        interests: data.interests,
        avatarUrl: data.avatarUrl,
        culturalTheme: data.culturalTheme,
        diagnosis: data.diagnosis,
        stage: data.stage,
        accessStatus: data.accessStatus,
        dailyRoutine: data.dailyRoutine,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Log to admin audit
    await db.insert(adminAuditLogs).values({
      id: `log-${randomUUID().slice(0, 8)}`,
      actionType: "patient_added",
      actorEmail: sessionAuth?.user?.email || "doctor_api",
      actorRole: (sessionAuth?.user as any)?.role || "doctor",
      targetId: id,
      targetName: data.name,
      details: `New patient added and assigned to Doctor: ${doctorName || doctorId || "Unassigned"}, Caregiver: ${caregiverName || "Unassigned"}`,
      timestamp: new Date(),
    });

    return reply.status(201).send(created);
  });

  // Assign or change caretaker for a patient (Doctor or Admin authority)
  fastify.put("/:id/assign-caregiver", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { caregiverId } = request.body as { caregiverId: string };

    if (!caregiverId) {
      return reply.status(400).send({ error: "caregiverId is required" });
    }

    const [patient] = await db.select().from(patientProfiles).where(eq(patientProfiles.id, id)).limit(1);
    if (!patient) {
      return reply.status(404).send({ error: "Patient not found" });
    }

    const [cg] = await db.select().from(caregiverProfiles).where(eq(caregiverProfiles.id, caregiverId)).limit(1);
    if (!cg) {
      return reply.status(404).send({ error: "Caregiver not found" });
    }

    // Update patient record
    const [updated] = await db
      .update(patientProfiles)
      .set({
        caregiverId: cg.id,
        caregiverName: cg.name,
        caregiverUserId: cg.userId,
        updatedAt: new Date(),
      })
      .where(eq(patientProfiles.id, id))
      .returning();

    // Update caregiver linked patients
    const currentList = (cg.linkedPatientIds as string[]) || [];
    if (!currentList.includes(id)) {
      await db
        .update(caregiverProfiles)
        .set({ linkedPatientIds: [...currentList, id] })
        .where(eq(caregiverProfiles.id, caregiverId));
    }

    const sessionAuth = await getAuthSession(request);
    await db.insert(adminAuditLogs).values({
      id: `log-${randomUUID().slice(0, 8)}`,
      actionType: "caregiver_assigned",
      actorEmail: sessionAuth?.user?.email || "authorized_user",
      actorRole: (sessionAuth?.user as any)?.role || "doctor_or_admin",
      targetId: id,
      targetName: patient.name,
      details: `Caregiver ${cg.name} assigned to patient ${patient.name}`,
      timestamp: new Date(),
    });

    return reply.send({ success: true, patient: updated, caregiver: cg });
  });

  // Update patient access status (active / revoked)
  fastify.put("/:id/status", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { accessStatus } = request.body as { accessStatus: "active" | "pending" | "revoked" };

    const [updated] = await db
      .update(patientProfiles)
      .set({ accessStatus, updatedAt: new Date() })
      .where(eq(patientProfiles.id, id))
      .returning();

    if (!updated) {
      return reply.status(404).send({ error: "Patient not found" });
    }

    const sessionAuth = await getAuthSession(request);
    await db.insert(adminAuditLogs).values({
      id: `log-${randomUUID().slice(0, 8)}`,
      actionType: "access_revocation",
      actorEmail: sessionAuth?.user?.email || "admin",
      actorRole: (sessionAuth?.user as any)?.role || "admin",
      targetId: id,
      targetName: updated.name,
      details: `Patient access status updated to: ${accessStatus}`,
      timestamp: new Date(),
    });

    return reply.send(updated);
  });

  // General update patient profile
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
