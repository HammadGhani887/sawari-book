import path from "node:path";
import { config } from "dotenv";

config();

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { defineConfig } = require("prisma/config");

module.exports = defineConfig({
  earlyAccess: true,
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrate: {
    adapter: async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PrismaPostgres } = require("@prisma/adapter-pg");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Pool } = require("pg");
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });
      return new PrismaPostgres(pool);
    },
  },
});
