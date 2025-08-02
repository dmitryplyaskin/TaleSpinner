import { createEvent, createStore, sample } from 'effector';

// Константы маршрутов
export const ROUTES = {
	WELCOME: 'welcome',
	WORLD_SELECTION: 'world-selection',
	CHARACTER_CREATION: 'character-creation',
	CREATE_WORLD: 'create-world',
} as const;

export type Screen = (typeof ROUTES)[keyof typeof ROUTES];

export type WorldType = 'fantasy' | 'cyberpunk' | 'everyday' | 'custom';

// Мапа переходов "назад" - откуда куда можно вернуться
const NAVIGATION_MAP: Record<Screen, Screen | null> = {
	[ROUTES.WELCOME]: null, // с главного экрана некуда возвращаться
	[ROUTES.WORLD_SELECTION]: ROUTES.WELCOME,
	[ROUTES.CREATE_WORLD]: ROUTES.WORLD_SELECTION,
	[ROUTES.CHARACTER_CREATION]: ROUTES.CREATE_WORLD,
};

// События навигации
export const navigateToScreen = createEvent<Screen>();
export const goBack = createEvent();
export const selectWorld = createEvent<WorldType>();

// Стор текущего экрана
export const $currentScreen = createStore<Screen>(ROUTES.WELCOME).on(navigateToScreen, (_, screen) => screen);

// Текущий выбранный мир
export const $selectedWorld = createStore<WorldType | null>(null).on(selectWorld, (_, world) => world);

// Получение предыдущего экрана на основе текущего
const $previousScreen = $currentScreen.map((currentScreen) => NAVIGATION_MAP[currentScreen]);

// Обработка кнопки "Назад"
sample({
	clock: goBack,
	source: $previousScreen,
	filter: (previousScreen): previousScreen is Screen => previousScreen !== null,
	target: navigateToScreen,
});
