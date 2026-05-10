/**
 * Add default fuel settings to existing vehicle
 */
import { Pool } from "pg";
import * as dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  // Get all vehicles without fuel settings
  const vehicles = await pool.query(`
    SELECT id, "makeModel", "plateNumber", "fuelAverageKmL", "petrolPricePkrL", "tankCapacityLitres"
    FROM vehicles
    WHERE "isActive" = true
  `);

  console.log(`Found ${vehicles.rows.length} vehicle(s):`);
  vehicles.rows.forEach(v => console.log(` - ${v.makeModel} (${v.plateNumber}): avg=${v.fuelAverageKmL}, price=${v.petrolPricePkrL}, tank=${v.tankCapacityLitres}`));

  // Update vehicles without settings
  for (const v of vehicles.rows) {
    if (!v.fuelAverageKmL || !v.petrolPricePkrL) {
      await pool.query(`
        UPDATE vehicles
        SET "fuelAverageKmL" = $1, "petrolPricePkrL" = $2, "tankCapacityLitres" = $3
        WHERE id = $4
      `, [12, 280, 35, v.id]);
      console.log(`✅ Updated ${v.makeModel}: avg=12km/L, price=Rs280/L, tank=35L`);
    }
  }

  // Verify
  const updated = await pool.query(`SELECT id, "makeModel", "fuelAverageKmL", "petrolPricePkrL" FROM vehicles WHERE "isActive" = true`);
  console.log(`\nAll vehicles now:`);
  updated.rows.forEach(v => console.log(` - ${v.makeModel}: ${v.fuelAverageKmL}km/L @ Rs${v.petrolPricePkrL}/L`));

} catch (e) {
  console.error("Error:", e.message);
} finally {
  await pool.end();
}
