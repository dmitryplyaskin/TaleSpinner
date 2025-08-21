import { createBranch, navigateToStep, $currentStep, $currentBranch } from './navigation';
import { createEffect } from 'effector';

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
		],
	});

	// Создаем ветку создания мира
	createBranch({
		id: 'world-creation',
		name: 'Создание мира',
		parentBranchId: 'main',
		steps: [
			{
				id: 'world-type-selection',
				name: 'Выбор типа мира',
				data: {},
			},
			{
				id: 'world-selection',
				name: 'Выбор мира',
				data: {},
			},
			{
				id: 'world-customization',
				name: 'Настройка мира',
				data: {},
			},
			{
				id: 'world-primer-edit',
				name: 'Редактирование мира',
				data: {},
			},
			{
				id: 'character-creation',
				name: 'Создание персонажа',
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
	navigateToStep({ stepId: 'world-type-selection', branchId: 'world-creation' });
});

export const goToWorldSelection = createEffect(() => {
	navigateToStep({ stepId: 'world-selection', branchId: 'world-creation' });
});

export const goToWorldCustomization = createEffect(() => {
	navigateToStep({ stepId: 'world-customization', branchId: 'world-creation' });
});

// Экспортируем селекторы для компонентов
export { $currentStep, $currentBranch };

// Типы для удобства
export type AppScreen =
	| 'welcome'
	| 'world-type-selection'
	| 'world-selection'
	| 'world-customization'
	| 'world-primer-edit'
	| 'character-creation';

// Утилита для определения текущего экрана
export const getCurrentScreen = (step: any): AppScreen | null => {
	if (!step) return null;
	return step.id as AppScreen;
};
