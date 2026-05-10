/**
 * Test actual API endpoint response
 */
import * as dotenv from "dotenv";
dotenv.config();

// Get owner token from DB
import { Pool } from "pg";
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  const owner = await pool.query(`SELECT id FROM users WHERE role = 'OWNER' LIMIT 1`);
  const ownerId = owner.rows[0]?.id;
  
  if (!ownerId) {
    console.log("No owner found");
    process.exit(1);
  }

  // Generate a test JWT token
  const jwt = await import("jsonwebtoken");
  const token = jwt.default.sign(
    { userId: ownerId, role: "owner" },
    process.env.JWT_SECRET || "sawari-book-secret",
    { expiresIn: "1h" }
  );

  console.log("Testing /api/vehicles with owner token...\n");

  // Call the API
  const response = await fetch("http://localhost:3000/api/vehicles", {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.log(`Error: ${response.status} ${response.statusText}`);
    const text = await response.text();
    console.log(text);
  } else {
    const data = await response.json();
    console.log("Response:");
    console.log(JSON.stringify(data, null, 2));
  }

} catch (e) {
  console.error("Error:", e.message);
} finally {
  await pool.end();
}
