import { createStore, createEvent } from 'effector';
import { AppSettings, DEFAULT_SETTINGS } from '../../../shared/types/settings';

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
