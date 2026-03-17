import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const uiAppBackgrounds = sqliteTable("ui_app_backgrounds", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  fileName: text("file_name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});
