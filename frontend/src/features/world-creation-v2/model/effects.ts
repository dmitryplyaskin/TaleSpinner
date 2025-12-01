import { createEffect } from "effector";
import {
  createSession as apiCreateSession,
  startGeneration as apiStartGeneration,
  respondToClarification as apiRespondToClarification,
  approveSkeleton as apiApproveSkeleton,
  saveWorld as apiSaveWorld,
  getSessionStatus as apiGetSessionStatus,
  getGenres as apiGetGenres,
  type CreateSessionResponse,
  type StartGenerationResponse,
  type RespondToClarificationResponse,
  type ApproveSkeletonResponse,
  type SaveWorldResponse,
  type GetSessionStatusResponse,
  type GetGenresResponse,
} from "../api";

import type { Genre, WorldSkeleton, GeneratedWorld } from "./types";

// ============ Effects ============

/**
 * Получить список жанров
 */
export const fetchGenresFx = createEffect<void, GetGenresResponse>(async () => {
  return apiGetGenres();
});

/**
 * Создать сессию
 */
export const createSessionFx = createEffect<Genre, CreateSessionResponse>(
  async (genre) => {
    return apiCreateSession(genre);
  }
);

/**
 * Начать генерацию
 */
export const startGenerationFx = createEffect<
  { sessionId: string; userInput: string },
  StartGenerationResponse
>(async ({ sessionId, userInput }) => {
  return apiStartGeneration(sessionId, userInput);
});

/**
 * Ответить на уточнение
 */
export const respondToClarificationFx = createEffect<
  {
    sessionId: string;
    requestId: string;
    answers: Record<string, string>;
    skipped?: boolean;
  },
  RespondToClarificationResponse
>(async ({ sessionId, requestId, answers, skipped = false }) => {
  return apiRespondToClarification(sessionId, requestId, answers, skipped);
});

/**
 * Одобрить скелет
 */
export const approveSkeletonFx = createEffect<
  { sessionId: string; editedSkeleton?: WorldSkeleton },
  ApproveSkeletonResponse
>(async ({ sessionId, editedSkeleton }) => {
  return apiApproveSkeleton(sessionId, editedSkeleton);
});

/**
 * Сохранить мир
 */
export const saveWorldFx = createEffect<
  { sessionId: string; editedWorld?: GeneratedWorld },
  SaveWorldResponse
>(async ({ sessionId, editedWorld }) => {
  return apiSaveWorld(sessionId, editedWorld);
});

/**
 * Получить статус сессии
 */
export const getSessionStatusFx = createEffect<string, GetSessionStatusResponse>(
  async (sessionId) => {
    return apiGetSessionStatus(sessionId);
  }
);

