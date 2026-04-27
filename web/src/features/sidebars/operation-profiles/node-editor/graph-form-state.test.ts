import { describe, expect, it } from 'vitest';

import { buildGraphOperations, buildGraphWatchPaths } from './graph-form-state';

describe('graph-form-state', () => {
	it('builds narrow watch paths for graph projection', () => {
		expect(buildGraphWatchPaths(2)).toEqual([
			'operations.0.name',
			'operations.0.description',
			'operations.0.kind',
			'operations.0.config.enabled',
			'operations.0.config.required',
			'operations.0.config.dependsOn',
			'operations.0.config.runConditions',
			'operations.0.config.params.outputContract',
			'operations.1.name',
			'operations.1.description',
			'operations.1.kind',
			'operations.1.config.enabled',
			'operations.1.config.required',
			'operations.1.config.dependsOn',
			'operations.1.config.runConditions',
			'operations.1.config.params.outputContract',
		]);
	});

	it('normalizes graph operations and keeps guard output contract only for guards', () => {
		const operations = buildGraphOperations(
			[{ opId: 'guard-1' }, { opId: 'llm-1' }],
			[
				'Guard',
				'Checks context',
				'guard',
				true,
				false,
				['root'],
				[{ type: 'guard_output', sourceOpId: 'root', outputKey: 'battle', operator: 'is_true' }],
				[{ key: 'battle', title: 'Battle' }],
				'LLM',
				'Writes text',
				'llm',
				false,
				true,
				['guard-1'],
				[{ type: 'invalid', sourceOpId: 'guard-1' }],
				[{ key: 'ignored', title: 'Ignored' }],
			],
		);

		expect(operations).toEqual([
			{
				opId: 'guard-1',
				name: 'Guard',
				description: 'Checks context',
				kind: 'guard',
				config: {
					enabled: true,
					required: false,
					dependsOn: ['root'],
					runConditions: [{ type: 'guard_output', sourceOpId: 'root', outputKey: 'battle', operator: 'is_true' }],
					params: { outputContract: [{ key: 'battle', title: 'Battle' }] },
				},
			},
			{
				opId: 'llm-1',
				name: 'LLM',
				description: 'Writes text',
				kind: 'llm',
				config: {
					enabled: false,
					required: true,
					dependsOn: ['guard-1'],
					runConditions: [],
					params: {},
				},
			},
		]);
	});
});
