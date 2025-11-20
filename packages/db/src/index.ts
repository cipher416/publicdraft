import { drizzle } from "drizzle-orm/node-postgres";

import { eq, sql } from "drizzle-orm";

export const db = drizzle(process.env.DATABASE_URL || "");

export { eq, sql };
