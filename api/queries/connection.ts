import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

let instance: ReturnType<typeof drizzle<typeof fullSchema>>;

export function getDb() {
  if (!instance) {
    const databaseUrl = env.databaseUrl || process.env.NEON_DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL or NEON_DATABASE_URL is missing");
    }
    const sql = neon(databaseUrl);
    instance = drizzle(sql, {
      schema: fullSchema,
    });
  }
  return instance;
}
