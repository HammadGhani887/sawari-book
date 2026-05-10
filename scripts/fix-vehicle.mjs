import { config } from "dotenv";
config();

const { Pool } = await import("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const ownerId = "33d2aeaa-6650-4429-af96-e898cf2e8499"; // Hammad Owner

// Insert the vehicle that was only in localStorage
const result = await pool.query(`
  INSERT INTO vehicles (id, "ownerId", "plateNumber", "makeModel", "fuelType", platforms, "isActive", "createdAt", "updatedAt")
  VALUES (
    gen_random_uuid(),
    $1,
    'BRW',
    'Suzuki Alto 2025',
    'PETROL',
    '["indrive","yango","other","private"]'::jsonb,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT ("plateNumber") DO NOTHING
  RETURNING id, "makeModel", "plateNumber"
`, [ownerId]);

console.log("Vehicle inserted:", result.rows);

// Verify
const vehicles = await pool.query(
  `SELECT id, "makeModel", "plateNumber", "ownerId" FROM vehicles WHERE "ownerId" = $1`,
  [ownerId]
);
console.log("All vehicles for Hammad Owner:", vehicles.rows);

await pool.end();
