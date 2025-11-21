import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const docs = pgTable("docs", {
  roomId: text("room_id").primaryKey().notNull(),
  title: text("title").notNull().default("Untitled Document"),
  data: text("data").notNull(), // base64 Yjs snapshot
  version: integer("version").notNull().default(0),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
