import { config } from "dotenv";
config();

const { Pool } = await import("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

console.log("\n=== USERS ===");
const users = await pool.query("SELECT id, name, phone, role FROM users LIMIT 10");
console.table(users.rows);

console.log("\n=== VEHICLES ===");
const vehicles = await pool.query(`SELECT id, "makeModel", "plateNumber", "ownerId" FROM vehicles LIMIT 10`);
console.table(vehicles.rows);

console.log("\n=== INVITES ===");
const invites = await pool.query(`SELECT id, token, "ownerName", "vehicleName", "usedBy", "expiresAt" FROM invites LIMIT 10`);
console.table(invites.rows);

await pool.end();
