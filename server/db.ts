import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : undefined,
});

pool.on('error', (err: Error) => {
  console.error('[DB] Unexpected pool error:', err instanceof Error ? err.message : String(err));
});

export const db = drizzle(pool);
