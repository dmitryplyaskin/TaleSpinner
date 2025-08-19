import React from 'react';
import { WorldPrimerEdit } from './world-primer-edit';
import { WorldPrimer } from '@shared/types/world-creation';

// Пример данных для демонстрации
const exampleWorldPrimer: WorldPrimer = {
	id: 'example-id',
	name: 'Мир Эльдарии',
	genre: 'Fantasy',
	tone: 'Эпический, мистический',
	world_primer:
		'Древний мир, где магия переплетается с технологиями, а драконы сосуществуют с механическими конструктами.',
	history: 'Тысячи лет назад великая катастрофа разделила мир на несколько континентов...',
	locations: [
		{
			name: 'Столица Аэтерис',
			description: 'Величественный город парящих башен и магических кристаллов.',
		},
	],
	races: [
		{
			name: 'Эльфы Света',
			description: 'Древняя раса, владеющая магией света и исцеления.',
		},
	],
	factions: [
		{
			name: 'Орден Хранителей',
			description: 'Мистический орден, защищающий древние знания.',
		},
	],
	detailed_elements: {
		races: {
			races: [
				{
					name: 'Эльфы Света',
					description: 'Высокие, грациозные существа с серебристой кожей',
					relationship_to_conflict: 'Нейтральные посредники',
					special_abilities: 'Магия света и исцеления',
					social_structure: 'Совет старейшин',
				},
			],
		},
		timeline: {
			historical_events: [
				{
					name: 'Великий Раскол',
					timeframe: '2000 лет назад',
					description: 'Катастрофическое событие, разделившее континенты',
					impact_on_present: 'Создало современную географию мира',
				},
			],
		},
		locations: {
			locations: [
				{
					name: 'Столица Аэтерис',
					type: 'Магический город',
					appearance: 'Парящие башни из белого камня',
					history: 'Основан после Великого Раскола',
					inhabitants: 'Эльфы и люди',
					significance: 'Центр магического образования',
					features_and_secrets: 'Скрытые порталы в подземелья',
					adventure_opportunities: 'Исследование древних библиотек',
				},
			],
		},
		factions: {
			factions: [
				{
					name: 'Орден Хранителей',
					type: 'Религиозный орден',
					ideology_and_goals: 'Сохранение древних знаний',
					structure: 'Иерархическая',
					key_leaders: 'Архимаг Селестия',
					methods: 'Магические ритуалы и исследования',
					relationships: 'Союзники эльфов',
					role_in_conflict: 'Нейтральные наблюдатели',
					resources_and_influence: 'Огромная библиотека и артефакты',
				},
			],
		},
	},
	createdAt: '2024-01-01T00:00:00Z',
	updatedAt: '2024-01-01T00:00:00Z',
};

export const WorldPrimerEditExample: React.FC = () => {
	const handleSave = (updatedPrimer: WorldPrimer) => {
		console.log('Сохранение обновленного мира:', updatedPrimer);
		// Здесь можно добавить логику сохранения
	};

	const handleCancel = () => {
		console.log('Отмена редактирования');
		// Здесь можно добавить логику отмены
	};

	return <WorldPrimerEdit worldPrimer={exampleWorldPrimer} onSave={handleSave} onCancel={handleCancel} />;
};
