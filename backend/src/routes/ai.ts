import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { config } from "../config.js";

const recommendationRequestSchema = z.object({
  patientId: z.string().optional(),
  patientName: z.string().default("Anima Devi"),
  age: z.number().default(72),
  language: z.string().default("Assamese"),
  interests: z.array(z.string()).default(["Gardening", "Traditional Music", "Weaving"]),
  recentPerformance: z.record(z.unknown()).optional(),
  completedToday: z.array(z.string()).default([]),
});

export const aiRoutes: FastifyPluginAsync = async (fastify) => {
  // Check whether the external FastAPI recommendation service is reachable
  fastify.get("/service-status", async (_request, reply) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1500);

      const response = await fetch(`${config.fastapiServiceUrl}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.ok) {
        return reply.send({
          fastapiServiceUrl: config.fastapiServiceUrl,
          connected: true,
          status: "healthy",
        });
      }
      return reply.send({
        fastapiServiceUrl: config.fastapiServiceUrl,
        connected: false,
        status: `service returned ${response.status}`,
      });
    } catch {
      return reply.send({
        fastapiServiceUrl: config.fastapiServiceUrl,
        connected: false,
        status: "disconnected (service will be connected once FastAPI service is added)",
      });
    }
  });

  // Get AI Personalized Activity Recommendation
  // Forwards to FastAPI service when online, or falls back seamlessly
  fastify.post("/recommendation", async (request, reply) => {
    const parseResult = recommendationRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: parseResult.error.format() });
    }

    const payload = parseResult.data;

    // 1. Attempt forwarding to FastAPI microservice if configured
    if (config.fastapiServiceUrl) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        const apiResponse = await fetch(`${config.fastapiServiceUrl}/api/v1/recommendation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (apiResponse.ok) {
          const data = (await apiResponse.json()) as Record<string, unknown>;
          return reply.send({
            ...data,
            source: "fastapi-service",
          });
        }
      } catch {
        fastify.log.warn(
          `FastAPI service at ${config.fastapiServiceUrl} unreachable. Using rule-based fallback.`
        );
      }
    }

    // 2. Safe deterministic North-Eastern Region (NER) cultural fallback
    const activities = [
      {
        name: "Memory Match",
        culturalTheme: "Tea Garden Flowers & Utensils",
        reason: "Gentle visual recall with familiar cultural artifacts.",
      },
      {
        name: "Attention Challenge",
        culturalTheme: "Bihu Rhythm & Weaving Motifs",
        reason: "Active focus stimulation through rhythmic patterns.",
      },
      {
        name: "Pattern Recognition",
        culturalTheme: "Muga Silk & Traditional Borders",
        reason: "Pattern continuity promotes logical sequence recall.",
      },
      {
        name: "Daily Routine Recall",
        culturalTheme: "Morning Tea & Garden Stroll",
        reason: "Grounding routine sequence reinforcement for calmness.",
      },
    ];

    const selected =
      activities.find((a) => !payload.completedToday.includes(a.name)) || activities[0];

    return reply.send({
      recommendedActivity: selected.name,
      culturalTheme: selected.culturalTheme,
      reasoning: `Based on ${payload.patientName}'s interest in ${payload.interests[0] || "Gardening"}, ${selected.reason}`,
      encouragement: `Subho prabhat ${payload.patientName}! Take your gentle time and enjoy your quiet morning activity.`,
      isAiGenerated: false,
      source: "fallback-engine",
      fastapiConnected: false,
    });
  });
};
