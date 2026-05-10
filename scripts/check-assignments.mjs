import { Pool } from "pg";
import * as dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  // Check invites with correct camelCase columns
  const invites = await pool.query(`SELECT id, token, "vehicleId", "ownerId", "usedBy", "expiresAt" FROM invites ORDER BY "createdAt" DESC LIMIT 5`);
  console.log(`Invites (${invites.rows.length}):`);
  invites.rows.forEach(r => console.log(" ", JSON.stringify(r)));

  // Check users (drivers)
  const drivers = await pool.query(`SELECT id, name, phone, role FROM users WHERE role = 'DRIVER' LIMIT 5`);
  console.log(`\nDrivers (${drivers.rows.length}):`);
  drivers.rows.forEach(r => console.log(" ", JSON.stringify(r)));

  // Check assignments
  const asgn = await pool.query(`SELECT * FROM driver_assignments LIMIT 5`);
  console.log(`\nAssignments (${asgn.rows.length}):`);
  asgn.rows.forEach(r => console.log(" ", JSON.stringify(r)));

} catch (e) {
  console.error("Error:", e.message);
} finally {
  await pool.end();
}
