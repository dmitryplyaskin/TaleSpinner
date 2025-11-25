import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { v4 as uuidv4 } from "uuid";
import { ClarificationRequestSchema } from "src/schemas/clarification";
import type { ClarificationRequest } from "@shared/types/human-in-the-loop";
import type { WorldGenerationStateType } from "../state";
import type { BaseWorldData } from "src/schemas/world";
import { ApiSettingsService } from "@services/api-settings.service";

/**
 * Генерирует запрос уточнения на основе контекста
 */
export async function generateClarificationRequest(
  context: {
    currentNode: string;
    reason: string;
    baseWorld?: BaseWorldData | null;
    collectedInfo: string[];
    outputLanguage: "ru" | "en";
  }
): Promise<ClarificationRequest> {
  const settings = await ApiSettingsService.getInternalSettings();

  if (!settings?.token) {
    throw new Error("API token not configured");
  }

  const openrouter = createOpenRouter({
    apiKey: settings.token,
  });

  const languagePrompt = context.outputLanguage === "ru"
    ? "Generate all text content (titles, labels, descriptions) in Russian."
    : "Generate all text content (titles, labels, descriptions) in English.";

  const worldContext = context.baseWorld
    ? `
Current world state:
- Name: ${context.baseWorld.name}
- Genre: ${context.baseWorld.genre}
- Tone: ${context.baseWorld.tone}
`
    : "No world generated yet.";

  const { object } = await generateObject({
    model: openrouter(settings.model || "openai/gpt-4o"),
    schema: ClarificationRequestSchema,
    prompt: `
You are generating a clarification request for the user during world generation.

${worldContext}

User's original input: ${JSON.stringify(context.collectedInfo)}

Current generation stage: ${context.currentNode}
Reason for clarification: ${context.reason}

Determine what clarifications would improve the world quality.
Generate appropriate fields (slider, radio, text, etc.) based on what needs clarification.
Make questions specific, contextual, and engaging.

${languagePrompt}

Rules:
- Maximum 3-4 fields per request
- Use radio for choosing between options
- Use slider for degree/intensity questions
- Use confirm for yes/no questions
- Always provide helpful descriptions
- Set allowSkip to true so users can skip if they prefer
- The id field should be a unique identifier like "clarify-${context.currentNode}-001"
- Set estimatedImpact based on how much this will affect the world
    `.trim(),
  });

  // Ensure the id is unique
  return {
    ...object,
    id: object.id || `clarify-${context.currentNode}-${uuidv4().slice(0, 8)}`,
  };
}

/**
 * Проверяет, нужно ли уточнение для base world
 */
export function needsBaseClarification(
  baseWorld: BaseWorldData,
  collectedInfo: string[]
): boolean {
  // Если пользователь предоставил мало информации
  if (collectedInfo.length < 2) {
    return true;
  }

  // Если тон слишком общий
  const vagueTones = ["fantasy", "dark", "epic", "light"];
  const toneIsVague = vagueTones.some(
    (t) =>
      baseWorld.tone.toLowerCase().includes(t) &&
      baseWorld.tone.split(" ").length < 3
  );

  return toneIsVague;
}

/**
 * Применяет ответы пользователя к base world
 */
export function refineBaseWorldWithAnswers(
  baseWorld: BaseWorldData,
  answers: Record<string, string | string[] | boolean | number>
): BaseWorldData {
  // Создаём копию
  const refined = { ...baseWorld };

  // Применяем ответы в зависимости от типа
  for (const [key, value] of Object.entries(answers)) {
    if (key === "darkness_level" && typeof value === "number") {
      // Уровень мрачности влияет на тон
      const darknessDescriptions: Record<number, string> = {
        1: "light and hopeful",
        2: "mostly optimistic",
        3: "balanced",
        4: "slightly dark",
        5: "moderately dark",
        6: "dark and gritty",
        7: "grim",
        8: "very grim",
        9: "oppressive",
        10: "utterly hopeless",
      };
      refined.tone = `${refined.tone} (${darknessDescriptions[value] || "moderate"})`;
    }

    if (key === "violence_level" && typeof value === "string") {
      refined.tone = `${refined.tone}, ${value} violence`;
    }

    if (key === "hope_exists" && typeof value === "boolean") {
      refined.tone = value
        ? `${refined.tone} with glimmers of hope`
        : `${refined.tone}, hopeless`;
    }
  }

  return refined;
}

