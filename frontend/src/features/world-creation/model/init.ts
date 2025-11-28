/**
 * Инициализация связей между событиями и эффектами (sample)
 */
import { sample } from 'effector';
import { goToWelcome } from '../../../model/app-navigation';

import {
	startSessionFx,
	analyzeInputFx,
	submitAnswersFx,
	generateWorldFx,
	saveWorldFx,
	continueGenerationFx,
	startGenerationFx,
} from './effects';

import { goToStep } from './events';

// === Связи между событиями и эффектами ===

// После успешного старта сессии -> переход к вводу описания
sample({
	clock: startSessionFx.done,
	fn: () => 'input' as const,
	target: goToStep,
});

// После анализа: запускаем генерацию графа (который вызовет Architect)
sample({
	clock: analyzeInputFx.doneData,
	source: analyzeInputFx.done,
	fn: ({ params }) => params.sessionId,
	target: startGenerationFx,
});

// После старта генерации: проверяем статус
sample({
	clock: startGenerationFx.doneData,
	filter: (data) => data.status === 'waiting_for_input' && data.clarification !== undefined,
	fn: () => 'questions' as const,
	target: goToStep,
});

// Если сразу completed (что маловероятно)
sample({
	clock: startGenerationFx.doneData,
	filter: (data) => data.status === 'completed' && data.world !== undefined,
	fn: () => 'review' as const,
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

// После продолжения генерации: проверяем статус
sample({
	clock: continueGenerationFx.doneData,
	filter: (data) => data.status === 'waiting_for_input' && data.clarification !== undefined,
	// Если нужны еще уточнения, остаемся на шаге questions
	// (clarificationRequest обновится автоматически через стор)
	fn: () => 'questions' as const,
	target: goToStep,
});

// Если генерация завершена и есть world, переходим к review
sample({
	clock: continueGenerationFx.doneData,
	filter: (data) => data.status === 'completed' && data.world !== undefined,
	fn: () => 'review' as const,
	target: goToStep,
});




