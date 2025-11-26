import { sample } from 'effector';
import { goToWelcome } from '../app-navigation';

// Импорт эффектов
import {
	startSessionFx,
	analyzeInputFx,
	submitAnswersFx,
	generateWorldFx,
	saveWorldFx,
	continueGenerationFx,
} from './effects';

// Импорт событий
import { goToStep } from './events';

// Импорт сторов для использования в sample
import { $sessionId } from './stores';

// === Связи между событиями и эффектами ===

// После успешного старта сессии -> переход к вводу описания
sample({
	clock: startSessionFx.done,
	fn: () => 'input' as const,
	target: goToStep,
});

// После анализа: всегда показываем форму вопросов
// (даже если вопросов нет - пользователь может нажать "Сгенерировать")
sample({
	clock: analyzeInputFx.doneData,
	fn: () => 'questions' as const,
	target: goToStep,
});

// После отправки ответов -> переходим к генерации (SSE stream)
sample({
	clock: submitAnswersFx.done,
	fn: () => 'generating' as const,
	target: goToStep,
});

// После успешной генерации мира -> переход к review
sample({
	clock: generateWorldFx.done,
	fn: () => 'review' as const,
	target: goToStep,
});

// После успешного сохранения мира -> возврат на главную
sample({
	clock: saveWorldFx.done,
	target: goToWelcome,
});

// После продолжения генерации: если completed -> получаем мир
sample({
	clock: continueGenerationFx.doneData,
	source: $sessionId,
	filter: (sessionId, data) => data.status === 'completed' && sessionId !== null,
	fn: (sessionId) => ({ sessionId: sessionId! }),
	target: generateWorldFx,
});

// === Публичный API ===

// Экспорт типов
export * from './types';

// Экспорт эффектов
export {
	startSessionFx,
	analyzeInputFx,
	submitAnswersFx,
	generateWorldFx,
	saveWorldFx,
	fetchProgressFx,
	continueGenerationFx,
} from './effects';

// Экспорт событий
export {
	nextStep,
	prevStep,
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

// Экспорт сторов
export {
	$step,
	$sessionId,
	$setting,
	$userInput,
	$analysis,
	$questions,
	$answers,
	$generationProgress,
	$clarificationRequest,
	$worldData,
	$error,
	$exitDialogOpen,
	$isStartingSession,
	$isAnalyzing,
	$isSubmittingAnswers,
	$isGenerating,
	$isSaving,
	$isContinuing,
	$isLoading,
} from './stores';

