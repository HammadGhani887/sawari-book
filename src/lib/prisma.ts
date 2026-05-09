import { Pool } from "pg";

// Prisma 7 — use require to avoid TypeScript module resolution issues
/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const { PrismaPg }     = require("@prisma/adapter-pg");
/* eslint-enable @typescript-eslint/no-require-imports */

// Singleton for Next.js hot reload
const globalForPrisma = globalThis as unknown as { prisma: ReturnType<typeof makePrisma> };

function makePrisma() {
  const pool    = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const prisma: any = globalForPrisma.prisma ?? makePrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
