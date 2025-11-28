import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { FactionsResultSchema } from "src/schemas/world";
import type { WorldGenerationStateType } from "../state";
import { buildFactionsPrompt } from "../prompts/factions.prompt";
import { ApiSettingsService } from "@services/api-settings.service";

export async function factionsNode(
  state: WorldGenerationStateType
): Promise<Partial<WorldGenerationStateType>> {
  if (!state.base) {
    throw new Error("factionsNode requires base world data");
  }

  // Skip if not requested
  if (state.config && !state.config.hasFactions) {
    return { currentNode: "generateFactions" };
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
    schema: FactionsResultSchema,
    prompt: buildFactionsPrompt(
      state.base,
      state.collectedInfo,
      state.outputLanguage
    ),
  });

  return {
    factions: object.factions,
    currentNode: "generateFactions",
  };
}

