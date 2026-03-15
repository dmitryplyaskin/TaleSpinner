import {
	makeDefaultOperationArtifactConfig,
	normalizeOperationArtifactConfig,
	type GuardOutputContract,
	type GuardOutputDefinition,
	type GuardOperationInProfile,
	type LlmOperationRetryOn,
	type OperationArtifactConfig,
} from '@shared/types/operation-profiles';

import {
	normalizeRetryOn,
	pickNumericSamplers,
	type OperationLlmRuntimeFields,
	type OperationSamplerFields,
} from './operation-llm-form-utils';

export type FormGuardKindParams = OperationLlmRuntimeFields &
	OperationSamplerFields & {
	engine: 'liquid' | 'aux_llm';
	outputContract: GuardOutputContract;
	template: string;
	system: string;
	prompt: string;
	strictVariables: boolean;
	timeoutMs: number;
	retry: {
		maxAttempts: number;
		backoffMs: number;
		retryOn: LlmOperationRetryOn[];
	};
	artifact: OperationArtifactConfig;
};

export function makeDefaultGuardOutputDefinition(index = 0): GuardOutputDefinition {
	const humanIndex = index + 1;
	return {
		key: `branch_${humanIndex}`,
		title: `Branch ${humanIndex}`,
	};
}

function normalizeOutputContract(value: unknown): GuardOutputDefinition[] {
	if (!Array.isArray(value)) return [];
	return value.flatMap((item) => {
		if (!item || typeof item !== 'object') return [];
		const candidate = item as Record<string, unknown>;
		const key = typeof candidate.key === 'string' ? candidate.key.trim() : '';
		if (!key) return [];
		return [
			{
				key,
				title: typeof candidate.title === 'string' && candidate.title.trim() ? candidate.title.trim() : key,
				description:
					typeof candidate.description === 'string' && candidate.description.trim() ? candidate.description.trim() : undefined,
			} satisfies GuardOutputDefinition,
		];
	});
}

export function readGuardOutputContract(params: unknown): GuardOutputDefinition[] {
	if (!params || typeof params !== 'object') return [];
	return normalizeOutputContract((params as Record<string, unknown>).outputContract);
}

export function makeDefaultGuardKindParams(
	opId: string,
	artifact: OperationArtifactConfig = makeDefaultOperationArtifactConfig({
		opId,
		kind: 'guard',
		title: 'Artifact',
	}),
): FormGuardKindParams {
	return {
		engine: 'liquid',
		outputContract: [makeDefaultGuardOutputDefinition(0)],
		template: '{\n  \n}',
		providerId: 'openrouter',
		credentialRef: '',
		model: '',
		llmPresetId: '',
		system: '',
		prompt: '',
		strictVariables: false,
		samplersEnabled: false,
		samplerPresetId: '',
		samplers: {},
		timeoutMs: 60000,
		retry: {
			maxAttempts: 1,
			backoffMs: 0,
			retryOn: ['timeout', 'provider_error', 'rate_limit'],
		},
		artifact,
	};
}

export function normalizeGuardKindParams(op: GuardOperationInProfile): FormGuardKindParams {
	const raw = op.config.params as Record<string, unknown>;
	const retryRaw = raw.retry && typeof raw.retry === 'object' ? (raw.retry as Record<string, unknown>) : {};

	return {
		...makeDefaultGuardKindParams(
			op.opId,
			normalizeOperationArtifactConfig({
				opId: op.opId,
				kind: op.kind,
				title: op.name,
				rawParams: raw,
			}),
		),
		engine: raw.engine === 'aux_llm' ? 'aux_llm' : 'liquid',
		outputContract: normalizeOutputContract(raw.outputContract),
		template: typeof raw.template === 'string' ? raw.template : '{\n  \n}',
		providerId: raw.providerId === 'openai_compatible' ? 'openai_compatible' : 'openrouter',
		credentialRef: typeof raw.credentialRef === 'string' ? raw.credentialRef : '',
		model: typeof raw.model === 'string' ? raw.model : '',
		llmPresetId: '',
		system: typeof raw.system === 'string' ? raw.system : '',
		prompt: typeof raw.prompt === 'string' ? raw.prompt : '',
		strictVariables: raw.strictVariables === true,
		samplersEnabled: Object.keys(pickNumericSamplers(raw.samplers)).length > 0,
		samplerPresetId: '',
		samplers: pickNumericSamplers(raw.samplers),
		timeoutMs: typeof raw.timeoutMs === 'number' && Number.isFinite(raw.timeoutMs) ? raw.timeoutMs : 60000,
		retry: {
			maxAttempts:
				typeof retryRaw.maxAttempts === 'number' && Number.isFinite(retryRaw.maxAttempts)
					? Math.max(1, Math.floor(retryRaw.maxAttempts))
					: 1,
			backoffMs:
				typeof retryRaw.backoffMs === 'number' && Number.isFinite(retryRaw.backoffMs)
					? Math.max(0, Math.floor(retryRaw.backoffMs))
					: 0,
			retryOn: normalizeRetryOn(retryRaw.retryOn),
		},
	};
}

export function serializeGuardKindParams(params: FormGuardKindParams, opId: string) {
	const model = params.model.trim();
	const system = params.system.trim();
	const credentialRef = params.credentialRef.trim();
	const outputContract = normalizeOutputContract(params.outputContract);
	const samplers = params.samplersEnabled ? pickNumericSamplers(params.samplers) : {};
	const timeoutMs = Number.isFinite(params.timeoutMs) ? Math.max(1, Math.floor(params.timeoutMs)) : undefined;
	const retryMaxAttempts = Number.isFinite(params.retry.maxAttempts) ? Math.max(1, Math.floor(params.retry.maxAttempts)) : 1;
	const retryBackoffMs = Number.isFinite(params.retry.backoffMs) ? Math.max(0, Math.floor(params.retry.backoffMs)) : 0;
	const artifact = {
		...params.artifact,
		artifactId: params.artifact.artifactId || `artifact:${opId}`,
		format: 'json' as const,
	};

	if (params.engine === 'aux_llm') {
		return {
			engine: 'aux_llm' as const,
			outputContract,
			providerId: params.providerId,
			credentialRef,
			model: model.length > 0 ? model : undefined,
			system: system.length > 0 ? system : undefined,
			prompt: params.prompt,
			strictVariables: params.strictVariables ? true : undefined,
			samplers: params.samplersEnabled && Object.keys(samplers).length > 0 ? samplers : undefined,
			timeoutMs,
			retry: {
				maxAttempts: retryMaxAttempts,
				backoffMs: retryBackoffMs,
				retryOn: normalizeRetryOn(params.retry.retryOn),
			},
			artifact,
		};
	}

	return {
		engine: 'liquid' as const,
		outputContract,
		template: params.template,
		strictVariables: params.strictVariables ? true : undefined,
		artifact,
	};
}
