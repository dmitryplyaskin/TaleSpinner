import {
  getRuntime,
  getRuntimeProviderState,
  listTokens,
  upsertRuntime,
  upsertRuntimeProviderState,
} from "@services/llm/llm-repository";

import type { LlmProviderId } from "@services/llm/llm-definitions";

export async function updateLlmRuntime(params: {
  scope: "global" | "agent";
  scopeId: string;
  activeProviderId: LlmProviderId;
  activeTokenId?: string | null;
  activeModel?: string | null;
}): Promise<Awaited<ReturnType<typeof upsertRuntime>> & { activeTokenHint: string | null }> {
  const current = await getRuntime(params.scope, params.scopeId);
  const nextProviderId = params.activeProviderId;

  if (current.activeProviderId !== nextProviderId) {
    await upsertRuntimeProviderState({
      scope: params.scope,
      scopeId: params.scopeId,
      providerId: current.activeProviderId,
      lastTokenId: current.activeTokenId,
      lastModel: current.activeModel,
    });
  }

  let nextTokenId: string | null =
    params.activeTokenId !== undefined ? params.activeTokenId ?? null : null;
  let nextModel: string | null =
    params.activeModel !== undefined ? params.activeModel ?? null : null;

  if (current.activeProviderId !== nextProviderId) {
    const restored = await getRuntimeProviderState({
      scope: params.scope,
      scopeId: params.scopeId,
      providerId: nextProviderId,
    });
    if (params.activeTokenId === undefined) {
      nextTokenId = restored.lastTokenId;
    }
    if (params.activeModel === undefined) {
      nextModel = restored.lastModel;
    }
  } else {
    if (params.activeTokenId === undefined) {
      nextTokenId = current.activeTokenId;
    }
    if (params.activeModel === undefined) {
      nextModel = current.activeModel;
    }
  }

  const runtime = await upsertRuntime({
    scope: params.scope,
    scopeId: params.scopeId,
    activeProviderId: nextProviderId,
    activeTokenId: nextTokenId,
    activeModel: nextModel,
  });

  await upsertRuntimeProviderState({
    scope: params.scope,
    scopeId: params.scopeId,
    providerId: runtime.activeProviderId,
    lastTokenId: runtime.activeTokenId,
    lastModel: runtime.activeModel,
  });

  let activeTokenHint: string | null = null;
  if (runtime.activeTokenId) {
    const tokens = await listTokens(runtime.activeProviderId);
    activeTokenHint =
      tokens.find((token) => token.id === runtime.activeTokenId)?.tokenHint ?? null;
  }

  return {
    ...runtime,
    activeTokenHint,
  };
}
