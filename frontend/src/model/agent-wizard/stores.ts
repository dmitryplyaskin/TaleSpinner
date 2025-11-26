import { createStore, combine } from 'effector';
import type {
	WizardStep,
	AgentAnalysis,
	AgentQuestion,
	GenerationProgress,
	ClarificationRequest,
	WorldData,
} from './types';

import {
	goToStep,
	setSetting,
	setUserInput,
	setAnswer,
	updateWorldData,
	setWorldData,
	updateProgress,
	setClarificationRequest,
	openExitDialog,
	closeExitDialog,
	resetWizard,
	clearError,
	setError,
} from './events';

import {
	startSessionFx,
	analyzeInputFx,
	submitAnswersFx,
	generateWorldFx,
	saveWorldFx,
	fetchProgressFx,
	continueGenerationFx,
} from './effects';

// === Основные сторы ===

// Текущий шаг wizard
export const $step = createStore<WizardStep>('setting')
	.on(goToStep, (_, step) => step)
	.reset(resetWizard);

// ID сессии
export const $sessionId = createStore<string | null>(null)
	.on(startSessionFx.doneData, (_, { sessionId }) => sessionId)
	.reset(resetWizard);

// Выбранный сеттинг
export const $setting = createStore<string>('fantasy')
	.on(setSetting, (_, setting) => setting)
	.reset(resetWizard);

// Ввод пользователя (описание мира)
export const $userInput = createStore<string>('')
	.on(setUserInput, (_, input) => input)
	.reset(resetWizard);

// Результат анализа
export const $analysis = createStore<AgentAnalysis | null>(null)
	.on(analyzeInputFx.doneData, (_, data) => data)
	.reset(resetWizard);

// Derived стор - вопросы из анализа
export const $questions = $analysis.map<AgentQuestion[]>((analysis) => analysis?.questions ?? []);

// Ответы на вопросы
export const $answers = createStore<Record<string, string>>({})
	.on(setAnswer, (state, { questionId, value }) => ({
		...state,
		[questionId]: value,
	}))
	.reset(resetWizard);

// Прогресс генерации
const initialProgress: GenerationProgress = {
	base: 'pending',
	factions: 'pending',
	locations: 'pending',
	races: 'pending',
	history: 'pending',
	magic: 'pending',
};

export const $generationProgress = createStore<GenerationProgress>(initialProgress)
	.on(fetchProgressFx.doneData, (_, progress) => progress)
	.on(updateProgress, (state, partial) => ({ ...state, ...partial }))
	.reset(resetWizard);

// HITL запрос на уточнение
export const $clarificationRequest = createStore<ClarificationRequest | null>(null)
	.on(setClarificationRequest, (_, request) => request)
	.on(continueGenerationFx.doneData, (_, data) => data.clarification ?? null)
	.reset(resetWizard);

// Сгенерированный мир
export const $worldData = createStore<WorldData | null>(null)
	.on(generateWorldFx.doneData, (_, data) => data)
	.on(setWorldData, (_, data) => data)
	.on(updateWorldData, (state, update) => (state ? { ...state, ...update } : null))
	.on(continueGenerationFx.doneData, (state, data) => data.world ?? state)
	.reset(resetWizard);

// === UI состояния ===

// Ошибка
export const $error = createStore<string | null>(null)
	.on(setError, (_, error) => error)
	.on(startSessionFx.failData, (_, error) => error.message)
	.on(analyzeInputFx.failData, (_, error) => error.message)
	.on(submitAnswersFx.failData, (_, error) => error.message)
	.on(generateWorldFx.failData, (_, error) => error.message)
	.on(saveWorldFx.failData, (_, error) => error.message)
	.on(continueGenerationFx.failData, (_, error) => error.message)
	.on(clearError, () => null)
	.reset([resetWizard, startSessionFx, analyzeInputFx, submitAnswersFx, generateWorldFx]);

// Диалог выхода
export const $exitDialogOpen = createStore<boolean>(false)
	.on(openExitDialog, () => true)
	.on(closeExitDialog, () => false)
	.reset(resetWizard);

// === Комбинированные сторы загрузки ===

export const $isStartingSession = startSessionFx.pending;
export const $isAnalyzing = analyzeInputFx.pending;
export const $isSubmittingAnswers = submitAnswersFx.pending;
export const $isGenerating = generateWorldFx.pending;
export const $isSaving = saveWorldFx.pending;
export const $isContinuing = continueGenerationFx.pending;

// Общий стор загрузки
export const $isLoading = combine(
	startSessionFx.pending,
	analyzeInputFx.pending,
	submitAnswersFx.pending,
	generateWorldFx.pending,
	saveWorldFx.pending,
	continueGenerationFx.pending,
	(...pendings) => pendings.some(Boolean)
);

