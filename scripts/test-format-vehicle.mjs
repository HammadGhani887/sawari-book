/**
 * Test formatVehicle function directly
 */
import { Pool } from "pg";
import * as dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Import Prisma
const { PrismaClient } = await import("@prisma/client");
const { PrismaPg } = await import("@prisma/adapter-pg");

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

try {
  const vehicle = await prisma.vehicle.findFirst({
    where: { isActive: true },
  });

  console.log("Raw Prisma vehicle:");
  console.log(JSON.stringify(vehicle, null, 2));

  // Simulate formatVehicle function
  const formatted = {
    id:                 vehicle.id,
    ownerId:            vehicle.ownerId,
    plateNumber:        vehicle.plateNumber,
    makeModel:          vehicle.makeModel,
    fuelType:           vehicle.fuelType.toLowerCase(),
    platforms:          vehicle.platforms,
    insuranceExpiry:    vehicle.insuranceExpiry?.toISOString().slice(0, 10) ?? undefined,
    photoUrl:           vehicle.photoUrl ?? undefined,
    isActive:           vehicle.isActive,
    fuelAverageKmL:     vehicle.fuelAverageKmL ? Number(vehicle.fuelAverageKmL) : undefined,
    petrolPricePkrL:    vehicle.petrolPricePkrL ? Number(vehicle.petrolPricePkrL) : undefined,
    tankCapacityLitres: vehicle.tankCapacityLitres ? Number(vehicle.tankCapacityLitres) : undefined,
  };

  console.log("\nFormatted vehicle:");
  console.log(JSON.stringify(formatted, null, 2));

  console.log("\nFuel settings:");
  console.log(`  fuelAverageKmL: ${formatted.fuelAverageKmL}`);
  console.log(`  petrolPricePkrL: ${formatted.petrolPricePkrL}`);
  console.log(`  tankCapacityLitres: ${formatted.tankCapacityLitres}`);

  await prisma.$disconnect();
} catch (e) {
  console.error("Error:", e.message);
  console.error(e.stack);
} finally {
  await pool.end();
}
