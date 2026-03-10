
import { ProfileSessionArtifactStore } from "../../artifacts/profile-session-artifact-store";
import { type RunArtifactStore } from "../../artifacts/run-artifact-store";

import type { ArtifactValue } from "../../contracts";
import type { OperationProfile } from "@shared/types/operation-profiles";

export async function applyArtifactEffect(params: {
  ownerId: string;
  chatId: string;
  branchId: string;
  sessionKey: string | null;
  profile: OperationProfile | null;
  runStore: RunArtifactStore;
  effect: {
    artifactId: string;
    format: "text" | "markdown" | "json";
    persistence: "persisted" | "run_only";
    writeMode: "replace" | "append";
    history: {
      enabled: boolean;
      maxItems: number;
    };
    semantics: string;
    value: unknown;
  };
}): Promise<ArtifactValue> {
  if (params.effect.persistence === "run_only") {
    return params.runStore.upsert({
      artifactId: params.effect.artifactId,
      format: params.effect.format as any,
      semantics: params.effect.semantics as any,
      writeMode: params.effect.writeMode as any,
      history: params.effect.history,
      value: params.effect.value,
    });
  }

  if (!params.sessionKey) {
    throw new Error("Persisted artifact write requested without session key");
  }

  const persisted = await ProfileSessionArtifactStore.upsert({
    ownerId: params.ownerId,
    sessionKey: params.sessionKey,
    chatId: params.chatId,
    branchId: params.branchId,
    profile: params.profile,
    tag: params.effect.artifactId,
    format: params.effect.format as any,
    semantics: params.effect.semantics as any,
    writeMode: params.effect.writeMode as any,
    history: params.effect.history,
    value: params.effect.value,
  });
  return persisted;
}
