import { describe, expect, it } from 'vitest';

import {
	applyLlmPresetToOperationRuntime,
	buildOperationLlmRuntimeSummary,
	buildLlmPresetPayloadFromOperationRuntime,
	setOperationSamplersEnabled,
} from './operation-llm-form-utils';

import type { LlmPresetPayload, LlmProviderDefinition, LlmTokenListItem } from '@shared/types/llm';
import type { LlmOperationSamplers } from '@shared/types/operation-profiles';

describe('operation llm form utils', () => {
	it('applies preset runtime values as a copy and remembers preset id', () => {
		const preset: LlmPresetPayload = {
			activeProviderId: 'openai_compatible',
			activeTokenId: 'tok-2',
			activeModel: 'gpt-test',
			providerConfigsById: {},
		};

		expect(
			applyLlmPresetToOperationRuntime(
				{
					providerId: 'openrouter',
					credentialRef: 'tok-1',
					model: 'old-model',
					llmPresetId: '',
				},
				{ presetId: 'preset-1', payload: preset },
			),
		).toEqual({
			providerId: 'openai_compatible',
			credentialRef: 'tok-2',
			model: 'gpt-test',
			llmPresetId: 'preset-1',
		});
	});

	it('keeps the last preset id after manual runtime edits', () => {
		expect(
			applyLlmPresetToOperationRuntime(
				{
					providerId: 'openrouter',
					credentialRef: 'tok-9',
					model: 'custom-model',
					llmPresetId: 'preset-1',
				},
				null,
			),
		).toEqual({
			providerId: 'openrouter',
			credentialRef: 'tok-9',
			model: 'custom-model',
			llmPresetId: 'preset-1',
		});
	});

	it('builds a readable runtime summary', () => {
		const providers: LlmProviderDefinition[] = [
			{
				id: 'openrouter',
				name: 'OpenRouter',
				enabled: true,
				requiresToken: true,
				supportsModels: true,
				configFields: [],
			},
		];
		const tokens: LlmTokenListItem[] = [
			{
				id: 'tok-1',
				providerId: 'openrouter',
				name: 'Main token',
				tokenHint: 'sk-or-1234',
			},
		];

		expect(
			buildOperationLlmRuntimeSummary({
				providers,
				tokens,
				providerId: 'openrouter',
				credentialRef: 'tok-1',
				model: 'anthropic/claude-3.5-sonnet',
			}),
		).toBe('OpenRouter / Main token / anthropic/claude-3.5-sonnet');
	});

	it('builds preset payload from copied runtime values', () => {
		expect(
			buildLlmPresetPayloadFromOperationRuntime({
				providerId: 'openrouter',
				credentialRef: 'tok-1',
				model: 'claude-test',
				llmPresetId: 'preset-1',
			}),
		).toEqual({
			activeProviderId: 'openrouter',
			activeTokenId: 'tok-1',
			activeModel: 'claude-test',
			providerConfigsById: {},
		});
	});

	it('disabling sampler overrides clears preset id and values', () => {
		const samplers: LlmOperationSamplers = { temperature: 0.7, topP: 0.9 };

		expect(
			setOperationSamplersEnabled({
				samplersEnabled: true,
				samplerPresetId: 'sampler-1',
				samplers,
			}, false),
		).toEqual({
			samplersEnabled: false,
			samplerPresetId: '',
			samplers: {},
		});
	});
});
