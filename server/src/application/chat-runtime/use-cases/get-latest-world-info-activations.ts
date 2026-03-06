import { HttpError } from "@core/middleware/error-handler";

import {
  buildLatestWorldInfoActivationsFromGeneration,
  emptyLatestWorldInfoActivationsResponse,
} from "../chat-entry-helpers";
import { getChatById } from "../../../services/chat-core/chats-repository";
import { getLatestGenerationByChatBranchWithDebug } from "../../../services/chat-core/generations-repository";

import type { LatestWorldInfoActivationsResponse } from "../chat-entry-helpers";

export type GetLatestWorldInfoActivationsInput = {
  chatId: string;
  branchId?: string;
};

export async function getLatestWorldInfoActivations(
  params: GetLatestWorldInfoActivationsInput
): Promise<LatestWorldInfoActivationsResponse> {
  const chat = await getChatById(params.chatId);
  if (!chat) throw new HttpError(404, "Chat не найден", "NOT_FOUND");

  const branchId = params.branchId ?? chat.activeBranchId;
  if (!branchId) {
    return emptyLatestWorldInfoActivationsResponse();
  }

  const generation = await getLatestGenerationByChatBranchWithDebug({
    chatId: chat.id,
    branchId,
  });
  if (!generation) {
    return emptyLatestWorldInfoActivationsResponse();
  }

  return (
    buildLatestWorldInfoActivationsFromGeneration(generation) ??
    emptyLatestWorldInfoActivationsResponse()
  );
}
