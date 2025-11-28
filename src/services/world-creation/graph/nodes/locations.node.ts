import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { LocationsResultSchema } from "src/schemas/world";
import type { WorldGenerationStateType } from "../state";
import { buildLocationsPrompt } from "../prompts/locations.prompt";
import { ApiSettingsService } from "@services/api-settings.service";

export async function locationsNode(
  state: WorldGenerationStateType
): Promise<Partial<WorldGenerationStateType>> {
  if (!state.base) {
    throw new Error("locationsNode requires base world data");
  }

  // Skip if not requested
  if (state.config && !state.config.hasLocations) {
    return { currentNode: "generateLocations" };
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
    schema: LocationsResultSchema,
    prompt: buildLocationsPrompt(
      state.base,
      state.collectedInfo,
      state.outputLanguage
    ),
  });

  return {
    locations: object.locations,
    currentNode: "generateLocations",
  };
}

