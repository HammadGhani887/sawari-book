import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  earlyAccess: true,
  schema: path.join("prisma", "schema.prisma"),
  migrate: {
    adapter: async () => {
      const { PrismaMysql } = await import("@prisma/adapter-mysql");
      const { createPool }  = await import("mysql2/promise");
      const pool = createPool(process.env.DATABASE_URL!);
      return new PrismaMysql(pool);
    },
  },
});
