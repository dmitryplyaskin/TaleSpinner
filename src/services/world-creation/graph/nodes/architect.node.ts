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
  ClarificationField,
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
    fields: questions
      .map((q) => ({
        id: q.id,
        type: "radio" as const,
        label: q.text,
        required: true,
        options: q.options.map((opt) => ({
          value: opt,
          label:
            opt === "custom" ? (isRussian ? "Свой вариант" : "Custom") : opt,
        })),
      }))
      .flatMap((f) => [
        f,
        {
          id: `${f.id}_custom`,
          type: "textarea" as const,
          label: isRussian ? "Ваш ответ" : "Your answer",
          required: false,
          conditional: {
            dependsOn: f.id,
            showWhen: ["custom"],
          },
        },
      ]) as ClarificationField[],
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
        ? "Пожалуйста, проверьте и отредактируйте концепцию вашего мира перед полной генерацией."
        : "Please review and edit your world concept before full generation.",
      currentNode: "architect",
      reason: isRussian
        ? "Требуется утверждение структуры"
        : "Structure approval required",
    },
    fields: [
      {
        id: "title",
        type: "text",
        label: isRussian ? "Название" : "Title",
        required: true,
        defaultValue: skeleton.title,
      },
      {
        id: "synopsis",
        type: "textarea",
        label: isRussian ? "Синопсис" : "Synopsis",
        required: true,
        defaultValue: skeleton.synopsis,
      },
      {
        id: "tone",
        type: "text",
        label: isRussian ? "Тон" : "Tone",
        required: true,
        defaultValue: skeleton.tone,
      },
      {
        id: "themes",
        type: "text",
        label: isRussian ? "Ключевые темы" : "Key Themes",
        required: true,
        defaultValue: skeleton.key_themes.join(", "),
      },
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
        label: isRussian ? "Комментарий к генерации" : "Generation Feedback",
        description: isRussian
          ? "Дополнительные пожелания для агентов"
          : "Additional instructions for agents",
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
    data: {
      skeleton,
    },
  };
}

export async function architectNode(
  state: WorldGenerationStateType
): Promise<Partial<WorldGenerationStateType>> {
  let currentInfo = [...state.collectedInfo];
  // Persist iteration count from state
  let iteration = state.iterationCount || 0;
  const MAX_ITERATIONS = 3;

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
      // Transform questions to include "Custom" option logic
      const questionsWithCustom = response.questions.map((q) => ({
        ...q,
        options: [...q.options, "custom"],
      }));

      const request = buildQuestionsRequest(
        questionsWithCustom,
        state.outputLanguage
      );

      // Check if we already have a pending clarification (resuming after interrupt)
      if (
        state.pendingClarification &&
        state.pendingClarification.id.startsWith("architect-questions-")
      ) {
        // We're resuming - get response from interrupt
        const userResponse = interrupt(
          state.pendingClarification
        ) as ClarificationResponse;

        if (userResponse.skipped) {
          currentInfo.push("User skipped questions. Please decide yourself.");
        } else {
          // Format answers as "Question: Answer"
          for (const [key, value] of Object.entries(userResponse.answers)) {
            // Skip custom fields processing directly, handle them with main fields
            if (key.endsWith("_custom")) continue;

            const q = response.questions.find((q) => q.id === key);
            const qText = q ? q.text : key;

            let finalValue = value;
            if (value === "custom") {
              finalValue =
                userResponse.answers[`${key}_custom`] ||
                "User selected custom but provided no input";
            }

            currentInfo.push(`Q: ${qText}\nA: ${finalValue}`);
          }
        }
        // Loop continues to re-analyze
        // NOTE: We do NOT return here, we let the loop continue with increased iteration count
        // to re-run agent with new info.
        // We update state.iterationCount at the end or when yielding.
        continue;
      } else {
        // First time hitting this interrupt - set pendingClarification and return
        return {
          pendingClarification: request,
          collectedInfo: currentInfo,
          currentNode: "architect",
          iterationCount: iteration, // Save progress
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

        // Extract edited fields
        const editedTitle = userResponse.answers.title as string;
        const editedSynopsis = userResponse.answers.synopsis as string;
        const editedTone = userResponse.answers.tone as string;
        const editedThemes = userResponse.answers.themes as string;

        if (action === "approve") {
          // Update skeleton with user edits
          const finalSkeleton = {
            ...response.skeleton,
            title: editedTitle || response.skeleton.title,
            synopsis: editedSynopsis || response.skeleton.synopsis,
            tone: editedTone || response.skeleton.tone,
            key_themes: editedThemes
              ? editedThemes.split(",").map((t) => t.trim())
              : response.skeleton.key_themes,
          };

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
              finalSkeleton.title
            }\nSynopsis: ${finalSkeleton.synopsis}\nTone: ${
              finalSkeleton.tone
            }\nThemes: ${finalSkeleton.key_themes.join(", ")}`
          );

          return {
            skeleton: finalSkeleton,
            config: finalConfig,
            collectedInfo: currentInfo,
            currentNode: "architect",
            pendingClarification: null,
            iterationCount: iteration,
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
          iterationCount: iteration,
        };
      }
    }

    // Fallback if something weird happens (e.g. is_ready but no skeleton)
    currentInfo.push("Error: Agent returned ready but no skeleton. Retrying.");
  }

  // If we exceeded max iterations, we should probably just finish with what we have or error.
  // Ideally, we might want to return a default skeleton or error out.
  // For now, let's error as before.
  throw new Error("Architect loop exceeded max iterations");
}
