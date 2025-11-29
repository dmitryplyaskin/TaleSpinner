import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { interrupt } from "@langchain/langgraph";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import type { WorldGenerationStateType, ReviewIssue } from "../state";
import { buildReviewPrompt } from "../prompts/review.prompt";
import { ApiSettingsService } from "@services/api-settings.service";
import type {
  ClarificationRequest,
  ClarificationResponse,
} from "@shared/types/human-in-the-loop";

const ReviewResultSchema = z.object({
  isConsistent: z.boolean(),
  issues: z.array(
    z.object({
      category: z.enum([
        "factions",
        "locations",
        "races",
        "history",
        "magic",
        "general",
      ]),
      description: z.string(),
      severity: z.enum(["critical", "warning"]),
    })
  ),
});

/**
 * Создаёт запрос уточнения для разрешения конфликта
 */
function createConflictResolutionRequest(
  issues: ReviewIssue[],
  outputLanguage: "ru" | "en"
): ClarificationRequest {
  const isRussian = outputLanguage === "ru";

  const criticalIssues = issues.filter((i) => i.severity === "critical");
  const issueDescriptions = criticalIssues
    .map((i) => `- ${i.category}: ${i.description}`)
    .join("\n");

  return {
    id: `clarify-review-${uuidv4().slice(0, 8)}`,
    type: "clarification",
    context: {
      title: isRussian ? "Найдены несоответствия" : "Inconsistencies Found",
      description: isRussian
        ? `Обнаружены проблемы в сгенерированном мире:\n${issueDescriptions}`
        : `Issues found in the generated world:\n${issueDescriptions}`,
      currentNode: "reviewWorld",
      reason: isRussian
        ? "Нужно решить как устранить противоречия"
        : "Need to decide how to resolve contradictions",
    },
    fields: [
      {
        id: "resolution_approach",
        type: "radio",
        label: isRussian ? "Как исправить?" : "How to fix?",
        required: true,
        options: [
          {
            value: "auto_fix",
            label: isRussian ? "Исправить автоматически" : "Fix automatically",
            description: isRussian
              ? "Система сама исправит найденные проблемы"
              : "System will automatically fix the issues",
          },
          {
            value: "keep_as_is",
            label: isRussian ? "Оставить как есть" : "Keep as is",
            description: isRussian
              ? "Проигнорировать найденные несоответствия"
              : "Ignore the found inconsistencies",
          },
        ],
      },
    ],
    options: {
      allowSkip: true,
      skipLabel: isRussian
        ? "Исправь как считаешь нужным"
        : "Fix as you see fit",
      submitLabel: isRussian ? "Применить" : "Apply",
    },
    meta: {
      generatedAt: new Date().toISOString(),
      estimatedImpact: "moderate",
    },
  };
}

export async function reviewNode(
  state: WorldGenerationStateType
): Promise<Partial<WorldGenerationStateType>> {
  const settings = await ApiSettingsService.getInternalSettings();

  if (!settings?.token) {
    throw new Error("API token not configured");
  }

  const openrouter = createOpenRouter({
    apiKey: settings.token,
  });

  const prompt = buildReviewPrompt(state);

  const { object } = await generateObject({
    model: openrouter(settings.model || "openai/gpt-4o"),
    schema: ReviewResultSchema,
    prompt,
  });

  const issues = object.issues as ReviewIssue[];
  const hasCriticalIssues = issues.some((i) => i.severity === "critical");

  // Если есть критические проблемы и это первая итерация, спрашиваем пользователя
  if (hasCriticalIssues && state.iterationCount === 0) {
    const clarificationRequest = createConflictResolutionRequest(
      issues,
      state.outputLanguage
    );

    // Check if we're resuming after interrupt
    if (state.pendingClarification) {
      // We're resuming - get response from interrupt
      const userResponse = interrupt(
        state.pendingClarification
      ) as ClarificationResponse;

      // Если пользователь выбрал "оставить как есть"
      if (
        !userResponse.skipped &&
        userResponse.answers.resolution_approach === "keep_as_is"
      ) {
        return {
          isConsistent: true, // Считаем консистентным по желанию пользователя
          reviewIssues: issues,
          iterationCount: state.iterationCount + 1,
          currentNode: "reviewWorld",
          pendingClarification: null,
          clarificationHistory: [userResponse],
        };
      }
    } else {
      // First time hitting this interrupt - set pendingClarification and return
      return {
        isConsistent: false,
        reviewIssues: issues,
        iterationCount: state.iterationCount,
        currentNode: "reviewWorld",
        pendingClarification: clarificationRequest,
      };
    }
  }

  return {
    isConsistent: object.isConsistent,
    reviewIssues: issues,
    iterationCount: state.iterationCount + 1,
    currentNode: "reviewWorld",
    pendingClarification: null,
  };
}
