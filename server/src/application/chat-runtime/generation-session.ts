import { runChatGenerationV3 } from "../../services/chat-generation-v3/run-chat-generation-v3";

import type {
  BuildChatGenerationSessionParams,
  ChatGenerationAfterRunContext,
  ChatGenerationSession,
} from "./contracts";
import type { RunEvent } from "../../services/chat-generation-v3/contracts";

async function* streamWithFinalization(params: {
  events: AsyncGenerator<RunEvent>;
  afterRun?: (context: ChatGenerationAfterRunContext) => Promise<void>;
}): AsyncGenerator<RunEvent> {
  let generationId: string | null = null;
  let streamError: unknown;
  let finalizationError: unknown;

  try {
    for await (const event of params.events) {
      if (event.type === "run.started") {
        generationId = typeof event.data?.generationId === "string" ? event.data.generationId : null;
      }
      yield event;
    }
  } catch (error) {
    streamError = error;
    throw error;
  } finally {
    try {
      await params.afterRun?.({ generationId });
    } catch (afterRunError) {
      if (!streamError) {
        finalizationError = afterRunError;
      }
    }
  }

  if (finalizationError) {
    throw finalizationError;
  }
}

export function buildChatGenerationSession(
  params: BuildChatGenerationSessionParams
): ChatGenerationSession {
  return {
    envBase: params.envBase,
    events: streamWithFinalization({
      events: runChatGenerationV3(params.request),
      afterRun: params.afterRun,
    }),
  };
}
