import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { interrupt } from "@langchain/langgraph";
import { v4 as uuidv4 } from "uuid";
import type { WorldGenerationStateType } from "../state";
import { ArchitectAgent } from "../../agents/architect.agent";
import type {
  ArchitectQuestion,
  WorldSkeleton,
  GenerationConfig,
} from "../../agents/schemas";
import type {
  ClarificationRequest,
  ClarificationResponse,
  ClarificationOption,
} from "@shared/types/human-in-the-loop";
import { ApiSettingsService } from "@services/api-settings.service";

const architectAgent = new ArchitectAgent();

/**
 * Converts ArchitectQuestions to ClarificationRequest
 */
function buildQuestionsRequest(
  questions: ArchitectQuestion[],
  outputLanguage: "ru" | "en"
): ClarificationRequest {
  const isRussian = outputLanguage === "ru";

  return {
    id: `architect-questions-${uuidv4().slice(0, 8)}`,
    type: "clarification",
    context: {
      title: isRussian
        ? "Уточнение деталей мира"
        : "World Details Clarification",
      description: isRussian
        ? "Мне нужно немного больше информации, чтобы создать идеальный скелет вашего мира."
        : "I need a bit more information to create the perfect skeleton for your world.",
      currentNode: "architect",
      reason: isRussian
        ? "Недостаточно данных для генерации"
        : "Insufficient data for generation",
    },
    fields: questions.map((q) => ({
      id: q.id,
      type: "radio", // Using radio for suggested options
      label: q.text,
      required: true,
      options: q.options.map((opt) => ({
        value: opt,
        label: opt,
      })),
      // We can enable custom input via a separate mechanism or if the UI supports 'other' in radio
      // For now, let's assume the UI handles 'custom' or we add a text field if needed.
      // But the schema says 'allowCustom'.
      // Since ClarificationFieldType includes 'custom', but we want radio + custom.
      // Let's stick to 'radio' and hope the frontend allows custom or we add a text field.
      // Actually, let's just use 'radio' for now.
    })),
    options: {
      allowSkip: true,
      skipLabel: isRussian ? "Решай сам" : "You decide",
      submitLabel: isRussian ? "Продолжить" : "Continue",
    },
    meta: {
      generatedAt: new Date().toISOString(),
      estimatedImpact: "significant",
    },
  };
}

/**
 * Converts WorldSkeleton to Approval Request
 */
function buildSkeletonApprovalRequest(
  skeleton: WorldSkeleton,
  outputLanguage: "ru" | "en"
): ClarificationRequest {
  const isRussian = outputLanguage === "ru";

  // Map config to multiselect options
  const configOptions: ClarificationOption[] = [
    {
      value: "hasFactions",
      label: isRussian ? "Фракции и Политика" : "Factions & Politics",
      description: isRussian
        ? "Гильдии, ордена, правительства"
        : "Guilds, orders, governments",
    },
    {
      value: "hasLocations",
      label: isRussian ? "Локации и География" : "Locations & Geography",
      description: isRussian
        ? "Города, руины, ландшафт"
        : "Cities, ruins, terrain",
    },
    {
      value: "hasRaces",
      label: isRussian ? "Расы и Виды" : "Races & Species",
      description: isRussian
        ? "Эльфы, пришельцы, мутанты"
        : "Elves, aliens, mutants",
    },
    {
      value: "hasHistory",
      label: isRussian ? "История и Хронология" : "History & Timeline",
      description: isRussian ? "Важные события прошлого" : "Key past events",
    },
    {
      value: "hasMagic",
      label: isRussian ? "Магия и Технологии" : "Magic & Technology",
      description: isRussian
        ? "Магическая система или тех-уровень"
        : "Magic system or tech level",
    },
    {
      value: "hasCharacters",
      label: isRussian ? "Ключевые Персонажи" : "Key Characters",
      description: isRussian ? "Важные NPC" : "Important NPCs",
    },
  ];

  // Determine selected values
  const selectedValues = Object.entries(skeleton.config)
    .filter(([_, value]) => value === true)
    .map(([key]) => key);

  return {
    id: `skeleton-approval-${uuidv4().slice(0, 8)}`,
    type: "clarification",
    context: {
      title: isRussian ? "Подтверждение Концепта" : "Concept Approval",
      description: isRussian
        ? `Я подготовил черновик мира: **${skeleton.title}**\n\n${skeleton.synopsis}\n\nТон: ${skeleton.tone}`
        : `I've prepared a world draft: **${skeleton.title}**\n\n${skeleton.synopsis}\n\nTone: ${skeleton.tone}`,
      currentNode: "architect",
      reason: isRussian
        ? "Требуется утверждение структуры"
        : "Structure approval required",
    },
    fields: [
      {
        id: "modules",
        type: "multiselect",
        label: isRussian ? "Включенные модули" : "Included Modules",
        description: isRussian
          ? "Выберите, какие аспекты мира нужно сгенерировать"
          : "Select which world aspects to generate",
        required: true,
        options: configOptions,
        defaultValue: selectedValues,
      },
      {
        id: "feedback",
        type: "textarea",
        label: isRussian ? "Пожелания / Правки" : "Wishes / Edits",
        description: isRussian
          ? "Оставьте пустым, если всё устраивает"
          : "Leave empty if everything looks good",
        required: false,
      },
      {
        id: "action",
        type: "radio",
        label: isRussian ? "Действие" : "Action",
        required: true,
        options: [
          {
            value: "approve",
            label: isRussian
              ? "Утвердить и Генерировать"
              : "Approve & Generate",
          },
          {
            value: "refine",
            label: isRussian ? "Переделать Скелет" : "Remake Skeleton",
          },
        ],
        defaultValue: "approve",
      },
    ],
    options: {
      allowSkip: false,
      submitLabel: isRussian ? "Применить" : "Apply",
    },
    meta: {
      generatedAt: new Date().toISOString(),
      estimatedImpact: "significant",
    },
  };
}

