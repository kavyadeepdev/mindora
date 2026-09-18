import { FastifyPluginAsync } from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth.js";

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.route({
    method: ["GET", "POST"],
    url: "/*",
    handler: async (request, reply) => {
      const protocol = request.protocol || "http";
      const host = request.headers.host || `localhost:${request.port}`;
      const url = new URL(request.url, `${protocol}://${host}`);
      const headers = fromNodeHeaders(request.headers);

      const req = new Request(url.toString(), {
        method: request.method,
        headers,
        body: request.body ? JSON.stringify(request.body) : undefined,
      });

      const res = await auth.handler(req);
      reply.status(res.status);
      res.headers.forEach((value, key) => reply.header(key, value));
      return reply.send(res.body ? await res.text() : null);
    },
  });
};
