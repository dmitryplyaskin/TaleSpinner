import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { HistoryResultSchema } from "src/schemas/world";
import type { WorldGenerationStateType } from "../state";
import { buildHistoryPrompt } from "../prompts/history.prompt";
import { ApiSettingsService } from "@services/api-settings.service";

export async function historyNode(
  state: WorldGenerationStateType
): Promise<Partial<WorldGenerationStateType>> {
  // History получает контекст от других агентов
  if (!state.base || !state.factions || !state.locations || !state.races) {
    throw new Error(
      "historyNode requires base, factions, locations, and races"
    );
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
    schema: HistoryResultSchema,
    prompt: buildHistoryPrompt({
      base: state.base,
      factions: state.factions,
      locations: state.locations,
      races: state.races,
      collectedInfo: state.collectedInfo,
      outputLanguage: state.outputLanguage,
    }),
  });

  return {
    history: object.history,
    currentNode: "generateHistory",
  };
}

