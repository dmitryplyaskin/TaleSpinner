import { z } from "zod";

import type {
  KnowledgeRevealOperationParams,
  KnowledgeSearchOperationParams,
  KnowledgeRequestSource,
} from "@shared/types/chat-knowledge";

const artifactTagSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[a-z][a-z0-9_]*$/, "artifactTag must match ^[a-z][a-z0-9_]*$");

const requestSourceSchema: z.ZodType<KnowledgeRequestSource> = z.discriminatedUnion("mode", [
  z
    .object({
      mode: z.literal("inline"),
      requestTemplate: z.string().min(1),
      strictVariables: z.boolean().optional(),
    })
    .transform((value) => ({
      ...value,
      strictVariables: value.strictVariables === true,
    })),
  z.object({
    mode: z.literal("artifact"),
    artifactTag: artifactTagSchema,
  }),
]);

const searchParamsSchema: z.ZodType<KnowledgeSearchOperationParams> = z.object({
  source: requestSourceSchema,
});

const revealParamsSchema: z.ZodType<KnowledgeRevealOperationParams> = z.object({
  source: requestSourceSchema,
});

export function parseKnowledgeSearchOperationParams(
  raw: unknown
): KnowledgeSearchOperationParams {
  return searchParamsSchema.parse(raw);
}

export function parseKnowledgeRevealOperationParams(
  raw: unknown
): KnowledgeRevealOperationParams {
  return revealParamsSchema.parse(raw);
}
