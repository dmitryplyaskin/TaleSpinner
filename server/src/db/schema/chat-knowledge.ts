import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import { chatBranches, chats } from "./chat-core";

export const knowledgeCollections = sqliteTable(
  "knowledge_collections",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull().default("global"),
    chatId: text("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    branchId: text("branch_id").references(() => chatBranches.id, { onDelete: "cascade" }),
    scope: text("scope", { enum: ["chat", "branch"] }).notNull(),
    name: text("name").notNull(),
    kind: text("kind"),
    description: text("description"),
    status: text("status", { enum: ["active", "archived", "deleted"] }).notNull().default("active"),
    origin: text("origin", {
      enum: ["import", "author", "system_seed", "user", "llm"],
    })
      .notNull()
      .default("author"),
    layer: text("layer", { enum: ["baseline", "runtime"] }).notNull().default("baseline"),
    metaJson: text("meta_json"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => ({
    ownerChatUpdatedAtIdx: index("knowledge_collections_owner_chat_updated_at_idx").on(
      t.ownerId,
      t.chatId,
      t.updatedAt
    ),
    ownerChatBranchNameUnique: uniqueIndex("knowledge_collections_owner_chat_branch_name_uq").on(
      t.ownerId,
      t.chatId,
      t.branchId,
      t.name
    ),
  })
);

export const knowledgeRecords = sqliteTable(
  "knowledge_records",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull().default("global"),
    chatId: text("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    branchId: text("branch_id").references(() => chatBranches.id, { onDelete: "cascade" }),
    collectionId: text("collection_id")
      .notNull()
      .references(() => knowledgeCollections.id, { onDelete: "cascade" }),
    recordType: text("record_type").notNull(),
    key: text("key").notNull(),
    title: text("title").notNull(),
    aliasesJson: text("aliases_json").notNull().default("[]"),
    tagsJson: text("tags_json").notNull().default("[]"),
    summary: text("summary"),
    contentJson: text("content_json").notNull().default("null"),
    searchText: text("search_text").notNull().default(""),
    accessMode: text("access_mode", {
      enum: ["public", "discoverable", "hidden", "internal"],
    })
      .notNull()
      .default("public"),
    origin: text("origin", {
      enum: ["import", "author", "system_seed", "user", "llm"],
    })
      .notNull()
      .default("author"),
    layer: text("layer", { enum: ["baseline", "runtime"] }).notNull().default("baseline"),
    derivedFromRecordId: text("derived_from_record_id"),
    sourceMessageId: text("source_message_id"),
    sourceOperationId: text("source_operation_id"),
    status: text("status", { enum: ["active", "archived", "deleted"] }).notNull().default("active"),
    gatePolicyJson: text("gate_policy_json"),
    metaJson: text("meta_json"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => ({
    ownerChatBranchUpdatedAtIdx: index("knowledge_records_owner_chat_branch_updated_at_idx").on(
      t.ownerId,
      t.chatId,
      t.branchId,
      t.updatedAt
    ),
    collectionRecordTypeIdx: index("knowledge_records_collection_record_type_idx").on(
      t.collectionId,
      t.recordType
    ),
    scopeCollectionKeyUnique: uniqueIndex("knowledge_records_scope_collection_key_uq").on(
      t.chatId,
      t.branchId,
      t.collectionId,
      t.key
    ),
    activeCollectionKeyUnique: uniqueIndex("knowledge_records_active_scope_collection_key_uq")
      .on(t.chatId, t.branchId, t.collectionId, t.key)
      .where(sql`${t.status} = 'active'`),
  })
);

export const knowledgeRecordLinks = sqliteTable(
  "knowledge_record_links",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull().default("global"),
    chatId: text("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    branchId: text("branch_id").references(() => chatBranches.id, { onDelete: "cascade" }),
    fromRecordId: text("from_record_id")
      .notNull()
      .references(() => knowledgeRecords.id, { onDelete: "cascade" }),
    relationType: text("relation_type").notNull(),
    toRecordId: text("to_record_id")
      .notNull()
      .references(() => knowledgeRecords.id, { onDelete: "cascade" }),
    metaJson: text("meta_json"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => ({
    ownerChatBranchRelationIdx: index("knowledge_record_links_owner_chat_branch_relation_idx").on(
      t.ownerId,
      t.chatId,
      t.branchId,
      t.relationType
    ),
    fromRelationToUnique: uniqueIndex("knowledge_record_links_from_relation_to_uq").on(
      t.fromRecordId,
      t.relationType,
      t.toRecordId
    ),
  })
);

export const knowledgeRecordAccessState = sqliteTable(
  "knowledge_record_access_state",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull().default("global"),
    chatId: text("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    branchId: text("branch_id").references(() => chatBranches.id, { onDelete: "cascade" }),
    recordId: text("record_id")
      .notNull()
      .references(() => knowledgeRecords.id, { onDelete: "cascade" }),
    discoverState: text("discover_state", {
      enum: ["hidden", "discoverable", "visible"],
    })
      .notNull()
      .default("hidden"),
    readState: text("read_state", { enum: ["blocked", "partial", "full"] })
      .notNull()
      .default("blocked"),
    promptState: text("prompt_state", { enum: ["blocked", "allowed"] })
      .notNull()
      .default("blocked"),
    revealState: text("reveal_state", { enum: ["hidden", "revealed"] })
      .notNull()
      .default("hidden"),
    revealedAt: integer("revealed_at", { mode: "timestamp_ms" }),
    revealedBy: text("revealed_by", { enum: ["system", "user", "llm", "import"] }),
    revealReason: text("reveal_reason"),
    flagsJson: text("flags_json").notNull().default("{}"),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => ({
    chatBranchRevealIdx: index("knowledge_record_access_state_chat_branch_reveal_idx").on(
      t.chatId,
      t.branchId,
      t.revealState,
      t.updatedAt
    ),
    scopeRecordUnique: uniqueIndex("knowledge_record_access_state_scope_record_uq").on(
      t.chatId,
      t.branchId,
      t.recordId
    ),
  })
);
