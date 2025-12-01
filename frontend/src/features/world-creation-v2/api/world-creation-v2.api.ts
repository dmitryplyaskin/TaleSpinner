import { apiRequest } from "../../../utils/api";
import type {
  Genre,
  Session,
  WorldSkeleton,
  GeneratedWorld,
  ArchitectClarification,
  ElementsClarificationRequest,
  GenerationProgress,
  GenreWithMetadata,
} from "../model/types";

const BASE_URL = "/api/v2/world-creation";

// ============ Response types ============

export interface GetGenresResponse {
  genres: GenreWithMetadata[];
}

export interface CreateSessionResponse {
  session: Session;
}

export interface StartGenerationResponse {
  status: string;
  clarification?: ArchitectClarification;
  skeleton?: WorldSkeleton;
}

export interface RespondToClarificationResponse {
  status: string;
  clarification?: ArchitectClarification | ElementsClarificationRequest;
  skeleton?: WorldSkeleton;
  world?: GeneratedWorld;
  progress?: GenerationProgress;
}

export interface ApproveSkeletonResponse {
  status: string;
  progress: GenerationProgress;
}

export interface GetSessionStatusResponse {
  session: Session;
  skeleton?: WorldSkeleton;
  world?: GeneratedWorld;
  clarification?: ArchitectClarification | ElementsClarificationRequest;
  progress?: GenerationProgress;
}

export interface SaveWorldResponse {
  success: boolean;
  worldId: string;
}

// ============ API functions ============

/**
 * Получить список жанров
 */
export async function getGenres(): Promise<GetGenresResponse> {
  return apiRequest<GetGenresResponse>(`${BASE_URL}/genres`);
}

/**
 * Создать новую сессию
 */
export async function createSession(genre: Genre): Promise<CreateSessionResponse> {
  return apiRequest<CreateSessionResponse>(`${BASE_URL}/session`, {
    method: "POST",
    body: JSON.stringify({ genre }),
  });
}

/**
 * Начать генерацию
 */
export async function startGeneration(
  sessionId: string,
  userInput: string
): Promise<StartGenerationResponse> {
  return apiRequest<StartGenerationResponse>(`${BASE_URL}/${sessionId}/start`, {
    method: "POST",
    body: JSON.stringify({ userInput }),
  });
}

/**
 * Ответить на уточняющие вопросы
 */
export async function respondToClarification(
  sessionId: string,
  requestId: string,
  answers: Record<string, string>,
  skipped = false
): Promise<RespondToClarificationResponse> {
  return apiRequest<RespondToClarificationResponse>(
    `${BASE_URL}/${sessionId}/respond`,
    {
      method: "POST",
      body: JSON.stringify({ requestId, answers, skipped }),
    }
  );
}

/**
 * Одобрить скелет мира
 */
export async function approveSkeleton(
  sessionId: string,
  editedSkeleton?: WorldSkeleton
): Promise<ApproveSkeletonResponse> {
  return apiRequest<ApproveSkeletonResponse>(
    `${BASE_URL}/${sessionId}/approve-skeleton`,
    {
      method: "POST",
      body: JSON.stringify({ editedSkeleton }),
    }
  );
}

/**
 * Получить статус сессии
 */
export async function getSessionStatus(
  sessionId: string
): Promise<GetSessionStatusResponse> {
  return apiRequest<GetSessionStatusResponse>(`${BASE_URL}/${sessionId}/status`);
}

/**
 * Сохранить мир
 */
export async function saveWorld(
  sessionId: string,
  editedWorld?: GeneratedWorld
): Promise<SaveWorldResponse> {
  return apiRequest<SaveWorldResponse>(`${BASE_URL}/${sessionId}/save`, {
    method: "POST",
    body: JSON.stringify({ editedWorld }),
  });
}

