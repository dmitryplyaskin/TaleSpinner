/**
 * Settings Feature - Эффекты
 */

import { createEffect } from 'effector';
import { httpClient } from '@utils/api';
import type {
	AppSettings,
	ApiToken,
	CreateTokenRequest,
	UpdateTokenRequest,
	OpenRouterModelsResponse,
} from './types';

/** Загрузка настроек с сервера */
export const loadSettingsFx = createEffect(async (): Promise<AppSettings> => {
	return await httpClient.get<AppSettings>('/api/api-settings');
});

/** Сохранение настроек на сервер */
export const saveSettingsFx = createEffect(
	async (settings: { api: { model: string; providerOrder: string[] } } & Omit<AppSettings, 'api'>): Promise<AppSettings> => {
		return await httpClient.post<AppSettings, typeof settings>('/api/api-settings', settings);
	}
);

/** Добавление нового токена */
export const addTokenFx = createEffect(async (request: CreateTokenRequest): Promise<ApiToken> => {
	return await httpClient.post<ApiToken, CreateTokenRequest>('/api/api-settings/tokens', request);
});

/** Обновление токена */
export const updateTokenFx = createEffect(
	async ({ tokenId, request }: { tokenId: string; request: UpdateTokenRequest }): Promise<ApiToken> => {
		return await httpClient.put<ApiToken, UpdateTokenRequest>(`/api/api-settings/tokens/${tokenId}`, request);
	}
);

/** Удаление токена */
export const deleteTokenFx = createEffect(async (tokenId: string): Promise<{ success: boolean }> => {
	return await httpClient.delete<{ success: boolean }>(`/api/api-settings/tokens/${tokenId}`);
});

/** Активация токена */
export const activateTokenFx = createEffect(async (tokenId: string): Promise<ApiToken> => {
	return await httpClient.put<ApiToken>(`/api/api-settings/tokens/${tokenId}/activate`);
});

/** Загрузка списка моделей OpenRouter */
export const loadModelsFx = createEffect(async (): Promise<OpenRouterModelsResponse> => {
	return await httpClient.get<OpenRouterModelsResponse>('/api/openrouter/models');
});

