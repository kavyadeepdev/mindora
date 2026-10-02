import type { IncomingMessage, ServerResponse } from "node:http";
import { buildServer } from "../src/index.js";

let app: any = null;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!app) {
    app = await buildServer();
    await app.ready();
  }
  app.server.emit("request", req, res);
}
