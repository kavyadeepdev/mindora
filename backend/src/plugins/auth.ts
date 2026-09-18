import { FastifyRequest, FastifyReply } from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: typeof auth.$Infer.Session.user | null;
    session?: typeof auth.$Infer.Session.session | null;
  }
}

export async function getAuthSession(request: FastifyRequest) {
  try {
    const headers = fromNodeHeaders(request.headers);
    const sessionData = await auth.api.getSession({
      headers,
    });
    return sessionData;
  } catch (error) {
    request.log.error({ err: error }, "Failed to get session from Better Auth");
    return null;
  }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const sessionData = await getAuthSession(request);
  if (!sessionData || !sessionData.user) {
    return reply.status(401).send({
      statusCode: 401,
      error: "Unauthorized",
      message: "Authentication required to access this resource",
    });
  }
  request.user = sessionData.user;
  request.session = sessionData.session;
}
