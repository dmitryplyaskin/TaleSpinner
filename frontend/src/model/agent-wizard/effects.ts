import { createEffect } from 'effector';
import { httpClient } from '@utils/api';
import type {
	StartSessionParams,
	StartSessionResponse,
	AnalyzeInputParams,
	GenerateWorldParams,
	SubmitAnswersParams,
	SubmitAnswersResponse,
	SaveWorldParams,
	ContinueGenerationParams,
	ContinueGenerationResponse,
	AgentAnalysis,
	WorldData,
	GenerationProgress,
} from './types';

// Старт сессии создания мира
export const startSessionFx = createEffect<StartSessionParams, StartSessionResponse>({
	handler: async (params) => {
		return httpClient.post<StartSessionResponse>('/api/world-creation/agent/start', params);
	},
});

// Анализ ввода пользователя
export const analyzeInputFx = createEffect<AnalyzeInputParams, AgentAnalysis>({
	handler: async (params) => {
		return httpClient.post<AgentAnalysis>('/api/world-creation/agent/analyze', params);
	},
});

// Отправка ответов на вопросы
export const submitAnswersFx = createEffect<SubmitAnswersParams, SubmitAnswersResponse>({
	handler: async (params) => {
		return httpClient.post<SubmitAnswersResponse>('/api/world-creation/agent/submit-answers', params);
	},
});

// Генерация мира
export const generateWorldFx = createEffect<GenerateWorldParams, WorldData>({
	handler: async (params) => {
		return httpClient.post<WorldData>('/api/world-creation/agent/generate', params);
	},
});

// Сохранение мира
export const saveWorldFx = createEffect<SaveWorldParams, void>({
	handler: async (params) => {
		await httpClient.post('/api/world-creation/agent/save', params);
	},
});

// Получение прогресса генерации (для fallback polling)
export const fetchProgressFx = createEffect<string, GenerationProgress>({
	handler: async (sessionId) => {
		return httpClient.get<GenerationProgress>(`/api/world-creation/agent/progress?sessionId=${sessionId}`);
	},
});

// Продолжение генерации после HITL уточнения
export const continueGenerationFx = createEffect<ContinueGenerationParams, ContinueGenerationResponse>({
	handler: async (params) => {
		return httpClient.post<ContinueGenerationResponse>(
			`/api/world-creation/agent/generate/${params.sessionId}/continue`,
			{ response: params.response }
		);
	},
});

