import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import sensible from "@fastify/sensible";

import { config } from "./config.js";
import { pool } from "./db/index.js";
import { authRoutes } from "./routes/auth.js";
import { gamesRoutes } from "./routes/games.js";
import { patientsRoutes } from "./routes/patients.js";
import { remindersRoutes } from "./routes/reminders.js";
import { alertsRoutes } from "./routes/alerts.js";
import { aiRoutes } from "./routes/ai.js";
import { contentRoutes } from "./routes/content.js";
import { doctorsRoutes } from "./routes/doctors.js";
import { activityPlansRoutes } from "./routes/activityPlans.js";
import { pairingsRoutes } from "./routes/pairings.js";
import { adminRoutes } from "./routes/admin.js";

export async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: config.nodeEnv === "development" ? "info" : "warn",
    },
  });

  // Global plugins
  await fastify.register(sensible);

  await fastify.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return cb(null, true);
      if (
        config.corsOrigins.includes(origin) ||
        config.nodeEnv === "development"
      ) {
        return cb(null, true);
      }
      return cb(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  });

  await fastify.register(cookie);

  // Health check endpoint
  fastify.get("/api/health", async (_request, reply) => {
    let dbStatus = "unconfigured";
    if (config.databaseUrl) {
      try {
        const client = await pool.connect();
        await client.query("SELECT 1");
        client.release();
        dbStatus = "connected";
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        dbStatus = `error: ${msg}`;
      }
    }

    return reply.send({
      status: "ok",
      service: "@mindora/backend",
      version: "0.1.0",
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        provider: "Neon PostgreSQL",
      },
      auth: {
        provider: "Better Auth",
        configured: Boolean(config.betterAuthSecret),
      },
      fastapiAiService: {
        configuredUrl: config.fastapiServiceUrl,
      },
    });
  });

  // API Routes
  await fastify.register(authRoutes, { prefix: "/api/auth" });
  await fastify.register(gamesRoutes, { prefix: "/api/games" });
  await fastify.register(patientsRoutes, { prefix: "/api/patients" });
  await fastify.register(remindersRoutes, { prefix: "/api/reminders" });
  await fastify.register(alertsRoutes, { prefix: "/api/alerts" });
  await fastify.register(aiRoutes, { prefix: "/api/ai" });
  await fastify.register(contentRoutes, { prefix: "/api/content" });
  await fastify.register(doctorsRoutes, { prefix: "/api/doctors" });
  await fastify.register(activityPlansRoutes, { prefix: "/api/activity-plans" });
  await fastify.register(pairingsRoutes, { prefix: "/api/pairings" });
  await fastify.register(adminRoutes, { prefix: "/api/admin" });

  return fastify;
}

async function start() {
  const server = await buildServer();

  try {
    const address = await server.listen({
      port: config.port,
      host: config.host,
    });
    server.log.info(`Mindora Backend Server listening on ${address}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

// Only start when invoked directly
if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}

// Default export for Vercel Serverless Function execution
let serverlessApp: any = null;
export default async function handler(req: any, res: any) {
  if (!serverlessApp) {
    serverlessApp = await buildServer();
    await serverlessApp.ready();
  }
  serverlessApp.server.emit("request", req, res);
}

