import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { WorldDataSchema } from "src/schemas/world";
import type { WorldGenerationStateType } from "../state";
import { buildRefinePrompt } from "../prompts/refine.prompt";
import { ApiSettingsService } from "@services/api-settings.service";

export async function refineNode(
  state: WorldGenerationStateType
): Promise<Partial<WorldGenerationStateType>> {
  const settings = await ApiSettingsService.getInternalSettings();

  if (!settings?.token) {
    throw new Error("API token not configured");
  }

  const openrouter = createOpenRouter({
    apiKey: settings.token,
  });

  const prompt = buildRefinePrompt(state);

  // Refine возвращает полный WorldData с исправлениями
  const { object } = await generateObject({
    model: openrouter(settings.model || "openai/gpt-4o"),
    schema: WorldDataSchema,
    prompt,
  });

  return {
    base: {
      name: object.name,
      genre: object.genre,
      tone: object.tone,
      world_primer: object.world_primer,
    },
    factions: object.factions ?? state.factions,
    locations: object.locations ?? state.locations,
    races: object.races ?? state.races,
    history: object.history ?? state.history,
    magic: object.magic ?? state.magic,
    currentNode: "refineWorld",
  };
}

