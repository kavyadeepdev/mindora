import { FastifyPluginAsync } from "fastify";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../db/index.js";
import {
  doctorProfiles,
  patientProfiles,
  caregiverProfiles,
  adminAuditLogs,
  devicePairings,
} from "../db/schema/patients.js";
import { user } from "../db/schema/auth.js";
import { sql } from "drizzle-orm";
import { getAuthSession } from "../plugins/auth.js";

export const adminRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Dashboard Overview Stats
  fastify.get("/overview", async (request, reply) => {
    const allDoctors = await db.select().from(doctorProfiles);
    const allPatients = await db.select().from(patientProfiles);
    const allCaregivers = await db.select().from(caregiverProfiles);
    const recentLogs = await db.select().from(adminAuditLogs).orderBy(desc(adminAuditLogs.timestamp)).limit(10);
    const pairings = await db.select().from(devicePairings);

    const pendingDoctors = allDoctors.filter(d => d.verificationStatus === "pending_approval");
    const approvedDoctors = allDoctors.filter(d => d.verificationStatus === "approved");

    return reply.send({
      stats: {
        totalDoctors: allDoctors.length,
        approvedDoctors: approvedDoctors.length,
        pendingDoctors: pendingDoctors.length,
        totalPatients: allPatients.length,
        activePatients: allPatients.filter(p => p.accessStatus === "active").length,
        totalCaregivers: allCaregivers.length,
        totalDevicePairings: pairings.length,
        pendingPairings: pairings.filter(p => p.status === "pending").length,
      },
      recentLogs,
    });
  });

  // 2. Doctor Management & Statutory Verification
  fastify.get("/doctors", async (_request, reply) => {
    const doctors = await db.select().from(doctorProfiles);
    return reply.send({ items: doctors, count: doctors.length });
  });

  fastify.post("/doctors/:id/verify", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { action, reason } = request.body as { action: "approve" | "reject" | "revoke"; reason?: string };

    const [doc] = await db.select().from(doctorProfiles).where(eq(doctorProfiles.id, id)).limit(1);
    if (!doc) {
      return reply.status(404).send({ error: "Doctor profile not found" });
    }

    const sessionAuth = await getAuthSession(request);
    const adminEmail = sessionAuth?.user?.email || "admin@mindora.health";

    let verificationStatus: "approved" | "rejected" | "revoked" = "approved";
    let userStatus = "active";

    if (action === "approve") {
      verificationStatus = "approved";
      userStatus = "active";
    } else if (action === "reject") {
      verificationStatus = "rejected";
      userStatus = "suspended";
    } else if (action === "revoke") {
      verificationStatus = "revoked";
      userStatus = "revoked";
    }

    const [updated] = await db
      .update(doctorProfiles)
      .set({
        verificationStatus,
        rejectionReason: reason || null,
        approvedAt: action === "approve" ? new Date() : null,
        approvedBy: action === "approve" ? adminEmail : null,
      })
      .where(eq(doctorProfiles.id, id))
      .returning();

    // Update user status
    if (doc.userId) {
      await db
        .update(user)
        .set({ status: userStatus })
        .where(sql`id = ${doc.userId}`);
    }

    // Log to admin audit
    await db.insert(adminAuditLogs).values({
      id: `log-${randomUUID().slice(0, 8)}`,
      actionType: action === "approve" ? "doctor_approval" : action === "reject" ? "doctor_rejection" : "access_revocation",
      actorEmail: adminEmail,
      actorRole: "super_admin",
      targetId: doc.id,
      targetName: doc.name,
      details: `Action: ${action.toUpperCase()} on doctor ${doc.name} (License: ${doc.medicalRegistrationNumber}). Reason/Note: ${reason || "Verified with Medical Council"}`,
      timestamp: new Date(),
    });

    return reply.send({ success: true, doctor: updated });
  });

  // 3. Patient Management
  fastify.get("/patients", async (_request, reply) => {
    const patients = await db.select().from(patientProfiles);
    return reply.send({ items: patients, count: patients.length });
  });

  fastify.put("/patients/:id/status", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { accessStatus } = request.body as { accessStatus: "active" | "revoked" | "pending" };

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
      actorEmail: sessionAuth?.user?.email || "admin@mindora.health",
      actorRole: "super_admin",
      targetId: id,
      targetName: updated.name,
      details: `Super Admin set patient access status to: ${accessStatus}`,
      timestamp: new Date(),
    });

    return reply.send(updated);
  });

  // Admin assigns or reassigns doctor and/or caregiver to a patient
  fastify.put("/patients/:id/assign", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { doctorId, caregiverId } = request.body as { doctorId?: string; caregiverId?: string };

    const [patient] = await db.select().from(patientProfiles).where(eq(patientProfiles.id, id)).limit(1);
    if (!patient) {
      return reply.status(404).send({ error: "Patient not found" });
    }

    const updateData: any = { updatedAt: new Date() };

    if (doctorId) {
      const [doc] = await db.select().from(doctorProfiles).where(eq(doctorProfiles.id, doctorId)).limit(1);
      if (doc) {
        updateData.doctorId = doc.id;
        updateData.doctorName = doc.name;

        // update doctor links
        const docLinks = (doc.linkedPatientIds as string[]) || [];
        if (!docLinks.includes(id)) {
          await db.update(doctorProfiles).set({ linkedPatientIds: [...docLinks, id] }).where(eq(doctorProfiles.id, doc.id));
        }
      }
    }

    if (caregiverId) {
      const [cg] = await db.select().from(caregiverProfiles).where(eq(caregiverProfiles.id, caregiverId)).limit(1);
      if (cg) {
        updateData.caregiverId = cg.id;
        updateData.caregiverName = cg.name;
        updateData.caregiverUserId = cg.userId;

        // update caregiver links
        const cgLinks = (cg.linkedPatientIds as string[]) || [];
        if (!cgLinks.includes(id)) {
          await db.update(caregiverProfiles).set({ linkedPatientIds: [...cgLinks, id] }).where(eq(caregiverProfiles.id, cg.id));
        }
      }
    }

    const [updated] = await db
      .update(patientProfiles)
      .set(updateData)
      .where(eq(patientProfiles.id, id))
      .returning();

    const sessionAuth = await getAuthSession(request);
    await db.insert(adminAuditLogs).values({
      id: `log-${randomUUID().slice(0, 8)}`,
      actionType: "caregiver_assigned",
      actorEmail: sessionAuth?.user?.email || "admin@mindora.health",
      actorRole: "super_admin",
      targetId: id,
      targetName: patient.name,
      details: `Reassigned by Super Admin: Doctor -> ${updateData.doctorName || patient.doctorName}, Caregiver -> ${updateData.caregiverName || patient.caregiverName}`,
      timestamp: new Date(),
    });

    return reply.send(updated);
  });

  // 4. Caregiver Management
  fastify.get("/caregivers", async (_request, reply) => {
    const caregivers = await db.select().from(caregiverProfiles);
    return reply.send({ items: caregivers, count: caregivers.length });
  });

  fastify.put("/caregivers/:id/status", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: "active" | "revoked" };

    const [updated] = await db
      .update(caregiverProfiles)
      .set({ status })
      .where(eq(caregiverProfiles.id, id))
      .returning();

    if (!updated) {
      return reply.status(404).send({ error: "Caregiver not found" });
    }

    const sessionAuth = await getAuthSession(request);
    await db.insert(adminAuditLogs).values({
      id: `log-${randomUUID().slice(0, 8)}`,
      actionType: "access_revocation",
      actorEmail: sessionAuth?.user?.email || "admin@mindora.health",
      actorRole: "super_admin",
      targetId: id,
      targetName: updated.name,
      details: `Caregiver status changed to: ${status}`,
      timestamp: new Date(),
    });

    return reply.send(updated);
  });

  // 5. Audit Trail
  fastify.get("/audit-logs", async (_request, reply) => {
    const logs = await db.select().from(adminAuditLogs).orderBy(desc(adminAuditLogs.timestamp)).limit(50);
    return reply.send({ items: logs, count: logs.length });
  });

  // 6. Device Pairings / Sign-in Request Authorization
  fastify.get("/pairings", async (_request, reply) => {
    const pairings = await db.select().from(devicePairings).orderBy(desc(devicePairings.createdAt));
    return reply.send({ items: pairings, count: pairings.length });
  });

  fastify.put("/pairings/:id/approve", async (request, reply) => {
    const { id } = request.params as { id: string };
    const sessionAuth = await getAuthSession(request);
    const adminEmail = sessionAuth?.user?.email || "admin@mindora.health";

    const [pairing] = await db.select().from(devicePairings).where(eq(devicePairings.id, id)).limit(1);
    if (!pairing) {
      return reply.status(404).send({ error: "Pairing request not found" });
    }

    const [updated] = await db
      .update(devicePairings)
      .set({
        status: "approved",
        approvedBy: adminEmail,
        approvedAt: new Date().toISOString(),
        token: `tok_pair_${randomUUID().slice(0, 12)}`,
      })
      .where(eq(devicePairings.id, id))
      .returning();

    await db.insert(adminAuditLogs).values({
      id: `log-${randomUUID().slice(0, 8)}`,
      actionType: "patient_signin_approved",
      actorEmail: adminEmail,
      actorRole: "super_admin",
      targetId: pairing.id,
      targetName: pairing.deviceName,
      details: `Device pairing approved for patient: ${pairing.patientName || "Living Room Screen"}`,
      timestamp: new Date(),
    });

    return reply.send(updated);
  });

  fastify.put("/pairings/:id/revoke", async (request, reply) => {
    const { id } = request.params as { id: string };
    const sessionAuth = await getAuthSession(request);
    const adminEmail = sessionAuth?.user?.email || "admin@mindora.health";

    const [updated] = await db
      .update(devicePairings)
      .set({ status: "revoked" })
      .where(eq(devicePairings.id, id))
      .returning();

    if (!updated) {
      return reply.status(404).send({ error: "Pairing request not found" });
    }

    await db.insert(adminAuditLogs).values({
      id: `log-${randomUUID().slice(0, 8)}`,
      actionType: "access_revocation",
      actorEmail: adminEmail,
      actorRole: "super_admin",
      targetId: updated.id,
      targetName: updated.deviceName,
      details: `Device pairing revoked for device: ${updated.deviceName}`,
      timestamp: new Date(),
    });

    return reply.send(updated);
  });
};
