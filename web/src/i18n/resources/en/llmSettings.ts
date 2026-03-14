const enLlmSettings = {
	selectSampler: 'Select sampler preset',
	presets: {
		title: 'LLM presets',
		active: 'Active preset',
	},
	defaults: {
		newPresetName: 'New LLM preset',
	},
	actions: {
		save: 'Save',
		create: 'Create',
		createPrompt: 'Enter preset name',
		rename: 'Rename',
		renamePrompt: 'Enter new preset name',
		duplicate: 'Duplicate',
		import: 'Import',
		export: 'Export',
		delete: 'Delete',
	},
	confirm: {
		delete: 'Delete selected preset?',
		discardChanges: 'You have unsaved changes. Discard them and switch preset?',
	},
	toasts: {
		exportDone: 'Preset exported',
		exportFailed: 'Failed to export preset',
		importDone: 'Presets imported',
		importFailed: 'Failed to import presets',
		importWarning: 'Import completed with warnings',
		importedCount: 'Imported presets: {{count}}',
	},
	fields: {
		maxTokens: {
			label: 'Max Tokens',
			tooltip: 'Maximum output tokens. 0 means use provider/model default limit.',
		},
		temperature: {
			label: 'Temperature',
			tooltip: 'Controls response randomness. Higher values make output more diverse.',
		},
		topP: {
			label: 'Top P',
			tooltip: 'Nucleus sampling threshold for token selection.',
		},
		topK: {
			label: 'Top K',
			tooltip: 'Limits next-token candidates to the top K options.',
		},
		frequencyPenalty: {
			label: 'Frequency Penalty',
			tooltip: 'Penalizes repeated token frequency.',
		},
		presencePenalty: {
			label: 'Presence Penalty',
			tooltip: 'Encourages introducing new tokens/topics.',
		},
		repetitionPenalty: {
			label: 'Repetition Penalty',
			tooltip: 'Additional penalty against repeated sequences.',
		},
		minP: {
			label: 'Min P',
			tooltip: 'Filters tokens below a dynamic minimum probability threshold.',
		},
		topA: {
			label: 'Top A',
			tooltip: 'Alternative adaptive probability filter.',
		},
		reasoningEnabled: {
			label: 'Reasoning',
			tooltip: 'Enables reasoning mode for supported models.',
		},
		reasoningEffort: {
			label: 'Reasoning Effort',
			tooltip: 'Reasoning intensity level.',
			options: {
				low: 'low',
				medium: 'medium',
				high: 'high',
			},
		},
		reasoningMaxTokens: {
			label: 'Reasoning Max Tokens',
			tooltip: 'Reasoning token budget. 0 means no explicit limit.',
		},
		reasoningExclude: {
			label: 'Reasoning Exclude',
			tooltip: 'Exclude reasoning content from final response where supported.',
		},
	},
};

export default enLlmSettings;
