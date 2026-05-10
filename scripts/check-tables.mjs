import { Pool } from "pg";
import * as dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  const res = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `);
  console.log("Tables in DB:");
  res.rows.forEach(r => console.log(" -", r.table_name));
} catch (e) {
  console.error("Error:", e.message);
} finally {
  await pool.end();
}
