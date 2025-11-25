import { createBranch, navigateToStep, $currentStep, $currentBranch } from './navigation';
import { createEffect, createEvent } from 'effector';

// Событие для установки ID выбранного мира
export const setSelectedWorldId = createEvent<string>();

// Инициализация основных веток приложения
export const initializeAppNavigation = createEffect(() => {
	// Создаем главную ветку приложения
	createBranch({
		id: 'main',
		name: 'Главное меню',
		steps: [
			{
				id: 'welcome',
				name: 'Добро пожаловать',
				data: {},
			},
			{
				id: 'world-preparation',
				name: 'Подготовка к игре',
				data: {},
			},
			{
				id: 'chat',
				name: 'Чат',
				data: {},
			},
		],
	});

	// Создаем ветку создания мира
	createBranch({
		id: 'world-creation',
		name: 'Создание мира',
		parentBranchId: 'main',
		steps: [
			{
				id: 'agent-wizard',
				name: 'Мастер создания мира',
				data: {},
			},
		],
	});

	goToWelcome();
});

// Навигационные действия
export const goToWelcome = createEffect(() => {
	navigateToStep({ stepId: 'welcome', branchId: 'main' });
});

export const goToWorldCreation = createEffect(() => {
	navigateToStep({ stepId: 'agent-wizard', branchId: 'world-creation' });
});

// Deprecated/Mapped
export const goToWorldSelection = createEffect(() => {
	navigateToStep({ stepId: 'agent-wizard', branchId: 'world-creation' });
});

export const goToWorldCustomization = createEffect(() => {
	navigateToStep({ stepId: 'agent-wizard', branchId: 'world-creation' });
});

export const goToWorldCompletion = createEffect(() => {
	navigateToStep({ stepId: 'agent-wizard', branchId: 'world-creation' });
});

export const goToChat = createEffect(() => {
	navigateToStep({ stepId: 'chat', branchId: 'main' });
});

export const goToWorldPreparation = createEffect((worldId: string) => {
	setSelectedWorldId(worldId);
	navigateToStep({ stepId: 'world-preparation', branchId: 'main' });
});

// Экспортируем селекторы для компонентов
export { $currentStep, $currentBranch };

// Типы для удобства
export type AppScreen =
	| 'welcome'
	| 'world-preparation'
	| 'chat'
	| 'agent-wizard';

// Утилита для определения текущего экрана
export const getCurrentScreen = (step: { id: string } | null): AppScreen | null => {
	if (!step) return null;
	return step.id as AppScreen;
};
