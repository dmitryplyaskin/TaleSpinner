import express, { type Request } from "express";
import { z } from "zod";

import { asyncHandler } from "@core/middleware/async-handler";
import { HttpError } from "@core/middleware/error-handler";
import { validate } from "@core/middleware/validate";
import { updateLlmRuntime } from "../application/llm/use-cases/update-llm-runtime";
import {
  llmProviderDefinitions,
  openAiCompatibleConfigSchema,
  openRouterConfigSchema,
  type LlmProviderId,
} from "@services/llm/llm-definitions";
import {
  createToken,
  deleteToken,
  getProviderConfig,
  getRuntime,
  getRuntimeProviderState,
  listProviders,
  listTokens,
  upsertProviderConfig,
  upsertRuntimeProviderState,
  upsertRuntime,
  updateToken,
} from "@services/llm/llm-repository";
import { getModels } from "@services/llm/llm-service";

const router = express.Router();

const providerIdSchema = z.enum(["openrouter", "openai_compatible"]);

const scopeSchema = z.enum(["global", "agent"]);

const runtimeQuerySchema = z.object({
  scope: scopeSchema.optional().default("global"),
  scopeId: z.string().min(1).optional().default("global"),
});

const runtimePatchSchema = z.object({
  scope: scopeSchema.optional().default("global"),
  scopeId: z.string().min(1).optional().default("global"),
  activeProviderId: providerIdSchema,
  activeTokenId: z.string().min(1).nullable().optional(),
  activeModel: z.string().min(1).nullable().optional(),
});

router.get(
  "/llm/providers",
  asyncHandler(async () => {
    const rows = await listProviders();
    const enabledById = new Map(rows.map((r) => [r.id, r.enabled]));

    const providers = llmProviderDefinitions.map((d) => ({
      ...d,
      enabled: enabledById.get(d.id) ?? d.enabledByDefault,
    }));

    return { data: { providers } };
  })
);

router.get(
  "/llm/runtime",
  validate({ query: runtimeQuerySchema }),
  asyncHandler(async (req: Request) => {
    const { scope, scopeId } = runtimeQuerySchema.parse(req.query);
    const runtime = await getRuntime(scope, scopeId);

    let activeTokenHint: string | null = null;
    if (runtime.activeTokenId) {
      const tokens = await listTokens(runtime.activeProviderId);
      activeTokenHint =
        tokens.find((t) => t.id === runtime.activeTokenId)?.tokenHint ?? null;
    }

    return { data: { ...runtime, activeTokenHint } };
  })
);

router.patch(
  "/llm/runtime",
  validate({ body: runtimePatchSchema }),
  asyncHandler(async (req: Request) => {
    const body = req.body as z.infer<typeof runtimePatchSchema>;
    return {
      data: await updateLlmRuntime({
        scope: body.scope,
        scopeId: body.scopeId,
        activeProviderId: body.activeProviderId as LlmProviderId,
        activeTokenId: body.activeTokenId,
        activeModel: body.activeModel,
      }),
    };
  })
);

router.get(
  "/llm/providers/:providerId/config",
  validate({ params: z.object({ providerId: providerIdSchema }) }),
  asyncHandler(async (req: Request) => {
    const providerId = req.params.providerId as LlmProviderId;
    const config = await getProviderConfig(providerId);
    return { data: config };
  })
);

router.patch(
  "/llm/providers/:providerId/config",
  validate({
    params: z.object({ providerId: providerIdSchema }),
    body: z.unknown(),
  }),
  asyncHandler(async (req: Request) => {
    const providerId = req.params.providerId as LlmProviderId;

    const parsed =
      providerId === "openrouter"
        ? openRouterConfigSchema.parse(req.body)
        : openAiCompatibleConfigSchema.parse(req.body);

    const saved = await upsertProviderConfig(providerId, parsed);
    return { data: saved };
  })
);

router.get(
  "/llm/tokens",
  validate({ query: z.object({ providerId: providerIdSchema }) }),
  asyncHandler(async (req: Request) => {
    const providerId = providerIdSchema.parse(
      (req.query as unknown as { providerId?: unknown }).providerId
    ) as LlmProviderId;
    const tokens = await listTokens(providerId);
    return { data: { tokens } };
  })
);

const tokenCreateSchema = z.object({
  providerId: providerIdSchema,
  name: z.string().min(1),
  token: z.string().min(1),
});

router.post(
  "/llm/tokens",
  validate({ body: tokenCreateSchema }),
  asyncHandler(async (req: Request) => {
    const body = req.body as z.infer<typeof tokenCreateSchema>;
    const created = await createToken({
      providerId: body.providerId as LlmProviderId,
      name: body.name,
      token: body.token,
    });
    return { data: created };
  })
);

const tokenPatchSchema = z
  .object({
    name: z.string().min(1).optional(),
    token: z.string().optional(),
  })
  .refine((v) => v.name || v.token, { message: "Nothing to update" });

router.patch(
  "/llm/tokens/:id",
  validate({
    params: z.object({ id: z.string().min(1) }),
    body: tokenPatchSchema,
  }),
  asyncHandler(async (req: Request) => {
    const id = String(req.params.id);
    const body = req.body as z.infer<typeof tokenPatchSchema>;
    await updateToken({ id, name: body.name, token: body.token });
    return { data: { success: true } };
  })
);

router.delete(
  "/llm/tokens/:id",
  validate({ params: z.object({ id: z.string().min(1) }) }),
  asyncHandler(async (req: Request) => {
    await deleteToken(String(req.params.id));
    return { data: { success: true } };
  })
);

router.get(
  "/llm/models",
  validate({
    query: z.object({
      providerId: providerIdSchema,
      scope: scopeSchema.optional().default("global"),
      scopeId: z.string().min(1).optional().default("global"),
      tokenId: z.string().min(1).optional(),
      modelOverride: z.string().min(1).optional(),
    }),
  }),
  asyncHandler(async (req: Request) => {
    const q = z
      .object({
        providerId: providerIdSchema,
        scope: scopeSchema.optional().default("global"),
        scopeId: z.string().min(1).optional().default("global"),
        tokenId: z.string().min(1).optional(),
        modelOverride: z.string().min(1).optional(),
      })
      .parse(req.query) as {
      providerId: LlmProviderId;
      scope: "global" | "agent";
      scopeId: string;
      tokenId?: string;
      modelOverride?: string;
    };

    const models = await getModels({
      providerId: q.providerId,
      scope: q.scope,
      scopeId: q.scopeId,
      tokenId: q.tokenId,
      modelOverride: q.modelOverride,
    });

    return { data: { models } };
  })
);

// Guardrail: expose only the new endpoints; legacy configs should not be used.
router.all(
  "/config/openrouter",
  asyncHandler(async () => {
    throw new HttpError(
      410,
      "Legacy endpoint removed",
      "LEGACY_ENDPOINT_REMOVED"
    );
  })
);

export default router;
