import type { WorldType } from '../model/navigation_old';
import { ProgressTask } from '../hooks/useProgressLoader';

// Базовая функция для создания промиса с задержкой
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Функция для имитации запроса с возможностью отмены
const createAbortableRequest = (description: string, duration: number = 1000) => {
	return (signal: AbortSignal): Promise<any> => {
		return new Promise((resolve, reject) => {
			const timeoutId = setTimeout(() => {
				resolve({ success: true, description });
			}, duration);

			// Обработка отмены запроса
			signal.addEventListener('abort', () => {
				clearTimeout(timeoutId);
				reject(new Error('Запрос отменен'));
			});
		});
	};
};

// Функции для разных типов миров
export const getWorldSetupTasks = (worldType: WorldType): ProgressTask[] => {
	const baseTasks: ProgressTask[] = [
		{
			id: 'validate-world',
			description: 'Проверка параметров мира...',
			execute: createAbortableRequest('Параметры мира проверены'),
		},
		{
			id: 'create-world',
			description: 'Создание игрового мира...',
			execute: createAbortableRequest('Мир создан'),
		},
	];

	switch (worldType) {
		case 'fantasy':
			return [
				...baseTasks,
				{
					id: 'generate-magic-system',
					description: 'Генерация системы магии...',
					execute: createAbortableRequest('Система магии настроена'),
				},
				{
					id: 'create-creatures',
					description: 'Создание мифических существ...',
					execute: createAbortableRequest('Существа добавлены'),
				},
				{
					id: 'setup-kingdoms',
					description: 'Настройка королевств и фракций...',
					execute: createAbortableRequest('Политическая карта настроена'),
				},
			];

		case 'cyberpunk':
			return [
				...baseTasks,
				{
					id: 'setup-corporations',
					description: 'Настройка корпораций...',
					execute: createAbortableRequest('Корпорации созданы'),
				},
				{
					id: 'generate-tech',
					description: 'Генерация технологий...',
					execute: createAbortableRequest('Технологии настроены'),
				},
				{
					id: 'create-districts',
					description: 'Создание городских районов...',
					execute: createAbortableRequest('Районы созданы'),
				},
			];

		case 'everyday':
			return [
				...baseTasks,
				{
					id: 'setup-locations',
					description: 'Настройка локаций...',
					execute: createAbortableRequest('Локации настроены'),
				},
				{
					id: 'create-npcs',
					description: 'Создание персонажей...',
					execute: createAbortableRequest('NPC созданы'),
				},
			];

		case 'custom':
			return [
				{
					id: 'analyze-requirements',
					description: 'Анализ требований...',
					execute: createAbortableRequest('Требования проанализированы'),
				},
				{
					id: 'design-world',
					description: 'Проектирование мира...',
					execute: createAbortableRequest('Дизайн мира готов'),
				},
				{
					id: 'implement-rules',
					description: 'Внедрение правил...',
					execute: createAbortableRequest('Правила внедрены'),
				},
				{
					id: 'create-content',
					description: 'Создание контента...',
					execute: createAbortableRequest('Контент создан'),
				},
				{
					id: 'finalize-world',
					description: 'Финализация мира...',
					execute: createAbortableRequest('Мир готов к использованию'),
				},
			];

		default:
			return baseTasks;
	}
};
