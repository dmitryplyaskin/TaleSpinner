import { describe, expect, it } from 'vitest';

import { makeDefaultArtifactOutput, type FormOperation } from '../../form/operation-profile-form-mapping';

import {
	buildOperationFlowNodeData,
	buildOperationFlowNodeSignature,
	getOperationFlowNodeMinHeight,
	hasDefaultSourceHandle,
} from './operation-flow-node-model';

function makeOperation(kind: FormOperation['kind']): FormOperation {
	return {
		opId: `${kind}-1`,
		name: `${kind} op`,
		description: '',
		kind,
		config: {
			enabled: true,
			required: false,
			hooks: ['before_main_llm'],
			triggers: ['generate'],
			activation: { everyNTurns: 0, everyNContextTokens: 0 },
			order: 10,
			dependsOn: [],
			runConditions: [],
			params:
				kind === 'guard'
					? {
							engine: 'liquid',
							outputContract: [
								{ key: 'isBattle', title: 'Battle' },
								{ key: 'isNight', title: 'Night' },
							],
							template: '{"isBattle": true, "isNight": false}',
							strictVariables: false,
							providerId: 'openrouter',
							credentialRef: '',
							model: '',
							llmPresetId: '',
							system: '',
							prompt: '',
							samplersEnabled: false,
							samplerPresetId: '',
							samplers: {},
							timeoutMs: 60000,
							retry: {
								maxAttempts: 1,
								backoffMs: 0,
								retryOn: ['timeout', 'provider_error', 'rate_limit'],
							},
							artifact: makeDefaultArtifactOutput('guard-1', 'guard'),
					  }
					: {
							template: '',
							strictVariables: false,
							artifact: makeDefaultArtifactOutput(`${kind}-1`, kind),
					  },
		},
	};
}

describe('operation flow node model', () => {
	it('removes the default source handle for guard nodes', () => {
		expect(hasDefaultSourceHandle(buildOperationFlowNodeData(makeOperation('template')))).toBe(true);
		expect(hasDefaultSourceHandle(buildOperationFlowNodeData(makeOperation('guard')))).toBe(false);
	});

	it('increases guard node min height as outputs grow', () => {
		const templateData = buildOperationFlowNodeData(makeOperation('template'));
		const guardData = buildOperationFlowNodeData(makeOperation('guard'));

		expect(getOperationFlowNodeMinHeight(guardData)).toBeGreaterThan(getOperationFlowNodeMinHeight(templateData));
	});

	it('includes guard outputs in the node signature', () => {
		const guardData = buildOperationFlowNodeData(makeOperation('guard'));

		expect(buildOperationFlowNodeSignature(guardData)).toContain('isBattle:Battle');
		expect(buildOperationFlowNodeSignature(guardData)).toContain('isNight:Night');
	});
});
