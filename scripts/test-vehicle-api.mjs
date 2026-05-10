/**
 * Test /api/vehicles endpoint to see what it returns
 */
import { Pool } from "pg";
import * as dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  // Get vehicle directly from DB
  const dbVehicle = await pool.query(`
    SELECT id, "makeModel", "plateNumber", "fuelAverageKmL", "petrolPricePkrL", "tankCapacityLitres"
    FROM vehicles
    WHERE "isActive" = true
    LIMIT 1
  `);

  console.log("DB Vehicle:");
  console.log(JSON.stringify(dbVehicle.rows[0], null, 2));

  // Now test what Prisma returns
  const { PrismaClient } = await import("@prisma/client");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const prismaVehicle = await prisma.vehicle.findFirst({
    where: { isActive: true },
  });

  console.log("\nPrisma Vehicle:");
  console.log(JSON.stringify(prismaVehicle, null, 2));

  await prisma.$disconnect();

} catch (e) {
  console.error("Error:", e.message);
  console.error(e.stack);
} finally {
  await pool.end();
}
