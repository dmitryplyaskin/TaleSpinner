import { sample } from "effector";
import {
  goToStep,
  selectGenre,
  setArchitectClarification,
  setSkeleton,
  setElementsClarification,
  setGeneratedWorld,
  setGenerationProgress,
  clearAnswers,
} from "./events";
import {
  $sessionId,
  $genre,
  $userInput,
  $skeleton,
  $answers,
  $architectClarification,
} from "./stores";
import {
  createSessionFx,
  startGenerationFx,
  respondToClarificationFx,
  approveSkeletonFx,
} from "./effects";

// ============ Шаг 1 -> 2: После выбора жанра создаём сессию ============

sample({
  clock: selectGenre,
  target: createSessionFx,
});

// После создания сессии переходим на шаг ввода
sample({
  clock: createSessionFx.doneData,
  fn: () => "input" as const,
  target: goToStep,
});

// ============ Шаг 2 -> 3: После ввода начинаем генерацию ============

// Это вызывается из компонента InputStep через startGenerationFx

// После начала генерации обрабатываем результат
sample({
  clock: startGenerationFx.doneData,
  filter: (result) => result.clarification !== undefined,
  fn: (result) => result.clarification!,
  target: setArchitectClarification,
});

sample({
  clock: startGenerationFx.doneData,
  filter: (result) => result.clarification !== undefined,
  fn: () => "architect" as const,
  target: goToStep,
});

sample({
  clock: startGenerationFx.doneData,
  filter: (result) => result.skeleton !== undefined && !result.clarification,
  fn: (result) => result.skeleton!,
  target: setSkeleton,
});

sample({
  clock: startGenerationFx.doneData,
  filter: (result) => result.skeleton !== undefined && !result.clarification,
  fn: () => "skeleton_review" as const,
  target: goToStep,
});

// ============ Шаг 3: Обработка ответов на вопросы ============

// После ответа на вопросы - очищаем ответы и обрабатываем результат
sample({
  clock: respondToClarificationFx.doneData,
  target: clearAnswers,
});

// Если пришёл новый clarification от архитектора
sample({
  clock: respondToClarificationFx.doneData,
  filter: (result) => result.clarification?.type === "architect_clarification",
  fn: (result) => result.clarification as typeof result.clarification & { type: "architect_clarification" },
  target: setArchitectClarification,
});

// Если пришёл скелет - переходим к просмотру
sample({
  clock: respondToClarificationFx.doneData,
  filter: (result) => result.skeleton !== undefined && !result.clarification,
  fn: (result) => result.skeleton!,
  target: setSkeleton,
});

sample({
  clock: respondToClarificationFx.doneData,
  filter: (result) => result.skeleton !== undefined && !result.clarification,
  fn: () => "skeleton_review" as const,
  target: goToStep,
});

// Если пришёл clarification от элементов
sample({
  clock: respondToClarificationFx.doneData,
  filter: (result) => result.clarification?.type === "elements_clarification",
  fn: (result) => result.clarification as typeof result.clarification & { type: "elements_clarification" },
  target: setElementsClarification,
});

// Если пришёл прогресс генерации
sample({
  clock: respondToClarificationFx.doneData,
  filter: (result) => result.progress !== undefined,
  fn: (result) => result.progress!,
  target: setGenerationProgress,
});

// Если генерация завершена
sample({
  clock: respondToClarificationFx.doneData,
  filter: (result) => result.world !== undefined,
  fn: (result) => result.world!,
  target: setGeneratedWorld,
});

sample({
  clock: respondToClarificationFx.doneData,
  filter: (result) => result.world !== undefined,
  fn: () => "review" as const,
  target: goToStep,
});

// ============ Шаг 3.5 -> 4: После одобрения скелета ============

sample({
  clock: approveSkeletonFx.doneData,
  fn: (result) => result.progress,
  target: setGenerationProgress,
});

sample({
  clock: approveSkeletonFx.doneData,
  fn: () => "generation" as const,
  target: goToStep,
});

