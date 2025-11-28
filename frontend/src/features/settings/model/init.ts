/**
 * Settings Feature - Инициализация связей
 */

import { sample } from 'effector';
import {
	$settings,
	$models,
	$modelsLoading,
	$modelsError,
	$isSettingsOpen,
	$tokenOperationPending,
} from './stores';
import { openSettings, closeSettings, resetSettings } from './events';
import {
	loadSettingsFx,
	saveSettingsFx,
	addTokenFx,
	updateTokenFx,
	deleteTokenFx,
	activateTokenFx,
	loadModelsFx,
} from './effects';
import { DEFAULT_SETTINGS } from './types';

// === Настройки ===

$settings
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
				activeTokenId: wasActive ? newTokens[0]?.id || null : state.api.activeTokenId,
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

// === Модели ===

$models.on(loadModelsFx.doneData, (_, response) => response.data);

$modelsLoading.on(loadModelsFx.pending, (_, pending) => pending);

$modelsError
	.on(loadModelsFx.doneData, () => null)
	.on(loadModelsFx.failData, (_, error) => error.message);

// === UI состояние ===

$isSettingsOpen
	.on(openSettings, () => true)
	.on(closeSettings, () => false)
	.on(saveSettingsFx.done, () => false);

// === Операции с токенами ===

$tokenOperationPending
	.on(addTokenFx.pending, (_, pending) => pending)
	.on(updateTokenFx.pending, (_, pending) => pending)
	.on(deleteTokenFx.pending, (_, pending) => pending)
	.on(activateTokenFx.pending, (_, pending) => pending);



