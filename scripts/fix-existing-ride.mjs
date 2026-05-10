/**
 * Update existing ride with estimated fuel cost
 */
import { Pool } from "pg";
import * as dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  const today = new Date().toISOString().slice(0, 10);
  
  // Get today's ride
  const rides = await pool.query(`
    SELECT id, "fareAmount", "pickupArea", "dropoffArea", "distanceKm", "estimatedFuelCost"
    FROM rides 
    WHERE "rideTime"::date = $1
  `, [today]);

  console.log(`Found ${rides.rows.length} ride(s) today:`);
  rides.rows.forEach(r => console.log(r));

  if (rides.rows.length > 0) {
    const rideId = rides.rows[0].id;
    // Gulberg → DHA is ~20km, fuel avg 12km/L, petrol Rs280/L
    // Fuel cost = (20 / 12) * 280 = 467
    const distanceKm = 20;
    const estimatedFuelCost = 467;

    await pool.query(`
      UPDATE rides 
      SET "distanceKm" = $1, "estimatedFuelCost" = $2
      WHERE id = $3
    `, [distanceKm, estimatedFuelCost, rideId]);

    console.log(`\n✅ Updated ride ${rideId}:`);
    console.log(`   Distance: ${distanceKm}km`);
    console.log(`   Estimated Fuel Cost: Rs${estimatedFuelCost}`);

    // Verify
    const updated = await pool.query(`SELECT * FROM rides WHERE id = $1`, [rideId]);
    console.log(`\nVerified:`, updated.rows[0]);
  }

} catch (e) {
  console.error("Error:", e.message);
} finally {
  await pool.end();
}
