import { HttpError } from "@core/middleware/error-handler";

import { getChatById } from "../../../services/chat-core/chats-repository";
import { listProjectedPromptMessages } from "../../../services/chat-entry-parts/prompt-history";
import { resolveWorldInfoRuntimeForChat } from "../../../services/world-info/world-info-runtime";

export async function resolveWorldInfoForChat(params: {
  ownerId: string;
  chatId: string;
  branchId?: string;
  entityProfileId?: string;
  trigger: "generate" | "regenerate";
  historyLimit: number;
  dryRun: boolean;
}) {
  const chat = await getChatById(params.chatId);
  if (!chat) throw new HttpError(404, "Chat not found", "NOT_FOUND");

  const branchId = params.branchId ?? chat.activeBranchId;
  if (!branchId) {
    throw new HttpError(400, "branchId is required", "VALIDATION_ERROR");
  }

  const projected = await listProjectedPromptMessages({
    chatId: params.chatId,
    branchId,
    limit: params.historyLimit,
  });

  return resolveWorldInfoRuntimeForChat({
    ownerId: params.ownerId,
    chatId: params.chatId,
    branchId,
    entityProfileId: params.entityProfileId ?? chat.entityProfileId,
    trigger: params.trigger,
    history: projected.messages,
    scanSeed: `${params.chatId}:${branchId}:${params.trigger}:${Date.now()}`,
    dryRun: params.dryRun,
  });
}
