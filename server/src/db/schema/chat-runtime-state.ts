import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import { chatBranches, chats } from "./chat-core";
import { operationProfiles } from "./operation-profiles";

export const chatRuntimeState = sqliteTable(
  "chat_runtime_state",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull().default("global"),
    chatId: text("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    branchId: text("branch_id")
      .notNull()
      .references(() => chatBranches.id, { onDelete: "cascade" }),
    profileId: text("profile_id")
      .notNull()
      .references(() => operationProfiles.id, { onDelete: "cascade" }),
    operationProfileSessionId: text("operation_profile_session_id").notNull(),
    stateJson: text("state_json").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => ({
    scopeUnique: uniqueIndex("chat_runtime_state_scope_uq").on(
      t.ownerId,
      t.chatId,
      t.branchId,
      t.profileId,
      t.operationProfileSessionId
    ),
    chatBranchUpdatedAtIdx: index("chat_runtime_state_chat_branch_updated_at_idx").on(
      t.chatId,
      t.branchId,
      t.updatedAt
    ),
  })
);
