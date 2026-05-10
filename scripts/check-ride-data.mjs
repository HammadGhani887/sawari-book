import { Pool } from "pg";
import * as dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  // Check rides table columns first
  const cols = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'rides' 
    ORDER BY ordinal_position
  `);
  console.log(`Rides table columns:`);
  cols.rows.forEach(c => console.log(`  ${c.column_name} (${c.data_type})`));

  // Check today's rides
  const today = new Date().toISOString().slice(0, 10);
  const rides = await pool.query(`
    SELECT * FROM rides 
    WHERE "rideTime"::date = $1
    ORDER BY "rideTime" DESC
    LIMIT 5
  `, [today]);

  console.log(`\nToday's rides (${rides.rows.length}):`);
  rides.rows.forEach(r => console.log(JSON.stringify(r)));

  // Check fuel logs
  const fuel = await pool.query(`
    SELECT * FROM fuel_logs
    WHERE date::date = $1
  `, [today]);

  console.log(`\nToday's fuel logs (${fuel.rows.length}):`);
  fuel.rows.forEach(f => console.log(JSON.stringify(f)));

} catch (e) {
  console.error("Error:", e.message);
} finally {
  await pool.end();
}
