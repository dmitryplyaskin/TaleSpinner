import { createStore, createEvent, createEffect } from 'effector';
import { AppSettings, DEFAULT_SETTINGS } from '../../../shared/types/settings';
import { httpClient } from '@utils/api';

// Эффекты для работы с API
export const loadSettingsFx = createEffect(async (): Promise<AppSettings> => {
	return await httpClient.get<AppSettings>('/api/api-settings');
});

export const saveSettingsFx = createEffect(async (settings: AppSettings): Promise<AppSettings> => {
	return await httpClient.post<AppSettings, AppSettings>('/api/api-settings', settings);
});

// События для управления настройками
export const resetSettings = createEvent();

// События для модального окна
export const openSettingsModal = createEvent();
export const closeSettingsModal = createEvent();

// Стор для настроек
export const $settings = createStore<AppSettings>(DEFAULT_SETTINGS)
	// Загрузка настроек с сервера
	.on(loadSettingsFx.doneData, (_, settings) => settings)
	// Сохранение настроек с сервера
	.on(saveSettingsFx.doneData, (_, settings) => settings)
	// Сброс настроек к значениям по умолчанию
	.on(resetSettings, () => DEFAULT_SETTINGS);

// Стор для состояния модального окна
export const $isSettingsModalOpen = createStore<boolean>(false)
	.on(openSettingsModal, () => true)
	.on([closeSettingsModal, saveSettingsFx.done], () => false);
