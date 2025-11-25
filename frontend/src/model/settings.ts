import { createStore, createEvent, createEffect } from 'effector';
import {
	AppSettings,
	DEFAULT_SETTINGS,
	ApiToken,
	CreateTokenRequest,
	UpdateTokenRequest,
	OpenRouterModelsResponse,
	OpenRouterModel,
} from '../../../shared/types/settings';
import { httpClient } from '@utils/api';

// === Эффекты для работы с настройками ===
export const loadSettingsFx = createEffect(async (): Promise<AppSettings> => {
	return await httpClient.get<AppSettings>('/api/api-settings');
});

export const saveSettingsFx = createEffect(
	async (settings: { api: { model: string; providerOrder: string[] } } & Omit<AppSettings, 'api'>): Promise<AppSettings> => {
		return await httpClient.post<AppSettings, typeof settings>('/api/api-settings', settings);
	}
);

// === Эффекты для работы с токенами ===
export const addTokenFx = createEffect(async (request: CreateTokenRequest): Promise<ApiToken> => {
	return await httpClient.post<ApiToken, CreateTokenRequest>('/api/api-settings/tokens', request);
});

export const updateTokenFx = createEffect(
	async ({ tokenId, request }: { tokenId: string; request: UpdateTokenRequest }): Promise<ApiToken> => {
		return await httpClient.put<ApiToken, UpdateTokenRequest>(`/api/api-settings/tokens/${tokenId}`, request);
	}
);

export const deleteTokenFx = createEffect(async (tokenId: string): Promise<{ success: boolean }> => {
	return await httpClient.delete<{ success: boolean }>(`/api/api-settings/tokens/${tokenId}`);
});

export const activateTokenFx = createEffect(async (tokenId: string): Promise<ApiToken> => {
	return await httpClient.put<ApiToken>(`/api/api-settings/tokens/${tokenId}/activate`);
});

// === Эффекты для работы с моделями OpenRouter ===
export const loadModelsFx = createEffect(async (): Promise<OpenRouterModelsResponse> => {
	return await httpClient.get<OpenRouterModelsResponse>('/api/openrouter/models');
});

// === События ===
export const resetSettings = createEvent();
export const openSettingsModal = createEvent();
export const closeSettingsModal = createEvent();

// === Сторы ===

// Стор для настроек
export const $settings = createStore<AppSettings>(DEFAULT_SETTINGS)
	.on(loadSettingsFx.doneData, (_, settings) => settings)
	.on(saveSettingsFx.doneData, (_, settings) => settings)
	.on(resetSettings, () => DEFAULT_SETTINGS)
	// Обновление токенов
	.on(addTokenFx.doneData, (state, newToken) => ({
		...state,
		api: {
			...state.api,
			tokens: [...state.api.tokens, newToken],
			activeTokenId: state.api.tokens.length === 0 ? newToken.id : state.api.activeTokenId,
		},
	}))
	.on(updateTokenFx.doneData, (state, updatedToken) => ({
		...state,
		api: {
			...state.api,
			tokens: state.api.tokens.map((t) => (t.id === updatedToken.id ? updatedToken : t)),
		},
	}))
	.on(deleteTokenFx.done, (state, { params: tokenId }) => {
		const newTokens = state.api.tokens.filter((t) => t.id !== tokenId);
		const wasActive = state.api.activeTokenId === tokenId;
		return {
			...state,
			api: {
				...state.api,
				tokens: newTokens,
				activeTokenId: wasActive ? (newTokens[0]?.id || null) : state.api.activeTokenId,
			},
		};
	})
	.on(activateTokenFx.doneData, (state, activatedToken) => ({
		...state,
		api: {
			...state.api,
			tokens: state.api.tokens.map((t) => ({
				...t,
				isActive: t.id === activatedToken.id,
			})),
			activeTokenId: activatedToken.id,
		},
	}));

// Стор для моделей OpenRouter
export const $models = createStore<OpenRouterModel[]>([]).on(loadModelsFx.doneData, (_, response) => response.data);

// Стор для состояния загрузки моделей
export const $modelsLoading = createStore<boolean>(false)
	.on(loadModelsFx.pending, (_, pending) => pending);

// Стор для ошибок загрузки моделей
export const $modelsError = createStore<string | null>(null)
	.on(loadModelsFx.doneData, () => null)
	.on(loadModelsFx.failData, (_, error) => error.message);

// Стор для состояния модального окна
export const $isSettingsModalOpen = createStore<boolean>(false)
	.on(openSettingsModal, () => true)
	.on([closeSettingsModal, saveSettingsFx.done], () => false);

// Стор для состояния операций с токенами
export const $tokenOperationPending = createStore<boolean>(false)
	.on(addTokenFx.pending, (_, pending) => pending)
	.on(updateTokenFx.pending, (_, pending) => pending)
	.on(deleteTokenFx.pending, (_, pending) => pending)
	.on(activateTokenFx.pending, (_, pending) => pending);
