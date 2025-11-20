import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const docs = pgTable("docs", {
  roomId: text("room_id").primaryKey().notNull(),
  data: text("data").notNull(), // base64 Yjs snapshot
  version: integer("version").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
