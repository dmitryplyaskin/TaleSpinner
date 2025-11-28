import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { MagicResultSchema } from "src/schemas/world";
import type { WorldGenerationStateType } from "../state";
import { buildMagicPrompt } from "../prompts/magic.prompt";
import { ApiSettingsService } from "@services/api-settings.service";

export async function magicNode(
  state: WorldGenerationStateType
): Promise<Partial<WorldGenerationStateType>> {
  // Magic получает контекст от всех предыдущих агентов
  if (!state.base) {
    throw new Error("magicNode requires base world data");
  }

  // Skip if not requested
  if (state.config && !state.config.hasMagic) {
    return { currentNode: "generateMagic" };
  }

  const settings = await ApiSettingsService.getInternalSettings();

  if (!settings?.token) {
    throw new Error("API token not configured");
  }

  const openrouter = createOpenRouter({
    apiKey: settings.token,
  });

  const { object } = await generateObject({
    model: openrouter(settings.model || "openai/gpt-4o"),
    schema: MagicResultSchema,
    prompt: buildMagicPrompt({
      base: state.base,
      factions: state.factions || [],
      locations: state.locations || [],
      races: state.races || [],
      history: state.history || [],
      collectedInfo: state.collectedInfo,
      outputLanguage: state.outputLanguage,
    }),
  });

  return {
    magic: object.magic,
    currentNode: "generateMagic",
  };
}
