/**
 * Shared types for WorldCreationV2
 * Используются на фронтенде и бэкенде
 */

// ============ Жанры ============

export type Genre =
  | "adventure"
  | "mystery"
  | "slice_of_life"
  | "horror"
  | "romance"
  | "drama"
  | "action"
  | "thriller"
  | "comedy"
  | "survival"
  | "political_intrigue"
  | "heist";

export interface GenreMetadataItem {
  label: string;
  description: string;
  icon: string;
}

// ============ Сессия ============

export type SessionStatus =
  | "genre_selected"
  | "input_provided"
  | "architect_working"
  | "architect_asking"
  | "skeleton_ready"
  | "skeleton_approved"
  | "elements_generating"
  | "elements_asking"
  | "completed"
  | "saved";

export interface Session {
  id: string;
  status: SessionStatus;
  genre: Genre;
  userInput: string;
  architectIterations: number;
  langgraphThreadId?: string;
  createdAt: string;
  updatedAt: string;
}

// ============ Архитектор ============

export interface ArchitectQuestionOption {
  id: string;
  label: string;
}

export interface ArchitectQuestion {
  id: string;
  question: string;
  options: ArchitectQuestionOption[];
  allowCustomAnswer: boolean;
}

export interface ArchitectClarification {
  type: "architect_clarification";
  reason: string;
  questions: ArchitectQuestion[];
  iteration: number;
}

export type WorldElementType =
  | "locations"
  | "factions"
  | "religions"
  | "races"
  | "magic_system"
  | "technology"
  | "history"
  | "economy"
  | "culture"
  | "creatures"
  | "notable_characters";

export interface WorldSkeleton {
  name: string;
  setting: string;
  era: string;
  tone: string;
  coreConflict: string;
  uniqueFeatures: string[];
  worldPrimer: string;
  elementsToGenerate: WorldElementType[];
}

// ============ Элементы мира ============

export interface WorldElementBase {
  id: string;
  name: string;
  description: string;
}

export interface DynamicWorldElement extends WorldElementBase {
  fields: Record<string, string | string[]>;
}

export interface WorldElementCategory {
  categoryId: string;
  categoryName: string;
  categoryDescription: string;
  elements: DynamicWorldElement[];
}

export interface GenerationMetadata {
  generatedAt: string;
  totalElements: number;
  generationTimeMs: number;
}

export interface GeneratedWorld {
  skeleton: WorldSkeleton;
  categories: WorldElementCategory[];
  metadata: GenerationMetadata;
}

// ============ Уточнения (HITL) ============

export interface ElementsClarificationRequest {
  type: "elements_clarification";
  elementType: string;
  reason: string;
  questions: ArchitectQuestion[];
}

export type AnyClarificationRequest =
  | ArchitectClarification
  | ElementsClarificationRequest;

export interface ClarificationResponse {
  requestId: string;
  skipped: boolean;
  answers: Record<string, string | string[]>;
}

// ============ Прогресс ============

export type GenerationStatus =
  | "idle"
  | "generating"
  | "waiting_for_input"
  | "completed"
  | "error";

export interface GenerationProgress {
  currentElement: string;
  completedElements: string[];
  totalElements: number;
  status: GenerationStatus;
  error?: string;
}

// ============ API Response types ============

export interface CreateSessionResponse {
  session: Session;
}

export interface StartGenerationResponse {
  status: SessionStatus;
  clarification?: ArchitectClarification;
  skeleton?: WorldSkeleton;
}

export interface RespondToClarificationResponse {
  status: SessionStatus;
  clarification?: AnyClarificationRequest;
  skeleton?: WorldSkeleton;
  world?: GeneratedWorld;
}

export interface ApproveSkeletonResponse {
  status: SessionStatus;
  progress: GenerationProgress;
}

export interface GetSessionStatusResponse {
  session: Session;
  skeleton?: WorldSkeleton;
  world?: GeneratedWorld;
  clarification?: AnyClarificationRequest;
  progress?: GenerationProgress;
}

export interface SaveWorldResponse {
  success: boolean;
  worldId: string;
}

