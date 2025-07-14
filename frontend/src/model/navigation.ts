import { createEvent, createStore } from 'effector';

export type Screen = 'welcome' | 'world-selection' | 'character-creation';

export type WorldType = 'fantasy' | 'cyberpunk' | 'everyday' | 'custom';

// События навигации
export const navigateToScreen = createEvent<Screen>();
export const goBack = createEvent();
export const selectWorld = createEvent<WorldType>();

// Стор текущего экрана
export const $currentScreen = createStore<Screen>('welcome').on(navigateToScreen, (_, screen) => screen);

// История навигации для кнопки "Назад"
export const $navigationHistory = createStore<Screen[]>(['welcome'])
	.on(navigateToScreen, (history, screen) => [...history, screen])
	.on(goBack, (history) => history.slice(0, -1));

// Текущий выбранный мир
export const $selectedWorld = createStore<WorldType | null>(null).on(selectWorld, (_, world) => world);

// Обработка кнопки "Назад"
$navigationHistory.on(goBack, (history, _) => {
	if (history.length > 1) {
		const previousScreen = history[history.length - 2];
		navigateToScreen(previousScreen);
	}
	return history;
});
