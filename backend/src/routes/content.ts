import { FastifyPluginAsync } from "fastify";
import { db } from "../db/index.js";
import {
  culturalMemories,
  familiarMemories,
  memoryCardItems,
  attentionPoolItems,
  patternSequences,
  performanceTrends,
} from "../db/schema/content.js";

export const contentRoutes: FastifyPluginAsync = async (fastify) => {
  // Cultural Memories
  fastify.get("/cultural-memories", async (_request, reply) => {
    const items = await db.select().from(culturalMemories);
    return reply.send({ items, count: items.length });
  });

  // Familiar Memories (reminiscence stories)
  fastify.get("/familiar-memories", async (_request, reply) => {
    const items = await db.select().from(familiarMemories);
    return reply.send({ items, count: items.length });
  });

  // Memory Card Items (cards pool for Memory Match)
  fastify.get("/memory-cards", async (_request, reply) => {
    const items = await db.select().from(memoryCardItems);
    return reply.send({ items, count: items.length });
  });

  // Attention Pool Items (items for Attention Challenge)
  fastify.get("/attention-pool", async (_request, reply) => {
    const items = await db.select().from(attentionPoolItems);
    return reply.send({ items, count: items.length });
  });

  // Pattern Sequences (pattern predict rhythms)
  fastify.get("/patterns", async (_request, reply) => {
    const items = await db.select().from(patternSequences);
    return reply.send({ items, count: items.length });
  });

  // Performance Trends
  fastify.get("/trends", async (_request, reply) => {
    const items = await db.select().from(performanceTrends);
    return reply.send({ items, count: items.length });
  });
};
