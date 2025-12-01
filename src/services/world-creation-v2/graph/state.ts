import { Annotation } from "@langchain/langgraph";
import type {
  Genre,
  WorldSkeleton,
  ArchitectClarification,
  WorldElementCategory,
  ClarificationHistoryItem,
  ElementsClarificationRequest,
} from "../schemas";

/**
 * Reducers для state
 */
const appendReducer = <T>(current: T[], update: T[]): T[] => [
  ...current,
  ...update,
];

const replaceReducer = <T>(current: T, update: T): T => update ?? current;

/**
 * State для WorldCreationV2 LangGraph
 */
export const WorldCreationV2State = Annotation.Root({
  // === Входные данные ===
  sessionId: Annotation<string>(),
  genre: Annotation<Genre>(),
  userInput: Annotation<string>(),

  // === Architect Phase ===
  skeleton: Annotation<WorldSkeleton | null, WorldSkeleton | null>({
    value: replaceReducer,
    default: () => null,
  }),
  architectIterations: Annotation<number, number>({
    value: replaceReducer,
    default: () => 0,
  }),
  skeletonApproved: Annotation<boolean, boolean>({
    value: replaceReducer,
    default: () => false,
  }),

  // === HITL - Clarifications ===
  pendingClarification: Annotation<
    ArchitectClarification | ElementsClarificationRequest | null,
    ArchitectClarification | ElementsClarificationRequest | null
  >({
    value: replaceReducer,
    default: () => null,
  }),
  clarificationHistory: Annotation<
    ClarificationHistoryItem[],
    ClarificationHistoryItem[]
  >({
    value: appendReducer,
    default: () => [],
  }),

  // === Elements Generation Phase ===
  generatedCategories: Annotation<
    WorldElementCategory[],
    WorldElementCategory[]
  >({
    value: appendReducer,
    default: () => [],
  }),
  currentElementType: Annotation<string, string>({
    value: replaceReducer,
    default: () => "",
  }),
  elementsToGenerate: Annotation<string[], string[]>({
    value: replaceReducer,
    default: () => [],
  }),

  // === Progress & Errors ===
  currentPhase: Annotation<string, string>({
    value: replaceReducer,
    default: () => "init",
  }),
  errors: Annotation<string[], string[]>({
    value: appendReducer,
    default: () => [],
  }),
});

export type WorldCreationV2StateType = typeof WorldCreationV2State.State;
