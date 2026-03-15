import { describe, expect, it } from 'vitest';

import { makeDefaultArtifactOutput, type FormOperation } from '../form/operation-profile-form-mapping';

import {
	applyConnectionToOperations,
	buildOperationGraphEdges,
	buildGuardSourceHandleId,
	removeEdgeFromOperations,
} from './operation-graph';

function makeGuardOperation(): FormOperation {
	return {
		opId: 'guard-1',
		name: 'Guard',
		description: '',
		kind: 'guard',
		config: {
			enabled: true,
			required: false,
			hooks: ['before_main_llm'],
			triggers: ['generate'],
			activation: { everyNTurns: 0, everyNContextTokens: 0 },
			order: 10,
			dependsOn: [],
			runConditions: [],
			params: {
				engine: 'liquid',
				outputContract: [
					{ key: 'isBattle', title: 'Battle' },
					{ key: 'isNight', title: 'Night' },
				],
				template: '{"isBattle": true, "isNight": false}',
				strictVariables: false,
				prompt: '',
				llmPresetId: '',
				samplersEnabled: false,
				samplerPresetId: '',
				system: '',
				providerId: 'openrouter',
				credentialRef: '',
				model: '',
				samplers: {},
				timeoutMs: 60000,
				retry: {
					maxAttempts: 1,
					backoffMs: 0,
					retryOn: ['timeout', 'provider_error', 'rate_limit'],
				},
				artifact: makeDefaultArtifactOutput('guard-1', 'guard'),
			},
		},
	};
}

function makeTemplateOperation(): FormOperation {
	return {
		opId: 'template-1',
		name: 'Consumer',
		description: '',
		kind: 'template',
		config: {
			enabled: true,
			required: false,
			hooks: ['before_main_llm'],
			triggers: ['generate'],
			activation: { everyNTurns: 0, everyNContextTokens: 0 },
			order: 20,
			dependsOn: [],
			runConditions: [],
			params: {
				template: '',
				strictVariables: false,
				artifact: makeDefaultArtifactOutput('template-1', 'template'),
			},
		},
	};
}

describe('operation graph helpers', () => {
	it('builds guard branch edges and omits duplicate dependency edge for the same source', () => {
		const operations: FormOperation[] = [
			makeGuardOperation(),
			{
				...makeTemplateOperation(),
				config: {
					...makeTemplateOperation().config,
					dependsOn: ['guard-1', 'other-1'],
					runConditions: [
						{
							type: 'guard_output',
							sourceOpId: 'guard-1',
							outputKey: 'isBattle',
							operator: 'is_true',
						},
					],
				},
			},
		];

		const edges = buildOperationGraphEdges(operations);

		expect(edges.map((edge) => edge.id)).toContain('guard:guard-1:isBattle:is_true=>template-1');
		expect(edges.map((edge) => edge.id)).toContain('dep:other-1=>template-1');
		expect(edges.map((edge) => edge.id)).not.toContain('dep:guard-1=>template-1');
	});

	it('creates runCondition and dependsOn when connecting from a guard output handle', () => {
		const operations = [makeGuardOperation(), makeTemplateOperation()];

		const next = applyConnectionToOperations(operations, {
			source: 'guard-1',
			sourceHandle: buildGuardSourceHandleId('isBattle'),
			target: 'template-1',
		});

		expect(next[1]?.config.dependsOn).toEqual(['guard-1']);
		expect(next[1]?.config.runConditions).toEqual([
			{
				type: 'guard_output',
				sourceOpId: 'guard-1',
				outputKey: 'isBattle',
				operator: 'is_true',
			},
		]);
	});

	it('removes guard condition edge and drops implicit dependency when no other condition remains', () => {
		const operations = applyConnectionToOperations([makeGuardOperation(), makeTemplateOperation()], {
			source: 'guard-1',
			sourceHandle: buildGuardSourceHandleId('isBattle'),
			target: 'template-1',
		});

		const next = removeEdgeFromOperations(operations, 'guard:guard-1:isBattle:is_true=>template-1');

		expect(next[1]?.config.runConditions).toEqual([]);
		expect(next[1]?.config.dependsOn).toEqual([]);
	});
});
