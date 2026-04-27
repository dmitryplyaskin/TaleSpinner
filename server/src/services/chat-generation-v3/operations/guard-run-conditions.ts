import type { OperationSkipDetails } from "../contracts";
import type { OperationInProfile } from "@shared/types/operation-profiles";

type ArtifactSnapshot = { value: unknown; history: unknown[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readGuardOutputValue(params: {
  sourceOp: Extract<OperationInProfile, { kind: "guard" }>;
  artifacts: Record<string, ArtifactSnapshot>;
  outputKey: string;
}): boolean | null {
  const artifact =
    params.artifacts[params.sourceOp.config.params.artifact.tag] ??
    params.artifacts[params.sourceOp.config.params.artifact.artifactId];
  if (!artifact || !isRecord(artifact.value)) return null;
  const value = artifact.value[params.outputKey];
  return typeof value === "boolean" ? value : null;
}

export function evaluateGuardRunConditions(params: {
  op: OperationInProfile;
  operationsById: ReadonlyMap<string, OperationInProfile>;
  artifacts: Record<string, ArtifactSnapshot>;
}):
  | { matched: true }
  | { matched: false; details: NonNullable<OperationSkipDetails["guard"]> } {
  for (const condition of params.op.config.runConditions ?? []) {
    if (condition.type !== "guard_output") continue;
    const sourceOp = params.operationsById.get(condition.sourceOpId);
    if (!sourceOp || sourceOp.kind !== "guard") {
      return {
        matched: false,
        details: {
          sourceOpId: condition.sourceOpId,
          outputKey: condition.outputKey,
          operator: condition.operator,
          actual: null,
        },
      };
    }

    const actual = readGuardOutputValue({
      sourceOp,
      artifacts: params.artifacts,
      outputKey: condition.outputKey,
    });
    const matched =
      condition.operator === "is_true" ? actual === true : actual === false;
    if (!matched) {
      return {
        matched: false,
        details: {
          sourceOpId: condition.sourceOpId,
          outputKey: condition.outputKey,
          operator: condition.operator,
          actual,
        },
      };
    }
  }

  return { matched: true };
}
