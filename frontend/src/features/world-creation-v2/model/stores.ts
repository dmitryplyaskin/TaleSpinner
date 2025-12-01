import { createStore, combine } from "effector";
import type {
  WizardStepV2,
  Genre,
  WorldSkeleton,
  GeneratedWorld,
  ArchitectClarification,
  ElementsClarificationRequest,
  GenerationProgress,
} from "./types";

import {
  goToStep,
  resetWizard,
  selectGenre,
  setUserInput,
  setArchitectClarification,
  setAnswer,
  clearAnswers,
  setSkeleton,
  updateSkeletonField,
  setElementsClarification,
  setGenerationProgress,
  setGeneratedWorld,
  updateWorldElement,
  setError,
  clearError,
  openExitDialog,
  closeExitDialog,
} from "./events";

import {
  createSessionFx,
  startGenerationFx,
  respondToClarificationFx,
  approveSkeletonFx,
  saveWorldFx,
} from "./effects";

// ============ Навигация ============

export const $step = createStore<WizardStepV2>("genre")
  .on(goToStep, (_, step) => step)
  .reset(resetWizard);

// ============ Сессия ============

export const $sessionId = createStore<string | null>(null)
  .on(createSessionFx.doneData, (_, { session }) => session.id)
  .reset(resetWizard);

// ============ Шаг 1: Жанр ============

export const $genre = createStore<Genre | null>(null)
  .on(selectGenre, (_, genre) => genre)
  .reset(resetWizard);

// ============ Шаг 2: Ввод ============

export const $userInput = createStore<string>("")
  .on(setUserInput, (_, input) => input)
  .reset(resetWizard);

// ============ Шаг 3: Архитектор ============

export const $architectClarification = createStore<ArchitectClarification | null>(null)
  .on(setArchitectClarification, (_, clarification) => clarification)
  .on(startGenerationFx.doneData, (_, result) => result.clarification ?? null)
  .on(respondToClarificationFx.doneData, (_, result) =>
    result.clarification?.type === "architect_clarification"
      ? result.clarification
      : null
  )
  .reset(resetWizard);

export const $answers = createStore<Record<string, string>>({})
  .on(setAnswer, (state, { questionId, value }) => ({
    ...state,
    [questionId]: value,
  }))
  .on(clearAnswers, () => ({}))
  .on(respondToClarificationFx.done, () => ({}))
  .reset(resetWizard);

export const $architectIteration = createStore<number>(0)
  .on(startGenerationFx.doneData, (_, result) =>
    result.clarification?.iteration ?? 0
  )
  .on(respondToClarificationFx.doneData, (_, result) =>
    result.clarification?.type === "architect_clarification"
      ? result.clarification.iteration
      : 0
  )
  .reset(resetWizard);

// ============ Шаг 3.5: Скелет ============

export const $skeleton = createStore<WorldSkeleton | null>(null)
  .on(setSkeleton, (_, skeleton) => skeleton)
  .on(startGenerationFx.doneData, (_, result) => result.skeleton ?? null)
  .on(respondToClarificationFx.doneData, (_, result) => result.skeleton ?? null)
  .on(updateSkeletonField, (state, { field, value }) =>
    state ? { ...state, [field]: value } : null
  )
  .reset(resetWizard);

// ============ Шаг 4: Генерация ============

export const $elementsClarification =
  createStore<ElementsClarificationRequest | null>(null)
    .on(setElementsClarification, (_, clarification) => clarification)
    .on(respondToClarificationFx.doneData, (_, result) =>
      result.clarification?.type === "elements_clarification"
        ? result.clarification
        : null
    )
    .reset(resetWizard);

const initialProgress: GenerationProgress = {
  currentElement: "",
  completedElements: [],
  totalElements: 0,
  status: "idle",
};

export const $generationProgress = createStore<GenerationProgress>(initialProgress)
  .on(setGenerationProgress, (_, progress) => progress)
  .on(respondToClarificationFx.doneData, (_, result) => result.progress ?? initialProgress)
  .on(approveSkeletonFx.doneData, (_, result) => result.progress)
  .reset(resetWizard);

// ============ Шаг 5: Результат ============

export const $generatedWorld = createStore<GeneratedWorld | null>(null)
  .on(setGeneratedWorld, (_, world) => world)
  .on(respondToClarificationFx.doneData, (_, result) => result.world ?? null)
  .on(updateWorldElement, (state, { categoryId, elementId, field, value }) => {
    if (!state) return null;

    const updatedCategories = state.categories.map((category) => {
      if (category.categoryId !== categoryId) return category;

      const updatedElements = category.elements.map((element) => {
        if (element.id !== elementId) return element;

        if (field === "name" || field === "description") {
          return { ...element, [field]: value };
        }

        return {
          ...element,
          fields: { ...element.fields, [field]: value },
        };
      });

      return { ...category, elements: updatedElements };
    });

    return { ...state, categories: updatedCategories };
  })
  .reset(resetWizard);

// ============ UI состояния ============

export const $error = createStore<string | null>(null)
  .on(setError, (_, error) => error)
  .on(clearError, () => null)
  .on(createSessionFx.failData, (_, error) => error.message)
  .on(startGenerationFx.failData, (_, error) => error.message)
  .on(respondToClarificationFx.failData, (_, error) => error.message)
  .on(approveSkeletonFx.failData, (_, error) => error.message)
  .on(saveWorldFx.failData, (_, error) => error.message)
  .reset([resetWizard, createSessionFx, startGenerationFx]);

export const $exitDialogOpen = createStore<boolean>(false)
  .on(openExitDialog, () => true)
  .on(closeExitDialog, () => false)
  .reset(resetWizard);

// ============ Загрузка ============

export const $isCreatingSession = createSessionFx.pending;
export const $isStartingGeneration = startGenerationFx.pending;
export const $isResponding = respondToClarificationFx.pending;
export const $isApprovingSkeleton = approveSkeletonFx.pending;
export const $isSaving = saveWorldFx.pending;

export const $isLoading = combine(
  createSessionFx.pending,
  startGenerationFx.pending,
  respondToClarificationFx.pending,
  approveSkeletonFx.pending,
  saveWorldFx.pending,
  (...pendings) => pendings.some(Boolean)
);

// ============ Derived stores ============

/** Текущие вопросы (от архитектора или элементов) */
export const $currentClarification = combine(
  $architectClarification,
  $elementsClarification,
  (architect, elements) => architect ?? elements
);

/** Есть ли активное уточнение */
export const $hasPendingClarification = $currentClarification.map(
  (clarification) => clarification !== null
);

