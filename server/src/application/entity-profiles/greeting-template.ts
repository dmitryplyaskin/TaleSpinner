import { renderLiquidTemplate } from "../../services/chat-core/prompt-template-renderer";

export type GreetingTemplateSeed = {
  engine: "liquidjs";
  rawTemplate: string;
  renderedForUserPersonId: string | null;
  renderedAt: string;
  renderError?: string;
};

const TEMPLATE_MAX_PASSES = 3;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractSelectedUserId(contextUser: unknown): string | null {
  if (!isRecord(contextUser)) return null;
  return typeof contextUser.id === "string" ? contextUser.id : null;
}

export async function renderGreetingTemplateSinglePass(params: {
  rawTemplate: string;
  context: {
    char: unknown;
    user: unknown;
    chat: unknown;
    messages: Array<{ role: string; content: string }>;
    rag: unknown;
    art?: Record<string, unknown>;
    now: string;
  };
}): Promise<{
  rendered: string;
  seed: GreetingTemplateSeed;
}> {
  const renderedForUserPersonId = extractSelectedUserId(params.context.user);
  const baseSeed: GreetingTemplateSeed = {
    engine: "liquidjs",
    rawTemplate: params.rawTemplate,
    renderedForUserPersonId,
    renderedAt: new Date().toISOString(),
  };

  try {
    const rendered = String(
      await renderLiquidTemplate({
        templateText: params.rawTemplate,
        context: params.context,
        options: {
          strictVariables: false,
          maxPasses: TEMPLATE_MAX_PASSES,
        },
      })
    );
    return {
      rendered,
      seed: baseSeed,
    };
  } catch (error) {
    return {
      rendered: params.rawTemplate,
      seed: {
        ...baseSeed,
        renderError: error instanceof Error ? error.message : String(error),
      },
    };
  }
}
