import { config } from "dotenv";
config();

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
console.log("JWT_SECRET being used:", JWT_SECRET);

// Generate a real token for Hammad Owner
const token = jwt.sign(
  { userId: "33d2aeaa-6650-4429-af96-e898cf2e8499", role: "owner" },
  JWT_SECRET,
  { expiresIn: "1h" }
);

console.log("\nGenerated token:", token);

// Test the invite API on Vercel
const res = await fetch("https://sawari-book.vercel.app/api/invites", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  },
  body: JSON.stringify({ vehicleId: "a84601c5-9fea-44ec-83b6-eae5d3c639f7" }),
});

const text = await res.text();
console.log("\nAPI Response status:", res.status);
console.log("API Response body:", text);
