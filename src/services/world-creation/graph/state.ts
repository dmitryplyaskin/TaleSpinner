import { Annotation } from "@langchain/langgraph";
import type {
  BaseWorldData,
  Faction,
  Location,
  Race,
  TimelineEvent,
  MagicSystem,
} from "src/schemas/world";
import type { LLMOutputLanguage } from "@shared/types/settings";
import type {
  ClarificationRequest,
  ClarificationResponse,
} from "@shared/types/human-in-the-loop";

// Типы для review
export interface ReviewIssue {
  category:
    | "factions"
    | "locations"
    | "races"
    | "history"
    | "magic"
    | "general";
  description: string;
  severity: "critical" | "warning";
}

// Reducer для массивов (append)
const appendReducer = <T>(current: T[], update: T[]): T[] => [...current, ...update];

// Reducer для замены значения (last value wins)
const replaceReducer = <T>(current: T, update: T): T => update ?? current;

// Определение State через Annotation
export const WorldGenerationState = Annotation.Root({
  // === Входные данные ===
  sessionId: Annotation<string>(),
  setting: Annotation<string>(),
  collectedInfo: Annotation<string[], string[]>({
    value: appendReducer,
    default: () => [],
  }),
  outputLanguage: Annotation<LLMOutputLanguage, LLMOutputLanguage>({
    value: replaceReducer,
    default: () => "ru" as LLMOutputLanguage,
  }),

  // === Результаты генерации ===
  base: Annotation<BaseWorldData | null, BaseWorldData | null>({
    value: replaceReducer,
    default: () => null,
  }),
  factions: Annotation<Faction[] | null, Faction[] | null>({
    value: replaceReducer,
    default: () => null,
  }),
  locations: Annotation<Location[] | null, Location[] | null>({
    value: replaceReducer,
    default: () => null,
  }),
  races: Annotation<Race[] | null, Race[] | null>({
    value: replaceReducer,
    default: () => null,
  }),
  history: Annotation<TimelineEvent[] | null, TimelineEvent[] | null>({
    value: replaceReducer,
    default: () => null,
  }),
  magic: Annotation<MagicSystem | null, MagicSystem | null>({
    value: replaceReducer,
    default: () => null,
  }),

  // === Review & Refinement ===
  reviewIssues: Annotation<ReviewIssue[], ReviewIssue[]>({
    value: replaceReducer,
    default: () => [],
  }),
  isConsistent: Annotation<boolean, boolean>({
    value: replaceReducer,
    default: () => false,
  }),
  iterationCount: Annotation<number, number>({
    value: replaceReducer,
    default: () => 0,
  }),

  // === Human-in-the-Loop ===
  pendingClarification: Annotation<ClarificationRequest | null, ClarificationRequest | null>({
    value: replaceReducer,
    default: () => null,
  }),
  clarificationHistory: Annotation<ClarificationResponse[], ClarificationResponse[]>({
    value: appendReducer,
    default: () => [],
  }),

  // === Progress tracking ===
  currentNode: Annotation<string, string>({
    value: replaceReducer,
    default: () => "",
  }),
  errors: Annotation<string[], string[]>({
    value: appendReducer,
    default: () => [],
  }),
});

export type WorldGenerationStateType = typeof WorldGenerationState.State;
