import { createEffect } from 'effector';
import {
	startSession,
	analyzeInput,
	submitAnswers,
	generateWorld,
	saveWorld,
	fetchProgress,
	continueGeneration,
} from '../api';
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

/** Старт сессии создания мира */
export const startSessionFx = createEffect<StartSessionParams, StartSessionResponse>({
	handler: startSession,
});

/** Анализ ввода пользователя */
export const analyzeInputFx = createEffect<AnalyzeInputParams, AgentAnalysis>({
	handler: analyzeInput,
});

/** Отправка ответов на вопросы */
export const submitAnswersFx = createEffect<SubmitAnswersParams, SubmitAnswersResponse>({
	handler: submitAnswers,
});

/** Генерация мира */
export const generateWorldFx = createEffect<GenerateWorldParams, WorldData>({
	handler: generateWorld,
});

/** Сохранение мира */
export const saveWorldFx = createEffect<SaveWorldParams, void>({
	handler: saveWorld,
});

/** Получение прогресса генерации (для fallback polling) */
export const fetchProgressFx = createEffect<string, GenerationProgress>({
	handler: fetchProgress,
});

/** Продолжение генерации после HITL уточнения */
export const continueGenerationFx = createEffect<ContinueGenerationParams, ContinueGenerationResponse>({
	handler: continueGeneration,
});



