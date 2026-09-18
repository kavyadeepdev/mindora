import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { config } from "../config.js";
import * as schema from "./schema/index.js";

const { Pool } = pg;

const hasSsl = 
  config.databaseUrl.includes("neon.tech") || 
  config.databaseUrl.includes("sslmode=require") ||
  config.nodeEnv === "production";

export const pool = new Pool({
  connectionString: config.databaseUrl ? config.databaseUrl : undefined,
  ssl: hasSsl ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle(pool, { schema });
