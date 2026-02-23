const ruLlmSettings = {
	selectSampler: 'Выберите пресет сэмплера',
	actions: {
		save: 'Сохранить',
		create: 'Создать',
		rename: 'Переименовать',
		renamePrompt: 'Введите новое название пресета',
		duplicate: 'Дублировать',
		delete: 'Удалить',
	},
	confirm: {
		discardChanges: 'Есть несохранённые изменения. Отменить их и переключить пресет?',
	},
	fields: {
		maxTokens: {
			label: 'Max Tokens',
			tooltip: 'Максимум токенов в ответе. 0 означает использовать лимит модели/провайдера.',
		},
		temperature: {
			label: 'Temperature',
			tooltip: 'Контролирует случайность ответа. Более высокие значения дают более вариативный текст.',
		},
		topP: {
			label: 'Top P',
			tooltip: 'Nucleus sampling: ограничивает выбор токенов по накопленной вероятности.',
		},
		topK: {
			label: 'Top K',
			tooltip: 'Ограничивает выбор следующего токена K наиболее вероятными вариантами.',
		},
		frequencyPenalty: {
			label: 'Frequency Penalty',
			tooltip: 'Штрафует частые повторения токенов.',
		},
		presencePenalty: {
			label: 'Presence Penalty',
			tooltip: 'Повышает шанс появления новых тем/токенов.',
		},
		repetitionPenalty: {
			label: 'Repetition Penalty',
			tooltip: 'Дополнительный штраф за повторяемость последовательностей.',
		},
		minP: {
			label: 'Min P',
			tooltip: 'Отбрасывает токены ниже динамического порога вероятности.',
		},
		topA: {
			label: 'Top A',
			tooltip: 'Альтернативный адаптивный фильтр вероятностей.',
		},
		reasoningEnabled: {
			label: 'Reasoning',
			tooltip: 'Включает reasoning-режим для поддерживаемых моделей.',
		},
		reasoningEffort: {
			label: 'Reasoning Effort',
			tooltip: 'Интенсивность reasoning-режима.',
			options: {
				low: 'low',
				medium: 'medium',
				high: 'high',
			},
		},
		reasoningMaxTokens: {
			label: 'Reasoning Max Tokens',
			tooltip: 'Лимит токенов для reasoning. 0 означает без явного лимита.',
		},
		reasoningExclude: {
			label: 'Reasoning Exclude',
			tooltip: 'Исключать reasoning-содержимое из финального ответа, где это поддерживается.',
		},
	},
};

export default ruLlmSettings;
