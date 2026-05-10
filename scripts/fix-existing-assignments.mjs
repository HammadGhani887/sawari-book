/**
 * One-time fix: Create DriverAssignment records for drivers who accepted
 * invites but never got an assignment created (due to old bug).
 */
import { Pool } from "pg";
import * as dotenv from "dotenv";
import { randomUUID } from "crypto";
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  // Find all used invites that don't have a corresponding active assignment
  const res = await pool.query(`
    SELECT i.id as invite_id, i."vehicleId", i."ownerId", i."usedBy" as driver_id
    FROM invites i
    WHERE i."usedBy" IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM driver_assignments da
      WHERE da."driverId" = i."usedBy"
        AND da."vehicleId" = i."vehicleId"
        AND da."isActive" = true
    )
  `);

  console.log(`Found ${res.rows.length} invite(s) missing assignment.`);

  for (const row of res.rows) {
    const id = randomUUID();
    await pool.query(`
      INSERT INTO driver_assignments 
        (id, "driverId", "vehicleId", "ownerId", "salaryType", "salaryAmount", "startDate", "isActive", "createdAt")
      VALUES 
        ($1, $2, $3, $4, 'FIXED', 0, CURRENT_DATE, true, NOW())
      ON CONFLICT DO NOTHING
    `, [id, row.driver_id, row.vehicleId, row.ownerId]);

    console.log(`✅ Created assignment for driver ${row.driver_id} → vehicle ${row.vehicleId}`);
  }

  // Verify
  const check = await pool.query(`SELECT * FROM driver_assignments`);
  console.log(`\nTotal assignments now: ${check.rows.length}`);
  check.rows.forEach(r => console.log(" ", JSON.stringify(r)));

} catch (e) {
  console.error("Error:", e.message);
} finally {
  await pool.end();
}
