import {
	isSillyTavernPreset,
	getSillyTavernPresetValidationError,
	SILLY_TAVERN_PREFERRED_CHARACTER_ID,
} from '@shared/utils/sillytavern-preset';
import {
	cloneStPromptWithDefaults,
	normalizeStPromptOrder,
	normalizeStPrompts,
} from '@shared/utils/st-prompts';

import { ST_PROMPT_SOURCE_LABELS, ST_SYSTEM_PROMPT_DEFAULTS } from './st-preset-prompts';

export { ST_PROMPT_SOURCE_LABELS, ST_SYSTEM_PROMPT_DEFAULTS } from './st-preset-prompts';

import type {
	StBaseConfig,
	StBasePrompt,
	StBasePromptOrder,
	StBaseResponseConfig,
} from '@shared/types/instructions';
import type { LlmProviderConfig, LlmProviderId } from '@shared/types/llm';

export const ST_SENSITIVE_FIELDS = [
	'reverse_proxy',
	'proxy_password',
	'custom_url',
	'custom_include_body',
	'custom_exclude_body',
	'custom_include_headers',
	'vertexai_region',
	'vertexai_express_project_id',
	'azure_base_url',
	'azure_deployment_name',
] as const;

type SensitiveImportMode = 'remove' | 'keep';
type ConnectionFieldStatus = 'supported' | 'sensitive' | 'unsupported';

type StResponseConfigKey = keyof StBaseResponseConfig;
type StResponseNumericKey =
	| 'temperature'
	| 'top_p'
	| 'top_k'
	| 'top_a'
	| 'min_p'
	| 'repetition_penalty'
	| 'frequency_penalty'
	| 'presence_penalty'
	| 'openai_max_tokens'
	| 'seed'
	| 'n';

const ST_RESPONSE_CONFIG_KEYS: StResponseConfigKey[] = [
	'temperature',
	'top_p',
	'top_k',
	'top_a',
	'min_p',
	'repetition_penalty',
	'frequency_penalty',
	'presence_penalty',
	'openai_max_tokens',
	'seed',
	'n',
	'reasoning_effort',
	'verbosity',
	'enable_web_search',
	'stream_openai',
];

const ST_CONNECTION_FIELDS: Array<{ key: string; status: ConnectionFieldStatus }> = [
	{ key: 'chat_completion_source', status: 'supported' },
	{ key: 'openai_model', status: 'supported' },
	{ key: 'reverse_proxy', status: 'sensitive' },
	{ key: 'proxy_password', status: 'sensitive' },
	{ key: 'custom_url', status: 'sensitive' },
	{ key: 'custom_include_body', status: 'sensitive' },
	{ key: 'custom_exclude_body', status: 'sensitive' },
	{ key: 'custom_include_headers', status: 'sensitive' },
	{ key: 'vertexai_region', status: 'sensitive' },
	{ key: 'vertexai_express_project_id', status: 'sensitive' },
	{ key: 'azure_base_url', status: 'sensitive' },
	{ key: 'azure_deployment_name', status: 'sensitive' },
	{ key: 'openrouter_group_models', status: 'unsupported' },
];

export type StPresetBindingPlan = {
	runtimePatch: {
		activeProviderId?: LlmProviderId;
		activeModel?: string | null;
	} | null;
	providerConfigPatches: Array<{ providerId: LlmProviderId; config: LlmProviderConfig }>;
	warnings: string[];
};

