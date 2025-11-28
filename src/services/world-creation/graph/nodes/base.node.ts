import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { interrupt } from "@langchain/langgraph";
import { BaseWorldDataSchema } from "src/schemas/world";
import type { WorldGenerationStateType } from "../state";
import { buildBasePrompt } from "../prompts/base.prompt";
import { ApiSettingsService } from "@services/api-settings.service";
import type { ClarificationResponse } from "@shared/types/human-in-the-loop";
import {
  generateClarificationRequest,
  needsBaseClarification,
  refineBaseWorldWithAnswers,
} from "../utils/clarification.utils";

export async function baseNode(
  state: WorldGenerationStateType
): Promise<Partial<WorldGenerationStateType>> {
  const settings = await ApiSettingsService.getInternalSettings();

  if (!settings?.token) {
    throw new Error("API token not configured");
  }

  const openrouter = createOpenRouter({
    apiKey: settings.token,
  });

  // Генерируем базовый мир
  const { object: baseWorld } = await generateObject({
    model: openrouter(settings.model || "openai/gpt-4o"),
    schema: BaseWorldDataSchema,
    prompt: buildBasePrompt(
      state.collectedInfo,
      state.setting,
      state.outputLanguage
    ),
  });

  // Проверяем нужно ли уточнение
  if (needsBaseClarification(baseWorld, state.collectedInfo)) {
    // Агент генерирует структуру вопросов
    const clarificationRequest = await generateClarificationRequest({
      currentNode: "generateBase",
      reason: "Need more details about world tone and atmosphere",
      baseWorld,
      collectedInfo: state.collectedInfo,
      outputLanguage: state.outputLanguage,
    });

    // Прерываем выполнение и ждём ответа пользователя
    const userResponse = interrupt(clarificationRequest) as ClarificationResponse;

    // Продолжаем с ответом пользователя
    if (!userResponse.skipped) {
      const refinedWorld = refineBaseWorldWithAnswers(baseWorld, userResponse.answers);
      return {
        base: refinedWorld,
        currentNode: "generateBase",
        pendingClarification: null,
        clarificationHistory: [userResponse],
      };
    }
  }

  return {
    base: baseWorld,
    currentNode: "generateBase",
    pendingClarification: null,
  };
}
