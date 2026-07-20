import "dotenv/config";
import { defineConfig } from "prisma/config";

// Fallback so `prisma generate` works during Vercel/npm install before env vars load.
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/pizzarela?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  engine: "classic",
  datasource: {
    url: databaseUrl,
  },
});
