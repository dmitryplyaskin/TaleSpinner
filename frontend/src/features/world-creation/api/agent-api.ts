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
} from '../model/types';

/**
 * Запуск сессии создания мира
 */
export const startSession = async (params: StartSessionParams): Promise<StartSessionResponse> => {
	return httpClient.post<StartSessionResponse>('/api/world-creation/agent/start', params);
};

/**
 * Анализ ввода пользователя
 */
export const analyzeInput = async (params: AnalyzeInputParams): Promise<AgentAnalysis> => {
	return httpClient.post<AgentAnalysis>('/api/world-creation/agent/analyze', params);
};

/**
 * Отправка ответов на вопросы
 */
export const submitAnswers = async (params: SubmitAnswersParams): Promise<SubmitAnswersResponse> => {
	return httpClient.post<SubmitAnswersResponse>('/api/world-creation/agent/submit-answers', params);
};

/**
 * Генерация мира
 */
export const generateWorld = async (params: GenerateWorldParams): Promise<WorldData> => {
	return httpClient.post<WorldData>('/api/world-creation/agent/generate', params);
};

/**
 * Сохранение мира
 */
export const saveWorld = async (params: SaveWorldParams): Promise<void> => {
	await httpClient.post('/api/world-creation/agent/save', params);
};

/**
 * Получение прогресса генерации (для fallback polling)
 */
export const fetchProgress = async (sessionId: string): Promise<GenerationProgress> => {
	return httpClient.get<GenerationProgress>(`/api/world-creation/agent/progress?sessionId=${sessionId}`);
};

/**
 * Продолжение генерации после HITL уточнения
 */
export const continueGeneration = async (params: ContinueGenerationParams): Promise<ContinueGenerationResponse> => {
	return httpClient.post<ContinueGenerationResponse>(
		`/api/world-creation/agent/generate/${params.sessionId}/continue`,
		{ response: params.response }
	);
};

/**
 * Получить URL для SSE стрима генерации
 */
export const getGenerationStreamUrl = (sessionId: string): string => {
	return `/api/world-creation/agent/generate/${sessionId}/stream`;
};



