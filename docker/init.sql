-- Mindora Local Database Initialization Script
-- Executed on container creation

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Notice to developer
DO $$
BEGIN
  RAISE NOTICE 'Mindora PostgreSQL initialized successfully. Run "bun run db:push" and "bun run db:seed" to migrate and seed data.';
END $$;
