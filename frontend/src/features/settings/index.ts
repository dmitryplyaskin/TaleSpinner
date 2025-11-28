/**
 * Settings Feature - Публичный API
 *
 * Фича для управления настройками приложения.
 */

// UI компоненты
export { SettingsDrawer } from './ui';

// Model (stores, events, effects)
export {
	// Stores
	$settings,
	$models,
	$modelsLoading,
	$modelsError,
	$isSettingsOpen,
	$tokenOperationPending,
	// Events
	openSettings,
	closeSettings,
	resetSettings,
	// Effects
	loadSettingsFx,
	saveSettingsFx,
	addTokenFx,
	updateTokenFx,
	deleteTokenFx,
	activateTokenFx,
	loadModelsFx,
} from './model';

// Types
export type {
	AppSettings,
	ApiSettings,
	ApiToken,
	OpenRouterModel,
	LLMOutputLanguage,
	InterfaceLanguage,
} from './model';



