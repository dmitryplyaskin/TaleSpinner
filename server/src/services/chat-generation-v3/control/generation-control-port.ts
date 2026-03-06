import { GenerationControlService } from "../../chat-core/generation-control-service";

import type { RunResult } from "../contracts";

export type GenerationControlLease = {
  heartbeat: () => Promise<void>;
  release: (params: { status: RunResult["status"] | null }) => Promise<void>;
};

export type GenerationControlPort = {
  acquire: (params: {
    generationId: string;
    runInstanceId: string;
    abortController: AbortController;
  }) => Promise<GenerationControlLease>;
};

export const defaultGenerationControlPort: GenerationControlPort = {
  async acquire(params) {
    return GenerationControlService.acquire(params);
  },
};
