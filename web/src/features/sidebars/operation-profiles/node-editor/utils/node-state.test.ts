import { describe, expect, it } from 'vitest';

import { mergeOperationNodes } from './node-state';

import type { OperationFlowNodeData } from '../flow/operation-flow-node';
import type { Node } from '@xyflow/react';

function makeData(overrides: Partial<OperationFlowNodeData> = {}): OperationFlowNodeData {
	return {
		opId: 'op-1',
		name: 'Operation',
		description: '',
		kind: 'template',
		isEnabled: true,
		isRequired: false,
		guardOutputs: [],
		...overrides,
	};
}

describe('node editor node state merge', () => {
	it('preserves node identity when signature and position stay the same', () => {
		const data = makeData();
		const previous: Array<Node<OperationFlowNodeData>> = [
			{
				id: 'op-1',
				type: 'operation',
				position: { x: 10, y: 20 },
				data,
				measured: { width: 260, height: 80 },
			},
		];

		const result = mergeOperationNodes({
			previous,
			drafts: [{ opId: 'op-1', data: makeData(), signature: 'same' }],
			previousSignatures: new Map([['op-1', 'same']]),
			fallbackPositions: { 'op-1': { x: 0, y: 0 } },
		});

		expect(result.changed).toBe(false);
		expect(result.nodes[0]).toBe(previous[0]);
	});

	it('preserves React Flow measurement fields when node data changes', () => {
		const previous: Array<Node<OperationFlowNodeData>> = [
			{
				id: 'op-1',
				type: 'operation',
				position: { x: 10, y: 20 },
				data: makeData({ name: 'Before' }),
				measured: { width: 260, height: 80 },
				width: 260,
				height: 80,
			},
		];

		const result = mergeOperationNodes({
			previous,
			drafts: [{ opId: 'op-1', data: makeData({ name: 'After' }), signature: 'after' }],
			previousSignatures: new Map([['op-1', 'before']]),
			fallbackPositions: { 'op-1': { x: 0, y: 0 } },
		});

		expect(result.changed).toBe(true);
		expect(result.nodes[0]).not.toBe(previous[0]);
		expect(result.nodes[0]?.position).toEqual({ x: 10, y: 20 });
		expect(result.nodes[0]?.measured).toEqual({ width: 260, height: 80 });
		expect(result.nodes[0]?.width).toBe(260);
		expect(result.nodes[0]?.height).toBe(80);
		expect(result.nodes[0]?.data.name).toBe('After');
	});

	it('uses fallback positions only for new nodes', () => {
		const result = mergeOperationNodes({
			previous: [],
			drafts: [{ opId: 'op-1', data: makeData(), signature: 'new' }],
			previousSignatures: new Map(),
			fallbackPositions: { 'op-1': { x: 320, y: 160 } },
		});

		expect(result.changed).toBe(true);
		expect(result.nodes[0]?.position).toEqual({ x: 320, y: 160 });
	});
});
