import { createStore, createEvent, createEffect, sample } from 'effector';
import { AppSettings, DEFAULT_SETTINGS } from '../../../shared/types/settings';
import { httpClient } from '@utils/api';

// Эффекты для работы с API
export const loadSettingsFx = createEffect(async (): Promise<AppSettings> => {
	return await httpClient.get<AppSettings>('/api-settings');
});

export const saveSettingsFx = createEffect(async (settings: AppSettings): Promise<AppSettings> => {
	return await httpClient.post<AppSettings, AppSettings>('/api-settings', settings);
});

// События для управления настройками
export const updateApiToken = createEvent<string>();
export const updateApiModel = createEvent<string>();
export const toggleRagEnabled = createEvent<boolean>();
export const updateRagModel = createEvent<string>();
export const toggleEmbeddingEnabled = createEvent<boolean>();
export const updateEmbeddingModel = createEvent<string>();
export const toggleResponseGenerationEnabled = createEvent<boolean>();
export const updateResponseGenerationModel = createEvent<string>();
export const resetSettings = createEvent();

// События для модального окна
export const openSettingsModal = createEvent();
export const closeSettingsModal = createEvent();
export const saveSettings = createEvent();

// Стор для настроек
export const $settings = createStore<AppSettings>(DEFAULT_SETTINGS)
	// Загрузка настроек с сервера
	.on(loadSettingsFx.doneData, (_, settings) => settings)
	// Обновление локальных настроек
	.on(updateApiToken, (state, token) => ({
		...state,
		api: { ...state.api, token },
	}))
	.on(updateApiModel, (state, model) => ({
		...state,
		api: { ...state.api, model },
	}))
	.on(toggleRagEnabled, (state, enabled) => ({
		...state,
		rag: { ...state.rag, enabled },
	}))
	.on(updateRagModel, (state, model) => ({
		...state,
		rag: { ...state.rag, model },
	}))
	.on(toggleEmbeddingEnabled, (state, enabled) => ({
		...state,
		embedding: { ...state.embedding, enabled },
	}))
	.on(updateEmbeddingModel, (state, model) => ({
		...state,
		embedding: { ...state.embedding, model },
	}))
	.on(toggleResponseGenerationEnabled, (state, enabled) => ({
		...state,
		responseGeneration: { ...state.responseGeneration, enabled },
	}))
	.on(updateResponseGenerationModel, (state, model) => ({
		...state,
		responseGeneration: { ...state.responseGeneration, model },
	}))
	.on(resetSettings, () => DEFAULT_SETTINGS);

// Стор для состояния модального окна
export const $isSettingsModalOpen = createStore<boolean>(false)
	.on(openSettingsModal, () => true)
	.on([closeSettingsModal, saveSettings], () => false);

sample({
	clock: saveSettings,
	source: $settings,
	fn: (settings) => settings,
	target: saveSettingsFx,
});
