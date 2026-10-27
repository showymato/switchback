import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

neonConfig.webSocketConstructor = ws;

declare global {
  var __switchbackPool: Pool | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
  }
  return new Pool({ connectionString });
}

const pool = globalThis.__switchbackPool ?? createPool();
if (process.env.NODE_ENV !== "production") {
  globalThis.__switchbackPool = pool;
}

export const db = drizzle(pool, { schema });
export type Database = typeof db;
// The type of `tx` inside db.transaction(async (tx) => ...) — accepted anywhere a
// plain `db` is, so service functions can run standalone or inside a caller's transaction.
export type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];
export type DbClient = Database | Tx;
