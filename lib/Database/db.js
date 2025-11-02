import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();

const { Pool } = pkg;


export function connectToSupabase() {
  const connectionString = process.env.SUPABASE_DB_URL;

  if (!connectionString) {
    throw new Error("❌ Missing SUPABASE_DB_URL in environment variables");
  }

  const pool = new Pool({
    connectionString,
    ssl: { 
      rejectUnauthorized: false, // Supabase requires SSL
    },
  });

  console.log("✅ Connected to Supabase PostgreSQL");

  return pool;
}
