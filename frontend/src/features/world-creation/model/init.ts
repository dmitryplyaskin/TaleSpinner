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
} from './effects';

import { goToStep } from './events';
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



