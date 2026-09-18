import { FastifyPluginAsync } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { doctorProfiles } from "../db/schema/patients.js";

export const doctorsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/", async (_request, reply) => {
    const doctors = await db.select().from(doctorProfiles);
    return reply.send({ items: doctors, count: doctors.length });
  });

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
};
