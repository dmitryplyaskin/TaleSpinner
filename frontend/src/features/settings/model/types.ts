/**
 * Settings Feature - Типы
 */

export type {
	AppSettings,
	ApiSettings,
	ApiToken,
	CreateTokenRequest,
	UpdateTokenRequest,
	OpenRouterModel,
	OpenRouterModelsResponse,
	LLMOutputLanguage,
} from '@shared/types/settings';

export { ApiProvider, DEFAULT_SETTINGS } from '@shared/types/settings';

/** Язык интерфейса приложения */
export type InterfaceLanguage = 'ru' | 'en';




