import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { RacesResultSchema } from "src/schemas/world";
import type { WorldGenerationStateType } from "../state";
import { buildRacesPrompt } from "../prompts/races.prompt";
import { ApiSettingsService } from "@services/api-settings.service";

export async function racesNode(
  state: WorldGenerationStateType
): Promise<Partial<WorldGenerationStateType>> {
  if (!state.base) {
    throw new Error("racesNode requires base world data");
  }

  // Skip if not requested
  if (state.config && !state.config.hasRaces) {
    return { currentNode: "generateRaces" };
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
    schema: RacesResultSchema,
    prompt: buildRacesPrompt(
      state.base,
      state.collectedInfo,
      state.outputLanguage
    ),
  });

  return {
    races: object.races,
    currentNode: "generateRaces",
  };
}

