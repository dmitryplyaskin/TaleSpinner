import { createEvent } from "effector";
import type {
  WizardStepV2,
  Genre,
  WorldSkeleton,
  GeneratedWorld,
  ArchitectClarification,
  ElementsClarificationRequest,
  GenerationProgress,
} from "./types";

// ============ Навигация ============

/** Перейти к шагу */
export const goToStep = createEvent<WizardStepV2>();

/** Сбросить wizard */
export const resetWizard = createEvent();

// ============ Шаг 1: Жанр ============

/** Выбрать жанр */
export const selectGenre = createEvent<Genre>();

/** Подтвердить выбор жанра и создать сессию */
export const submitGenreStep = createEvent();

// ============ Шаг 2: Ввод ============

/** Обновить ввод пользователя */
export const setUserInput = createEvent<string>();

// ============ Шаг 3: Архитектор ============

/** Установить вопросы от архитектора */
export const setArchitectClarification = createEvent<ArchitectClarification | null>();

/** Обновить ответ на вопрос */
export const setAnswer = createEvent<{ questionId: string; value: string }>();

/** Очистить все ответы */
export const clearAnswers = createEvent();

// ============ Шаг 3.5: Скелет ============

/** Установить скелет */
export const setSkeleton = createEvent<WorldSkeleton>();

/** Обновить поле скелета */
export const updateSkeletonField = createEvent<{
  field: keyof WorldSkeleton;
  value: string | string[];
}>();

// ============ Шаг 4: Генерация ============

/** Установить вопросы при генерации элементов */
export const setElementsClarification = createEvent<ElementsClarificationRequest | null>();

/** Обновить прогресс генерации */
export const setGenerationProgress = createEvent<GenerationProgress>();

// ============ Шаг 5: Результат ============

/** Установить сгенерированный мир */
export const setGeneratedWorld = createEvent<GeneratedWorld>();

/** Обновить элемент мира */
export const updateWorldElement = createEvent<{
  categoryId: string;
  elementId: string;
  field: string;
  value: string | string[];
}>();

// ============ UI состояния ============

/** Установить ошибку */
export const setError = createEvent<string | null>();

/** Очистить ошибку */
export const clearError = createEvent();

/** Открыть диалог выхода */
export const openExitDialog = createEvent();

/** Закрыть диалог выхода */
export const closeExitDialog = createEvent();

