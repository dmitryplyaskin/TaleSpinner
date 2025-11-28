/**
 * Settings Feature - Сторы
 */

import { createStore } from 'effector';
import type { AppSettings, OpenRouterModel } from './types';
import { DEFAULT_SETTINGS } from './types';

/** Текущие настройки приложения */
export const $settings = createStore<AppSettings>(DEFAULT_SETTINGS);

/** Список доступных моделей OpenRouter */
export const $models = createStore<OpenRouterModel[]>([]);

/** Флаг загрузки моделей */
export const $modelsLoading = createStore<boolean>(false);

/** Ошибка загрузки моделей */
export const $modelsError = createStore<string | null>(null);

/** Флаг открытия панели настроек */
export const $isSettingsOpen = createStore<boolean>(false);

/** Флаг выполнения операций с токенами */
export const $tokenOperationPending = createStore<boolean>(false);




