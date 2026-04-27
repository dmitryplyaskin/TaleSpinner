import { renderLiquidTemplate, type InstructionRenderContext } from "../../chat-core/prompt-template-renderer";
import { compileGuardOutputSchema, buildGuardOutputJsonSchemaSpec } from "../../operations/guard-output-contract";

import { executeLlmOperation } from "./llm-operation-executor";

import type { OperationInProfile } from "@shared/types/operation-profiles";

type GuardOperation = Extract<OperationInProfile, { kind: "guard" }>;
type LlmLikeOperation = Extract<OperationInProfile, { kind: "llm" }>;

type CodedError = Error & { code: string };

function createCodedError(code: string, message: string): CodedError {
  const error = new Error(message) as CodedError;
  error.code = code;
  return error;
}

function mapGuardError(error: unknown): never {
  if (error instanceof Error) {
    const code = (error as Error & { code?: string }).code;
    if (code === "LLM_TEMPLATE_RENDER_ERROR") {
      throw createCodedError("GUARD_TEMPLATE_RENDER_ERROR", error.message);
    }
    if (code === "LLM_OUTPUT_PARSE_ERROR" || code === "LLM_OUTPUT_EXTRACT_ERROR") {
      throw createCodedError("GUARD_OUTPUT_PARSE_ERROR", error.message);
    }
    if (code === "LLM_OUTPUT_SCHEMA_ERROR") {
      throw createCodedError("GUARD_OUTPUT_VALIDATION_ERROR", error.message);
    }
    if (code === "LLM_TIMEOUT") {
      throw createCodedError("GUARD_TIMEOUT", error.message);
    }
    if (code?.startsWith("LLM_")) {
      throw createCodedError("GUARD_PROVIDER_ERROR", error.message);
    }
  }
  throw createCodedError(
    "GUARD_PROVIDER_ERROR",
    error instanceof Error ? error.message : String(error)
  );
}

function parseGuardJsonOutput(params: {
  value: string;
  op: GuardOperation;
}): Record<string, boolean> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(params.value);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw createCodedError("GUARD_OUTPUT_PARSE_ERROR", message);
  }

  const schema = compileGuardOutputSchema(params.op.config.params.outputContract);
  const result = schema.safeParse(parsed);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue?.path?.length ? issue.path.join(".") : "$";
    throw createCodedError(
      "GUARD_OUTPUT_VALIDATION_ERROR",
      `Guard output validation failed at ${path}: ${issue?.message ?? "invalid output"}`
    );
  }
  return result.data;
}

function buildLlmLikeGuardOperation(op: GuardOperation): LlmLikeOperation {
  if (op.config.params.engine !== "aux_llm") {
    throw createCodedError("GUARD_INVALID_PARAMS", "Expected aux_llm guard params");
  }

  return {
    opId: op.opId,
    name: op.name,
    kind: "llm",
    config: {
      enabled: op.config.enabled,
      required: op.config.required,
      hooks: op.config.hooks,
      triggers: op.config.triggers,
      activation: op.config.activation,
      order: op.config.order,
      dependsOn: op.config.dependsOn,
      runConditions: op.config.runConditions,
      params: {
        params: {
          providerId: op.config.params.providerId,
          credentialRef: op.config.params.credentialRef,
          model: op.config.params.model,
          system: op.config.params.system,
          prompt: op.config.params.prompt,
          strictVariables: op.config.params.strictVariables,
          outputMode: "json",
          jsonSchema: buildGuardOutputJsonSchemaSpec(op.config.params.outputContract),
          strictSchemaValidation: true,
          jsonParseMode: "raw",
          samplers: op.config.params.samplers,
          timeoutMs: op.config.params.timeoutMs,
          retry: op.config.params.retry,
        },
        artifact: op.config.params.artifact,
      },
    },
  };
}

export async function executeGuardOperation(params: {
  op: GuardOperation;
  liquidContext: InstructionRenderContext;
  abortSignal?: AbortSignal;
}): Promise<{ value: Record<string, boolean>; debugSummary: string }> {
  if (params.op.config.params.engine === "liquid") {
    let rendered = "";
    try {
      rendered = String(
        await renderLiquidTemplate({
          templateText: params.op.config.params.template,
          context: params.liquidContext,
          options: { strictVariables: Boolean(params.op.config.params.strictVariables) },
        })
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw createCodedError("GUARD_TEMPLATE_RENDER_ERROR", message);
    }

    return {
      value: parseGuardJsonOutput({ value: rendered, op: params.op }),
      debugSummary: `guard:liquid:${params.op.config.params.outputContract.length}`,
    };
  }

  try {
    const llmResult = await executeLlmOperation({
      op: buildLlmLikeGuardOperation(params.op),
      liquidContext: params.liquidContext,
      abortSignal: params.abortSignal,
    });
    return {
      value: parseGuardJsonOutput({ value: llmResult.rendered, op: params.op }),
      debugSummary: `guard:aux_llm:${params.op.config.params.outputContract.length}:${llmResult.debugSummary}`,
    };
  } catch (error) {
    mapGuardError(error);
  }
}
