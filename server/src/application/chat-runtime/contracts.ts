import type { RunEvent, RunRequest } from "../../services/chat-generation-v3/contracts";

export type ChatGenerationSessionEnv = {
  chatId: string;
  branchId: string;
  assistantEntryId: string;
  assistantVariantId: string;
  assistantMainPartId: string;
  assistantReasoningPartId?: string;
  userEntryId?: string;
  userMainPartId?: string;
  userRenderedContent?: string;
};

export type ChatGenerationSession = {
  envBase: ChatGenerationSessionEnv;
  events: AsyncGenerator<RunEvent>;
};

export type ChatGenerationAfterRunContext = {
  generationId: string | null;
};

export type BuildChatGenerationSessionParams = {
  envBase: ChatGenerationSessionEnv;
  request: RunRequest;
  afterRun?: (context: ChatGenerationAfterRunContext) => Promise<void>;
};