function asString(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function toFiniteNumber(value: unknown): number | undefined {
	if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
	return value;
}

function toOptionalBoolean(value: unknown): boolean | undefined {
	return typeof value === 'boolean' ? value : undefined;
}

function normalizeResponseConfig(
	preset: Record<string, unknown>
): StBaseResponseConfig {
	const responseConfig: StBaseResponseConfig = {};
	const numericKeys: StResponseNumericKey[] = [
		'temperature',
		'top_p',
		'top_k',
		'top_a',
		'min_p',
		'repetition_penalty',
		'frequency_penalty',
		'presence_penalty',
		'openai_max_tokens',
		'seed',
		'n',
	];

	for (const key of numericKeys) {
		const value = toFiniteNumber(preset[key]);
		if (typeof value === 'number') {
			responseConfig[key] = value;
		}
	}

	if (typeof preset.reasoning_effort === 'string') {
		responseConfig.reasoning_effort = preset.reasoning_effort;
	}
	if (typeof preset.verbosity === 'string') {
		responseConfig.verbosity = preset.verbosity;
	}
	const enableWebSearch = toOptionalBoolean(preset.enable_web_search);
	if (typeof enableWebSearch === 'boolean') {
		responseConfig.enable_web_search = enableWebSearch;
	}
	const stream = toOptionalBoolean(preset.stream_openai);
	if (typeof stream === 'boolean') {
		responseConfig.stream_openai = stream;
	}
	return responseConfig;
}

export function createEmptyStBaseConfig(): StBaseConfig {
	return {
		rawPreset: {},
		prompts: [],
		promptOrder: [
			{
				character_id: SILLY_TAVERN_PREFERRED_CHARACTER_ID,
				order: [],
			},
		],
		responseConfig: {},
		importInfo: {
			source: 'sillytavern',
			fileName: 'manual',
			importedAt: new Date().toISOString(),
		},
	};
}

export function detectStChatCompletionPreset(
	input: unknown
): input is Record<string, unknown> {
	return isSillyTavernPreset(input);
}

export function getStPresetValidationError(input: unknown): string | null {
	return getSillyTavernPresetValidationError(input);
}

export function hasSensitivePresetFields(preset: Record<string, unknown>): boolean {
	return ST_SENSITIVE_FIELDS.some((key) => Object.prototype.hasOwnProperty.call(preset, key));
}

export function stripSensitiveFieldsFromPreset(
	preset: Record<string, unknown>
): Record<string, unknown> {
	const cloned = structuredClone(preset);
	for (const key of ST_SENSITIVE_FIELDS) {
		delete cloned[key];
	}
	return cloned;
}

export function createStBaseConfigFromPreset(params: {
	preset: Record<string, unknown>;
	fileName: string;
	sensitiveImportMode: SensitiveImportMode;
}): StBaseConfig {
	const validationError = getSillyTavernPresetValidationError(params.preset);
	if (validationError) {
		throw new Error(validationError);
	}

	const rawPreset =
		params.sensitiveImportMode === 'remove'
			? stripSensitiveFieldsFromPreset(params.preset)
			: structuredClone(params.preset);
	return {
		rawPreset,
		prompts: normalizeStPrompts(rawPreset.prompts),
		promptOrder: normalizeStPromptOrder(rawPreset.prompt_order),
		responseConfig: normalizeResponseConfig(rawPreset),
		importInfo: {
			source: 'sillytavern',
			fileName: params.fileName,
			importedAt: new Date().toISOString(),
		},
	};
}

export function resolvePreferredPromptOrder(stBase: StBaseConfig): StBasePromptOrder {
	const preferred =
		stBase.promptOrder.find(
			(item) => item.character_id === SILLY_TAVERN_PREFERRED_CHARACTER_ID
		) ?? stBase.promptOrder[0];

	if (preferred) {
		return {
			character_id: preferred.character_id,
			order: preferred.order.map((item) => ({ ...item })),
		};
	}

	return {
		character_id: SILLY_TAVERN_PREFERRED_CHARACTER_ID,
		order: stBase.prompts.map((item) => ({
			identifier: item.identifier,
			enabled: true,
		})),
	};
}

export function getStPromptDefinition(identifier: string): StBasePrompt | null {
	return ST_SYSTEM_PROMPT_DEFAULTS.find((item) => item.identifier === identifier) ?? null;
}

export function isSystemMarkerPrompt(prompt: StBasePrompt | null | undefined): boolean {
	return prompt?.marker === true;
}

export function getStPromptSourceLabel(identifier: string): string | null {
	return ST_PROMPT_SOURCE_LABELS[identifier] ?? null;
}

export function buildStPresetFromStBase(stBase: StBaseConfig): Record<string, unknown> {
	const preset = structuredClone(stBase.rawPreset ?? {});
	preset.prompts = stBase.prompts.map((item) => cloneStPromptWithDefaults(item));
	preset.prompt_order = stBase.promptOrder.map((item) => ({
		character_id: item.character_id,
		order: item.order.map((orderItem) => ({ ...orderItem })),
	}));

	for (const key of ST_RESPONSE_CONFIG_KEYS) {
		const value = stBase.responseConfig[key];
		if (typeof value === 'undefined') {
			delete preset[key];
			continue;
		}
		preset[key] = value;
	}

	return preset;
}

export function listConnectionFieldWarnings(preset: Record<string, unknown>): string[] {
	const presentFields = ST_CONNECTION_FIELDS.filter(({ key }) =>
		Object.prototype.hasOwnProperty.call(preset, key)
	);
	if (presentFields.length === 0) return [];

	const warnings: string[] = [];
	const sensitive = presentFields.filter((item) => item.status === 'sensitive').map((item) => item.key);
	const unsupported = presentFields.filter((item) => item.status === 'unsupported').map((item) => item.key);

	if (sensitive.length > 0) {
		warnings.push(`Sensitive connection fields were preserved but not auto-applied: ${sensitive.join(', ')}`);
	}
	if (unsupported.length > 0) {
		warnings.push(`Unsupported connection fields remain raw-only: ${unsupported.join(', ')}`);
	}

	return warnings;
}

export function createBestEffortLlmBindingPlan(stBase: StBaseConfig): StPresetBindingPlan {
	const preset = stBase.rawPreset ?? {};
	const warnings = [...listConnectionFieldWarnings(preset)];
	const source = asString(preset.chat_completion_source);
	const model = asString(preset.openai_model);

	let activeProviderId: LlmProviderId | undefined;
	if (source === 'openrouter') {
		activeProviderId = 'openrouter';
	} else if (source) {
		activeProviderId = 'openai_compatible';
		warnings.push(`Mapped ST source "${source}" to TaleSpinner provider "openai_compatible".`);
	}

	return {
		runtimePatch:
			activeProviderId || model
				? {
						activeProviderId,
						activeModel: model ?? null,
					}
				: null,
		providerConfigPatches: [],
		warnings,
	};
}
