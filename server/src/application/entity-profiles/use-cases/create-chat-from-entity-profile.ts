import { HttpError } from "@core/middleware/error-handler";

import {
  createChat,
  createImportedAssistantMessage,
} from "../../../services/chat-core/chats-repository";
import { getEntityProfileById } from "../../../services/chat-core/entity-profiles-repository";
import {
  buildInstructionRenderContext,
  resolveAndApplyWorldInfoToTemplateContext,
} from "../../../services/chat-core/prompt-template-context";
import { getBranchCurrentTurn } from "../../../services/chat-entry-parts/branch-turn-repository";
import { createEntryWithVariant } from "../../../services/chat-entry-parts/entries-repository";
import { createPart } from "../../../services/chat-entry-parts/parts-repository";
import {
  createVariant,
  updateVariantDerived,
} from "../../../services/chat-entry-parts/variants-repository";
import { renderGreetingTemplateSinglePass } from "../greeting-template";

export type CreateChatFromEntityProfileInput = {
  entityProfileId: string;
  ownerId: string;
  title: string;
  meta?: unknown;
};

export async function createChatFromEntityProfile(
  params: CreateChatFromEntityProfileInput
): Promise<Awaited<ReturnType<typeof createChat>>> {
  const profile = await getEntityProfileById(params.entityProfileId);
  if (!profile) {
    throw new HttpError(404, "EntityProfile не найден", "NOT_FOUND");
  }

  const created = await createChat({
    ownerId: params.ownerId,
    entityProfileId: params.entityProfileId,
    title: params.title,
    meta: params.meta,
  });

  try {
    await seedEntityProfileGreetings({
      ownerId: params.ownerId,
      entityProfileId: params.entityProfileId,
      profile,
      chatId: created.chat.id,
      branchId: created.mainBranch.id,
    });
  } catch {
    // best-effort; don't fail chat creation
  }

  return created;
}

async function seedEntityProfileGreetings(params: {
  ownerId: string;
  entityProfileId: string;
  profile: Awaited<ReturnType<typeof getEntityProfileById>> extends infer T
    ? Exclude<T, null>
    : never;
  chatId: string;
  branchId: string;
}): Promise<void> {
  const spec =
    typeof params.profile.spec === "object" &&
    params.profile.spec !== null &&
    !Array.isArray(params.profile.spec)
      ? (params.profile.spec as Record<string, unknown>)
      : {};
  const firstMes = typeof spec.first_mes === "string" ? spec.first_mes.trim() : "";
  if (firstMes.length === 0) return;

  const altGreetings = (Array.isArray(spec.alternate_greetings)
    ? spec.alternate_greetings
    : []
  )
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  const greetingTemplateContext = await buildInstructionRenderContext({
    ownerId: params.ownerId,
    chatId: params.chatId,
    branchId: params.branchId,
    entityProfileId: params.entityProfileId,
    historyLimit: 50,
  });
  await resolveAndApplyWorldInfoToTemplateContext({
    context: greetingTemplateContext,
    ownerId: params.ownerId,
    chatId: params.chatId,
    branchId: params.branchId,
    entityProfileId: params.entityProfileId,
    trigger: "generate",
    dryRun: true,
  });

  const createdTurn = await getBranchCurrentTurn({ branchId: params.branchId });
  const firstMesRender = await renderGreetingTemplateSinglePass({
    rawTemplate: firstMes,
    context: greetingTemplateContext,
  });

  const seeded = await createEntryWithVariant({
    ownerId: params.ownerId,
    chatId: params.chatId,
    branchId: params.branchId,
    role: "assistant",
    variantKind: "import",
    meta: { imported: true, source: "entity_profile_import", kind: "first_mes" },
  });

  await createPart({
    ownerId: params.ownerId,
    variantId: seeded.variant.variantId,
    channel: "main",
    order: 0,
    payload: firstMesRender.rendered,
    payloadFormat: "markdown",
    visibility: { ui: "always", prompt: true },
    ui: { rendererId: "markdown" },
    prompt: { serializerId: "asText" },
    lifespan: "infinite",
    createdTurn,
    source: "import",
  });
  await updateVariantDerived({
    variantId: seeded.variant.variantId,
    derived: {
      templateSeed: firstMesRender.seed,
    },
  });

  for (const greeting of altGreetings) {
    const altRender = await renderGreetingTemplateSinglePass({
      rawTemplate: greeting,
      context: greetingTemplateContext,
    });
    const variant = await createVariant({
      ownerId: params.ownerId,
      entryId: seeded.entry.entryId,
      kind: "import",
      derived: {
        templateSeed: altRender.seed,
      },
    });
    await createPart({
      ownerId: params.ownerId,
      variantId: variant.variantId,
      channel: "main",
      order: 0,
      payload: altRender.rendered,
      payloadFormat: "markdown",
      visibility: { ui: "always", prompt: true },
      ui: { rendererId: "markdown" },
      prompt: { serializerId: "asText" },
      lifespan: "infinite",
      createdTurn,
      source: "import",
    });
  }

  await createImportedAssistantMessage({
    ownerId: params.ownerId,
    chatId: params.chatId,
    branchId: params.branchId,
    promptText: firstMesRender.rendered,
    meta: { source: "entity_profile_import", kind: "first_mes" },
  });
}
