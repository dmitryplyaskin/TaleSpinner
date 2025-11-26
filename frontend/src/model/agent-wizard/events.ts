import { createEvent } from 'effector';
import type { WizardStep, WorldData, GenerationProgress, ClarificationRequest } from './types';

// === Навигация по шагам ===
export const nextStep = createEvent('nextStep');
export const prevStep = createEvent('prevStep');
export const goToStep = createEvent<WizardStep>('goToStep');

// === Данные wizard ===
// Выбор сеттинга
export const setSetting = createEvent<string>('setSetting');

// Ввод описания мира
export const setUserInput = createEvent<string>('setUserInput');

// Ответы на вопросы
export const setAnswer = createEvent<{ questionId: string; value: string }>('setAnswer');

// Редактирование данных мира
export const updateWorldData = createEvent<Partial<WorldData>>('updateWorldData');

// Установка данных мира напрямую (после генерации)
export const setWorldData = createEvent<WorldData>('setWorldData');

// === SSE Streaming ===
// Обновление прогресса генерации из SSE
export const updateProgress = createEvent<Partial<GenerationProgress>>('updateProgress');

// Установка HITL запроса
export const setClarificationRequest = createEvent<ClarificationRequest | null>('setClarificationRequest');

// === UI состояния ===
// Диалог выхода
export const openExitDialog = createEvent('openExitDialog');
export const closeExitDialog = createEvent('closeExitDialog');

// Сброс wizard
export const resetWizard = createEvent('resetWizard');

// Очистка ошибки
export const clearError = createEvent('clearError');

// Установка ошибки
export const setError = createEvent<string>('setError');
