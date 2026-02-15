import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { llmTokens } from "./llm";

export const ragRuntimeSettings = sqliteTable("rag_runtime_settings", {
  id: text("id").primaryKey(),
  activeProviderId: text("active_provider_id").notNull(),
  activeTokenId: text("active_token_id").references(() => llmTokens.id, {
    onDelete: "set null",
  }),
  activeModel: text("active_model"),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const ragProviderConfigs = sqliteTable("rag_provider_configs", {
  providerId: text("provider_id").primaryKey(),
  configJson: text("config_json").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const ragPresets = sqliteTable(
  "rag_presets",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull().default("global"),
    name: text("name").notNull(),
    payloadJson: text("payload_json").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => ({
    ownerUpdatedAtIdx: index("rag_presets_owner_updated_at_idx").on(
      t.ownerId,
      t.updatedAt
    ),
  })
);

export const ragPresetSettings = sqliteTable(
  "rag_preset_settings",
  {
    ownerId: text("owner_id").primaryKey(),
    selectedId: text("selected_id").references(() => ragPresets.id, {
      onDelete: "set null",
    }),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => ({
    selectedIdIdx: index("rag_preset_settings_selected_id_idx").on(
      t.selectedId
    ),
  })
);
