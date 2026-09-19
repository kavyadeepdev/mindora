import { FastifyPluginAsync } from "fastify";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { randomUUID } from "crypto";
import { db } from "../db/index.js";
import { doctorProfiles, patientProfiles, caregiverProfiles, adminAuditLogs } from "../db/schema/patients.js";
import { user } from "../db/schema/auth.js";
import { auth } from "../auth.js";
import { sql } from "drizzle-orm";

const doctorRegistrationSchema = z.object({
  name: z.string().min(2, "Full Doctor Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().min(6, "Phone is required"),
  hospital: z.string().min(2, "Hospital or Clinic affiliation is required"),
  specialty: z.string().default("Neuro-Geriatrics & Cognitive Care"),
  medicalRegistrationNumber: z.string().min(3, "Statutory Medical Registration / License number (NMC/State Council) is mandated by law"),
  medicalCouncil: z.string().min(2, "State Medical Council / Licensing authority is required"),
  registrationYear: z.number().int().min(1960).max(2026),
  qualification: z.string().min(2, "Primary medical qualifications (e.g. MBBS, MD) are required"),
});

export const doctorsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all doctors (public or directory view)
  fastify.get("/", async (_request, reply) => {
    const doctors = await db.select().from(doctorProfiles);
    return reply.send({ items: doctors, count: doctors.length });
  });

  // Get single doctor profile
  fastify.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const [doc] = await db
      .select()
      .from(doctorProfiles)
      .where(eq(doctorProfiles.id, id))
      .limit(1);

    if (!doc) {
      return reply.status(404).send({ error: "Doctor profile not found" });
    }
    return reply.send(doc);
  });

  // Get patients for a specific doctor (Doctor Cohort Segregation)
  fastify.get("/:id/patients", async (request, reply) => {
    const { id } = request.params as { id: string };

    const patients = await db
      .select()
      .from(patientProfiles)
      .where(eq(patientProfiles.doctorId, id));

    return reply.send({ items: patients, count: patients.length });
  });

  // Doctor Registration with Statutory Credentials
  fastify.post("/register", async (request, reply) => {
    const parseResult = doctorRegistrationSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: parseResult.error.format() });
    }

    const data = parseResult.data;

    // Check if email already registered
    const [existing] = await db.select().from(user).where(eq(user.email, data.email)).limit(1);
    if (existing) {
      return reply.status(400).send({ error: "A user account with this email address already exists." });
    }

    let userId = `usr-doc-${randomUUID().slice(0, 8)}`;
    try {
      const authUser = await auth.api.signUpEmail({
        body: {
          name: data.name,
          email: data.email,
          password: data.password,
        },
      });
      if (authUser?.user?.id) {
        userId = authUser.user.id;
      }
    } catch {
      // Direct insertion fallback
      await db.insert(user).values({
        id: userId,
        name: data.name,
        email: data.email,
        emailVerified: false,
        role: "doctor",
        status: "pending_approval",
      });
    }

    // Update user status and role to pending_approval
    await db
      .update(user)
      .set({ role: "doctor", status: "pending_approval" })
      .where(sql`id = ${userId}`);

    const doctorId = `doc-${randomUUID().slice(0, 8)}`;
    const [createdDoc] = await db
      .insert(doctorProfiles)
      .values({
        id: doctorId,
        userId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        hospital: data.hospital,
        specialty: data.specialty,
        medicalRegistrationNumber: data.medicalRegistrationNumber,
        medicalCouncil: data.medicalCouncil,
        registrationYear: data.registrationYear,
        qualification: data.qualification,
        verificationStatus: "pending_approval",
        linkedPatientIds: [],
        createdAt: new Date(),
      })
      .returning();

    // Log statutory submission in admin audit trail
    await db.insert(adminAuditLogs).values({
      id: `log-${randomUUID().slice(0, 8)}`,
      actionType: "doctor_signup",
      actorEmail: data.email,
      actorRole: "doctor_applicant",
      targetId: doctorId,
      targetName: data.name,
      details: `Doctor registration submitted with License: ${data.medicalRegistrationNumber} (${data.medicalCouncil}), Qualification: ${data.qualification}. Awaiting Super Admin review.`,
      timestamp: new Date(),
    });

    return reply.status(201).send({
      status: "pending_approval",
      message: "Doctor registration and statutory medical license submitted successfully. Access will be unlocked upon Super Admin verification.",
      doctor: createdDoc,
    });
  });

  // Doctor adds a patient to their assigned cohort
  fastify.post("/:id/patients", async (request, reply) => {
    const { id } = request.params as { id: string };
    const [doc] = await db.select().from(doctorProfiles).where(eq(doctorProfiles.id, id)).limit(1);

    if (!doc) {
      return reply.status(404).send({ error: "Doctor profile not found" });
    }

    if (doc.verificationStatus !== "approved") {
      return reply.status(403).send({ error: "Doctor account is not approved for clinical admissions." });
    }

    const patientData = request.body as any;
    if (!patientData.name || !patientData.age) {
      return reply.status(400).send({ error: "Patient name and age are required." });
    }

    const patientId = patientData.id || `p-${randomUUID().slice(0, 8)}`;
    let caregiverName = patientData.caregiverName || null;
    let caregiverUserId: string | null = null;

    if (patientData.caregiverId) {
      const [cg] = await db.select().from(caregiverProfiles).where(eq(caregiverProfiles.id, patientData.caregiverId)).limit(1);
      if (cg) {
        caregiverName = cg.name;
        caregiverUserId = cg.userId;
        const currentLinks = (cg.linkedPatientIds as string[]) || [];
        if (!currentLinks.includes(patientId)) {
          await db
            .update(caregiverProfiles)
            .set({ linkedPatientIds: [...currentLinks, patientId] })
            .where(eq(caregiverProfiles.id, cg.id));
        }
      }
    }

    const [createdPatient] = await db
      .insert(patientProfiles)
      .values({
        id: patientId,
        doctorId: doc.id,
        doctorName: doc.name,
        caregiverId: patientData.caregiverId || null,
        caregiverName,
        caregiverUserId,
        name: patientData.name,
        age: Number(patientData.age),
        gender: patientData.gender || "Other",
        location: patientData.location || "Clinic Outpatient",
        language: patientData.language || "bn",
        culturalTheme: patientData.culturalTheme || "bengali-heritage",
        diagnosis: patientData.diagnosis || "Mild Cognitive Impairment",
        stage: patientData.stage || "Early Stage",
        accessStatus: "active",
        interests: patientData.interests || ["Music", "Family Memories"],
        avatarUrl: patientData.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        dailyRoutine: patientData.dailyRoutine || {
          morningWakeUp: "06:30 AM",
          morningHydration: "07:00 AM",
          morningMeds: "08:00 AM",
          breakfast: "08:30 AM",
          morningWalk: "09:30 AM",
          eveningTea: "04:30 PM",
          nightSleep: "09:30 PM",
        },
        accessibility: patientData.accessibility || { largeText: true, highContrast: false, reduceMotion: false, audioFeedback: true },
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Update doctor's linked patient list
    const currentDocPatients = (doc.linkedPatientIds as string[]) || [];
    await db
      .update(doctorProfiles)
      .set({ linkedPatientIds: [...currentDocPatients, patientId] })
      .where(eq(doctorProfiles.id, doc.id));

    // Log to admin audit
    await db.insert(adminAuditLogs).values({
      id: `log-${randomUUID().slice(0, 8)}`,
      actionType: "patient_added",
      actorEmail: doc.email || "doctor",
      actorRole: "doctor",
      targetId: patientId,
      targetName: createdPatient.name,
      details: `Added by ${doc.name} (${doc.medicalRegistrationNumber}). Assigned Caregiver: ${caregiverName || "None"}`,
      timestamp: new Date(),
    });

    return reply.status(201).send(createdPatient);
  });
};
