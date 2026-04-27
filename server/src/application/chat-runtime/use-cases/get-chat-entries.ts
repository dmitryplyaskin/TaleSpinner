import { HttpError } from "@core/middleware/error-handler";

import { getChatById } from "../../../services/chat-core/chats-repository";
import { rerenderGreetingTemplatesIfPreplay } from "../../../services/chat-core/greeting-template-rerender";
import { getBranchCurrentTurn } from "../../../services/chat-entry-parts/branch-turn-repository";
import {
  getLatestSelectedPersonaIdForChatBranch,
  listEntriesWithActiveVariants,
  listEntriesWithActiveVariantsPage,
  type EntriesPageInfo,
} from "../../../services/chat-entry-parts/entries-repository";
import { getPromptProjectionWithEntryIds } from "../../../services/chat-entry-parts/projection";
import { serializePart } from "../../../services/chat-entry-parts/prompt-serializers";
import {
  buildEntryPromptUsage,
  buildPromptApproxTokensByEntryId,
  PROMPT_USAGE_HISTORY_LIMIT,
  type EntryPromptUsage,
} from "../chat-entry-helpers";

import type { Entry, Variant } from "@shared/types/chat-entry-parts";

export type GetChatEntriesInput = {
  chatId: string;
  query: {
    branchId?: string;
    limit: number;
    before?: number;
    cursorCreatedAt?: number;
    cursorEntryId?: string;
  };
};

export type GetChatEntriesResult = {
  branchId: string;
  currentTurn: number;
  lastSelectedPersonaId: string | null;
  entries: Array<{
    entry: Entry;
    variant: Variant | null;
    promptUsage: EntryPromptUsage;
  }>;
  pageInfo: EntriesPageInfo;
};

export async function getChatEntries(
  params: GetChatEntriesInput
): Promise<GetChatEntriesResult> {
  const chat = await getChatById(params.chatId);
  if (!chat) throw new HttpError(404, "Chat не найден", "NOT_FOUND");

  const branchId = params.query.branchId || chat.activeBranchId;
  if (!branchId) {
    throw new HttpError(400, "branchId обязателен (нет activeBranchId)", "VALIDATION_ERROR");
  }

  try {
    await rerenderGreetingTemplatesIfPreplay({
      ownerId: chat.ownerId,
      chatId: params.chatId,
      branchId,
      entityProfileId: chat.entityProfileId,
    });
  } catch {
    // best-effort rerender; never fail the entries listing
  }

  const page = await listEntriesWithActiveVariantsPage({
    chatId: params.chatId,
    branchId,
    limit: params.query.limit,
    before: params.query.before,
    cursorCreatedAt: params.query.cursorCreatedAt,
    cursorEntryId: params.query.cursorEntryId,
  });

  const [currentTurn, promptWindowEntries, lastSelectedPersonaId] = await Promise.all([
    getBranchCurrentTurn({ branchId }),
    listEntriesWithActiveVariants({
      chatId: params.chatId,
      branchId,
      limit: PROMPT_USAGE_HISTORY_LIMIT,
    }),
    getLatestSelectedPersonaIdForChatBranch({
      chatId: params.chatId,
      branchId,
    }),
  ]);
  const promptProjected = getPromptProjectionWithEntryIds({
    entries: promptWindowEntries,
    currentTurn,
    serializePart,
  });
  const approxTokensByEntryId = buildPromptApproxTokensByEntryId(promptProjected);

  return {
    branchId,
    currentTurn,
    lastSelectedPersonaId,
    entries: page.entries.map((item) => ({
      ...item,
      promptUsage: buildEntryPromptUsage({
        entryId: item.entry.entryId,
        approxTokensByEntryId,
      }),
    })),
    pageInfo: page.pageInfo,
  };
}
