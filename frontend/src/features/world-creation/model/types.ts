/**
 * Типы для World Creation модели
 */

// Re-export типов из существующих модулей
export type {
	WorldData,
	AgentQuestion,
	AgentAnalysis,
	AgentStatus,
	GenerationProgress,
} from '../../../types/world-creation';

export type { ClarificationRequest, ClarificationResponse } from '@shared/types/human-in-the-loop';

/** Шаги wizard */
export type WizardStep = 'setting' | 'input' | 'questions' | 'generating' | 'review';

/** Параметры для старта сессии */
export interface StartSessionParams {
	setting: string;
}

/** Ответ при старте сессии */
export interface StartSessionResponse {
	sessionId: string;
}

/** Параметры для анализа ввода */
export interface AnalyzeInputParams {
	sessionId: string;
	userInput: string;
}

/** Параметры для отправки ответов */
export interface SubmitAnswersParams {
	sessionId: string;
	answers: Record<string, string>;
}

/** Ответ при отправке ответов */
export interface SubmitAnswersResponse {
	status?: string;
	name?: string;
	world_primer?: string;
}

/** Параметры для генерации мира */
export interface GenerateWorldParams {
	sessionId: string;
}

/** Параметры для сохранения мира */
export interface SaveWorldParams {
	sessionId: string;
	worldData: import('../../../types/world-creation').WorldData;
}

/** Параметры для продолжения генерации после HITL */
export interface ContinueGenerationParams {
	sessionId: string;
	response: import('@shared/types/human-in-the-loop').ClarificationResponse;
}

/** Ответ при продолжении генерации */
export interface ContinueGenerationResponse {
	status: string;
	clarification?: import('@shared/types/human-in-the-loop').ClarificationRequest;
	world?: import('../../../types/world-creation').WorldData;
	error?: string;
}

/** Типы для SSE событий */
export interface StreamEvent {
	type?: 'done' | 'error';
	node?: string;
	status?: 'started' | 'completed' | 'error' | 'waiting_for_input';
	data?: Partial<import('../../../types/world-creation').GenerationProgress>;
	clarification?: import('@shared/types/human-in-the-loop').ClarificationRequest;
	error?: string;
}




