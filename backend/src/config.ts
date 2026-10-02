import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  host: process.env.HOST || "0.0.0.0",
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "",
  betterAuthSecret: process.env.BETTER_AUTH_SECRET || "mindora_default_secret_please_set_in_env_32chars_min",
  betterAuthUrl: process.env.BETTER_AUTH_URL || `http://localhost:${process.env.PORT || 4000}`,
  corsOrigins: (process.env.CORS_ORIGIN || "http://localhost:3000,http://localhost:5173").split(",").map(o => o.trim()),
  fastapiServiceUrl: process.env.FASTAPI_SERVICE_URL || "http://localhost:8000",
  groqApiKey: process.env.GROQ_API_KEY || "",
  groqModel: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
};
