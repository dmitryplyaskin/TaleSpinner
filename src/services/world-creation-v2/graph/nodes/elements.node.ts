import { interrupt } from "@langchain/langgraph";
import { generateObject } from "ai";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";
import type { WorldCreationV2StateType } from "../state";
import {
  DynamicWorldElementSchema,
  WorldElementCategorySchema,
  type WorldElementType,
  type ElementsClarificationRequest,
} from "../../schemas";
import { elementsPrompt, getElementTypeInfo } from "../../prompts";
import { ApiSettingsService } from "@services/api-settings.service";

/**
 * Схема для результата генерации элементов
 */
const ElementsOutputSchema = z.object({
  needsClarification: z.boolean(),
  clarificationReason: z.string().optional(),
  questions: z
    .array(
      z.object({
        id: z.string(),
        question: z.string(),
        options: z.array(
          z.object({
            id: z.string(),
            label: z.string(),
          })
        ),
        allowCustomAnswer: z.boolean().default(true),
      })
    )
    .optional(),
  category: WorldElementCategorySchema.optional(),
});

/**
 * Node для генерации элементов мира
 */
export async function elementsNode(
  state: WorldCreationV2StateType
): Promise<Partial<WorldCreationV2StateType>> {
  const {
    skeleton,
    generatedCategories,
    elementsToGenerate,
    currentElementType,
  } = state;

  if (!skeleton) {
    console.error("[ElementsNode] No skeleton available");
    return {
      errors: ["No skeleton available for elements generation"],
      currentPhase: "error",
    };
  }

  // Определяем следующий элемент для генерации
  const generatedTypes = generatedCategories.map((c) => c.categoryId);
  const nextElementType = elementsToGenerate.find(
    (e) => !generatedTypes.includes(e)
  ) as WorldElementType | undefined;

  if (!nextElementType) {
    console.log("[ElementsNode] All elements generated!");
    return {
      currentPhase: "completed",
      currentElementType: "",
    };
  }

  console.log(`[ElementsNode] Generating: ${nextElementType}`);

  // Получаем настройки API
  const apiSettings = await ApiSettingsService.getInternalSettings();
  const modelId = apiSettings?.model || "anthropic/claude-sonnet-4";

  const prompt = elementsPrompt(skeleton, nextElementType, generatedTypes);

  try {
    const result = await generateObject({
      model: openrouter(modelId),
      schema: ElementsOutputSchema,
      prompt,
    });

    const output = result.object;

    // Если нужны уточнения
    if (
      output.needsClarification &&
      output.questions &&
      output.questions.length > 0
    ) {
      console.log(`[ElementsNode] Needs clarification for ${nextElementType}`);

      const clarification: ElementsClarificationRequest = {
        type: "elements_clarification",
        elementType: nextElementType,
        reason: output.clarificationReason || "Требуется уточнение",
        questions: output.questions,
      };

      // Прерываем граф
      const userResponse = interrupt(clarification) as {
        answers: Record<string, string>;
      };

      console.log("[ElementsNode] Received user response:", userResponse);

      // Генерируем заново с учётом ответов
      const enrichedPrompt = `${prompt}

## Дополнительные уточнения от пользователя:
${Object.entries(userResponse.answers)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join("\n")}

Теперь создай элементы с учётом этой информации.`;

      const retryResult = await generateObject({
        model: openrouter(modelId),
        schema: WorldElementCategorySchema,
        prompt: enrichedPrompt,
      });

      return {
        generatedCategories: [retryResult.object],
        currentElementType: nextElementType,
        pendingClarification: null,
        currentPhase: "elements_generating",
      };
    }

    // Категория готова
    if (output.category) {
      console.log(
        `[ElementsNode] Generated ${output.category.elements.length} elements for ${nextElementType}`
      );

      return {
        generatedCategories: [output.category],
        currentElementType: nextElementType,
        pendingClarification: null,
        currentPhase: "elements_generating",
      };
    }

    // Принудительная генерация
    console.warn("[ElementsNode] No category in output, forcing generation...");

    const info = getElementTypeInfo(nextElementType);
    const forcedResult = await generateObject({
      model: openrouter(modelId),
      schema: z.object({
        elements: z.array(DynamicWorldElementSchema),
      }),
      prompt: `${prompt}

Создай 3-5 элементов типа "${info.name}".`,
    });

    const forcedCategory = {
      categoryId: nextElementType,
      categoryName: info.name,
      categoryDescription: info.description,
      elements: forcedResult.object.elements,
    };

    return {
      generatedCategories: [forcedCategory],
      currentElementType: nextElementType,
      pendingClarification: null,
      currentPhase: "elements_generating",
    };
  } catch (error) {
    console.error(`[ElementsNode] Error generating ${nextElementType}:`, error);
    return {
      errors: [`Error generating ${nextElementType}: ${String(error)}`],
      currentPhase: "error",
    };
  }
}
