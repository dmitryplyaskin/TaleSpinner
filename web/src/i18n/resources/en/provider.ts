const enProvider = {
	providerLabel: 'API provider',
	placeholders: {
		selectProvider: 'Select provider...',
		selectToken: 'Select token...',
		noTokens: 'No tokens',
		selectModel: 'Select model...',
		selectTokenFirst: 'Select a token first',
	},
	tokens: {
		title: 'Tokens',
		manage: 'Manage tokens',
	},
	config: {
		title: 'Provider configuration',
		baseUrl: 'Base URL',
		defaultModel: 'Default model (optional)',
		checkConnection: 'Check connection',
		checkConnectionHelp:
			'The check uses the selected token and the current config draft. You do not need to save settings first.',
		connectionSuccessTitle: 'Provider connection is working',
		connectionErrorTitle: 'Provider check failed',
		checkedEndpoint: 'Checked endpoint',
		tokenPolicy: {
			title: 'Token policy',
			randomize: 'Use random token when more than one token exists',
			fallbackOnError: 'Fallback to next token on pre-stream errors',
		},
		messageNormalization: {
			title: 'Message normalization',
			enabled: 'Merge all system instructions into one message',
			helpText: 'Enabled by default for compatibility with providers that accept only one system message.',
		},
		anthropicCache: {
			title: 'Anthropic prompt cache',
			enabled: 'Enable Anthropic/OpenRouter prompt cache',
			depth: 'Cache depth (from tail)',
			ttl: 'Cache TTL',
			helpText: 'Depth is measured from the last message; the dynamic tail window stays uncached.',
		},
		save: 'Save config',
	},
	model: {
		title: 'Model',
		load: 'Load models',
		manual: 'Manual model id',
		manualPlaceholder: 'e.g. anthropic/claude-3.5-sonnet',
		applyManual: 'Apply',
		helpText: 'If no model is selected, provider `defaultModel` (if set) or provider default will be used.',
	},
	presets: {
		title: 'Connection presets',
		active: 'Active preset',
		defaults: {
			newPresetName: 'New connection preset',
		},
		actions: {
			createPrompt: 'Enter preset name',
			renamePrompt: 'Enter new preset name',
			create: 'Create',
			save: 'Save',
			rename: 'Rename',
			duplicate: 'Duplicate',
			delete: 'Delete',
		},
		confirm: {
			delete: 'Delete selected preset?',
			discardChanges: 'You have unsaved changes. Discard them and switch preset?',
		},
		toasts: {
			created: 'Preset created',
			saved: 'Preset saved',
			deleted: 'Preset deleted',
			applied: 'Preset applied',
			appliedWithWarnings: 'Preset applied with warnings',
			failed: 'Preset action failed',
		},
	},
	toasts: {
		configSaved: 'Provider config saved',
		configSaveFailed: 'Failed to save provider config',
		connectionCheckPassed: 'Provider check passed',
		connectionCheckFailed: 'Provider check failed',
		modelsEmpty: 'Models list is empty',
		modelsEmptyHelp:
			'The provider returned no models. Check Base URL, token, and use the connection check button.',
		modelsLoadFailed: 'Failed to load models',
	},
};

export default enProvider;
