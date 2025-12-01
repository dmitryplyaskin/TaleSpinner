import { interrupt } from "@langchain/langgraph";
import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";
import type { WorldCreationV2StateType } from "../state";
import {
  ArchitectQuestionSchema,
  WorldSkeletonSchema,
  type ArchitectClarification,
} from "../../schemas";
import { architectPrompt, architectFinalPrompt } from "../../prompts";
import { ApiSettingsService } from "@services/api-settings.service";

const MAX_ARCHITECT_ITERATIONS = 3;

/**
 * Схема результата работы архитектора
 */
const ArchitectOutputSchema = z.object({
  needsClarification: z.boolean(),
  clarificationReason: z.string().optional(),
  questions: z.array(ArchitectQuestionSchema).optional(),
  skeleton: WorldSkeletonSchema.optional(),
});

/**
 * Node архитектора - создаёт скелет мира или запрашивает уточнения
 */
export async function architectNode(
  state: WorldCreationV2StateType
): Promise<Partial<WorldCreationV2StateType>> {
  const { genre, userInput, clarificationHistory, architectIterations } = state;

  console.log(
    `[ArchitectNode] Starting iteration ${
      architectIterations + 1
    }/${MAX_ARCHITECT_ITERATIONS}`
  );

  // Получаем настройки API
  const apiSettings = await ApiSettingsService.getInternalSettings();
  const modelId = apiSettings?.model || "anthropic/claude-sonnet-4";
  const apiKey = apiSettings?.token;

  if (!apiKey) {
    console.error("[ArchitectNode] No API key configured");
    return {
      errors: ["API ключ OpenRouter не настроен. Перейдите в настройки и добавьте токен."],
      currentPhase: "error",
    };
  }

  const openrouter = createOpenRouter({ apiKey });

  // Определяем промпт в зависимости от итерации
  const prompt =
    clarificationHistory.length > 0 &&
    architectIterations >= MAX_ARCHITECT_ITERATIONS - 1
      ? architectFinalPrompt(genre, userInput, clarificationHistory)
      : architectPrompt(genre, userInput, clarificationHistory);

  try {
    const result = await generateObject({
      model: openrouter(modelId),
      schema: ArchitectOutputSchema,
      prompt,
    });

    const output = result.object;

    // Если нужны уточнения и не превышен лимит
    if (
      output.needsClarification &&
      output.questions &&
      output.questions.length > 0 &&
      architectIterations < MAX_ARCHITECT_ITERATIONS
    ) {
      console.log(
        `[ArchitectNode] Needs clarification, ${output.questions.length} questions`
      );

      const clarification: ArchitectClarification = {
        type: "architect_clarification",
        reason:
          output.clarificationReason || "Требуется дополнительная информация",
        questions: output.questions,
        iteration: architectIterations + 1,
      };

      // Прерываем граф и ждём ответа пользователя
      const userResponse = interrupt(clarification) as {
        answers: Record<string, string>;
      };

      console.log("[ArchitectNode] Received user response:", userResponse);

      // После resume - обрабатываем ответ
      const newHistory = output.questions.map((q) => ({
        question: q.question,
        answer: userResponse.answers[q.id] || "",
      }));

      return {
        clarificationHistory: newHistory,
        architectIterations: architectIterations + 1,
        pendingClarification: null,
        currentPhase: "architect_processing",
      };
    }

    // Скелет готов
    if (output.skeleton) {
      console.log(`[ArchitectNode] Skeleton ready: ${output.skeleton.name}`);

      return {
        skeleton: output.skeleton,
        elementsToGenerate: output.skeleton.elementsToGenerate,
        pendingClarification: null,
        currentPhase: "skeleton_ready",
      };
    }

    // Что-то пошло не так - генерируем скелет принудительно
    console.warn(
      "[ArchitectNode] No skeleton in output, forcing generation..."
    );

    const forcedResult = await generateObject({
      model: openrouter(modelId),
      schema: WorldSkeletonSchema,
      prompt: architectFinalPrompt(genre, userInput, clarificationHistory),
    });

    return {
      skeleton: forcedResult.object,
      elementsToGenerate: forcedResult.object.elementsToGenerate,
      pendingClarification: null,
      currentPhase: "skeleton_ready",
    };
  } catch (error) {
    console.error("[ArchitectNode] Error:", error);
    return {
      errors: [String(error)],
      currentPhase: "error",
    };
  }
}
