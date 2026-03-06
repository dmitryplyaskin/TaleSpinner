import {
  updateGenerationDebugJson,
  updateGenerationPromptData,
} from "../../chat-core/generations-repository";

import { finalizeRun } from "./finalize-run";

import type { RunContext, RunResult } from "../contracts";

export type GenerationPersistencePort = {
  persistPromptData: (params: {
    generationId: string;
    promptHash: string | null;
    promptSnapshot: RunResult["promptSnapshot"];
  }) => Promise<void>;
  persistDebugData: (params: {
    generationId: string;
    debug: unknown | null;
  }) => Promise<void>;
  finalize: (params: {
    context: RunContext;
    result: RunResult;
  }) => Promise<void>;
};

export const defaultGenerationPersistencePort: GenerationPersistencePort = {
  async persistPromptData(params) {
    await updateGenerationPromptData({
      id: params.generationId,
      promptHash: params.promptHash,
      promptSnapshot: params.promptSnapshot,
    });
  },

  async persistDebugData(params) {
    await updateGenerationDebugJson({
      id: params.generationId,
      debug: params.debug,
    });
  },

  async finalize(params) {
    await finalizeRun(params);
  },
};