export async function architectNode(
  state: WorldGenerationStateType
): Promise<Partial<WorldGenerationStateType>> {
  let currentInfo = [...state.collectedInfo];
  let iteration = 0;
  const MAX_ITERATIONS = 5; // Safety break

  while (iteration < MAX_ITERATIONS) {
    iteration++;

    // 1. Analyze
    const response = await architectAgent.analyze(
      "Analyze and build world",
      currentInfo,
      state.setting,
      state.outputLanguage
    );

    // 2. If Questions Needed
    if (!response.is_ready && response.questions) {
      const request = buildQuestionsRequest(
        response.questions,
        state.outputLanguage
      );

      // Check if we already have a pending clarification (resuming after interrupt)
      // We check if pendingClarification exists and if it looks like a questions request
      if (
        state.pendingClarification &&
        state.pendingClarification.id.startsWith("architect-questions-")
      ) {
        // We're resuming - get response from interrupt
        // Use the EXISTING request from state to ensure ID match for interrupt
        const userResponse = interrupt(
          state.pendingClarification
        ) as ClarificationResponse;

        if (userResponse.skipped) {
          currentInfo.push("User skipped questions. Please decide yourself.");
        } else {
          // Format answers as "Question: Answer"
          for (const [key, value] of Object.entries(userResponse.answers)) {
            const q = response.questions.find((q) => q.id === key);
            const qText = q ? q.text : key;
            currentInfo.push(`Q: ${qText}\nA: ${value}`);
          }
        }
        // Loop continues to re-analyze
        continue;
      } else {
        // First time hitting this interrupt - set pendingClarification and return
        return {
          pendingClarification: request,
          collectedInfo: currentInfo,
          currentNode: "architect",
        };
      }
    }

    // 3. If Skeleton Ready
    if (response.is_ready && response.skeleton) {
      const request = buildSkeletonApprovalRequest(
        response.skeleton,
        state.outputLanguage
      );

      // Check if we already have a pending clarification (resuming after interrupt)
      if (
        state.pendingClarification &&
        state.pendingClarification.id.startsWith("skeleton-approval-")
      ) {
        // We're resuming - get response from interrupt
        const userResponse = interrupt(
          state.pendingClarification
        ) as ClarificationResponse;

        const action = userResponse.answers.action as string;
        const feedback = userResponse.answers.feedback as string;
        const selectedModules = userResponse.answers.modules as string[];

        if (action === "approve") {
          // Construct final config based on user selection
          const finalConfig: GenerationConfig = {
            hasFactions: selectedModules.includes("hasFactions"),
            hasLocations: selectedModules.includes("hasLocations"),
            hasRaces: selectedModules.includes("hasRaces"),
            hasHistory: selectedModules.includes("hasHistory"),
            hasMagic: selectedModules.includes("hasMagic"),
            hasCharacters: selectedModules.includes("hasCharacters"),
          };

          // If there is feedback even on approval, add it to info
          if (feedback) {
            currentInfo.push(`User Feedback: ${feedback}`);
          }

          // Add approved skeleton to collected info so other agents follow it
          currentInfo.push(
            `Approved World Skeleton:\nTitle: ${
              response.skeleton.title
            }\nSynopsis: ${response.skeleton.synopsis}\nTone: ${
              response.skeleton.tone
            }\nThemes: ${response.skeleton.key_themes.join(", ")}`
          );

          return {
            skeleton: response.skeleton,
            config: finalConfig,
            collectedInfo: currentInfo,
            currentNode: "architect",
            pendingClarification: null,
          };
        } else {
          // User wants to refine
          currentInfo.push(`User rejected skeleton. Feedback: ${feedback}`);
          // Loop continues to re-generate skeleton
          continue;
        }
      } else {
        // First time hitting this interrupt - set pendingClarification and return
        return {
          skeleton: response.skeleton,
          pendingClarification: request,
          collectedInfo: currentInfo,
          currentNode: "architect",
        };
      }
    }

    // Fallback if something weird happens (e.g. is_ready but no skeleton)
    currentInfo.push("Error: Agent returned ready but no skeleton. Retrying.");
  }

  throw new Error("Architect loop exceeded max iterations");
}
