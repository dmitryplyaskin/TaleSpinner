import { Badge, Group, Paper, Stack, Text } from '@mantine/core';
import { Handle, Position, type NodeProps, useUpdateNodeInternals } from '@xyflow/react';
import React, { memo, useLayoutEffect } from 'react';

import { buildGuardSourceHandleId, DEFAULT_SOURCE_HANDLE_ID } from '../operation-graph';

import { getOperationFlowNodeMinHeight, hasDefaultSourceHandle } from './operation-flow-node-model';

export type OperationFlowNodeData = {
	opId: string;
	name: string;
	description?: string;
	kind: string;
	isEnabled: boolean;
	isRequired: boolean;
	guardOutputs: Array<{ key: string; title: string }>;
};

const NODE_WIDTH = 260;
const HANDLE_STYLE: React.CSSProperties = { width: 10, height: 10, border: '2px solid var(--mantine-color-blue-6)' };
const GUARD_HANDLE_STYLE: React.CSSProperties = { ...HANDLE_STYLE, border: '2px solid var(--mantine-color-teal-6)' };

function getKindColor(kind: string): string {
	switch (kind) {
		case 'template':
			return 'blue';
		case 'llm':
			return 'teal';
		case 'guard':
			return 'lime';
		case 'rag':
			return 'grape';
		case 'tool':
			return 'orange';
		case 'compute':
			return 'cyan';
		case 'transform':
			return 'indigo';
		default:
			return 'blue';
	}
}

export const OperationFlowNode: React.FC<NodeProps> = memo(({ data, selected }) => {
	const d = data as OperationFlowNodeData;
	const kindColor = getKindColor(d.kind);
	const updateNodeInternals = useUpdateNodeInternals();
	const guardOutputsSignature = d.guardOutputs.map((output) => `${output.key}:${output.title}`).join('|');

	useLayoutEffect(() => {
		const frameId = window.requestAnimationFrame(() => {
			updateNodeInternals(d.opId);
		});
		return () => window.cancelAnimationFrame(frameId);
	}, [d.opId, d.kind, guardOutputsSignature, updateNodeInternals]);

	return (
		<Paper
			withBorder
			shadow={selected ? 'md' : 'sm'}
			radius="md"
			p="sm"
			style={{
				width: NODE_WIDTH,
				minHeight: getOperationFlowNodeMinHeight(d),
				position: 'relative',
				borderWidth: selected ? 2 : 1,
				borderColor: selected ? 'var(--mantine-color-blue-6)' : undefined,
				opacity: d.isEnabled ? 1 : 0.72,
			}}
		>
			{/* dependsOn: incoming edges -> target handle on the left */}
			<Handle type="target" position={Position.Left} style={HANDLE_STYLE} />
			{hasDefaultSourceHandle(d) ? (
				<Handle id={DEFAULT_SOURCE_HANDLE_ID} type="source" position={Position.Right} style={HANDLE_STYLE} />
			) : null}

			<Stack gap={8}>
				<Group justify="space-between" wrap="nowrap" gap="xs">
					<Text fw={700} size="sm" lineClamp={1} style={{ minWidth: 0 }}>
						{d.name}
					</Text>
					<Badge size="sm" color={kindColor} variant="light">
						{d.kind}
					</Badge>
				</Group>

				{d.description?.trim() ? (
					<Text size="xs" c="dimmed" lineClamp={2}>
						{d.description}
					</Text>
				) : null}

				{d.kind === 'guard' && d.guardOutputs.length > 0 ? (
					<Stack gap={10}>
						{d.guardOutputs.map((output) => (
							<div
								key={output.key}
								style={{
									position: 'relative',
									minHeight: 28,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'flex-end',
									paddingRight: 20,
								}}
							>
								<Badge size="sm" color="teal" variant="light">
									{output.title || output.key}
								</Badge>
								<Handle
									id={buildGuardSourceHandleId(output.key)}
									type="source"
									position={Position.Right}
									style={{
										...GUARD_HANDLE_STYLE,
										top: '50%',
										right: -6,
										transform: 'translateY(-50%)',
									}}
								/>
							</div>
						))}
					</Stack>
				) : null}
			</Stack>
		</Paper>
	);
});

OperationFlowNode.displayName = 'OperationFlowNode';
