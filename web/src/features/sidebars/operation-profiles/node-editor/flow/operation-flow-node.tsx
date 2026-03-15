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
		case 'legacy':
			return 'gray';
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
		updateNodeInternals(d.opId);
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
			}}
		>
			{/* dependsOn: incoming edges -> target handle on the left */}
			<Handle type="target" position={Position.Left} style={HANDLE_STYLE} />
			{hasDefaultSourceHandle(d) ? (
				<Handle id={DEFAULT_SOURCE_HANDLE_ID} type="source" position={Position.Right} style={HANDLE_STYLE} />
			) : null}

			<Stack gap={4}>
				<Group justify="space-between" wrap="nowrap" gap="xs">
					<Text fw={700} size="sm" lineClamp={1} style={{ minWidth: 0 }}>
						{d.name}
					</Text>
					<Badge size="sm" color={kindColor} variant="light">
						{d.kind}
					</Badge>
				</Group>

				<Group gap={6} wrap="wrap">
					<Badge size="sm" color={d.isEnabled ? 'green' : 'gray'} variant="light">
						{d.isEnabled ? 'enabled' : 'disabled'}
					</Badge>
					{d.isRequired && (
						<Badge size="sm" color="orange" variant="light">
							required
						</Badge>
					)}
				</Group>

				{d.description?.trim() ? (
					<Text size="xs" c="dimmed" lineClamp={3}>
						{d.description}
					</Text>
				) : null}

				{d.kind === 'guard' && d.guardOutputs.length > 0 ? (
					<Stack gap={8} pt={2}>
						{d.guardOutputs.map((output) => (
							<div
								key={output.key}
								style={{
									position: 'relative',
									minHeight: 22,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'flex-end',
									paddingRight: 18,
								}}
							>
								<Badge size="xs" color="teal" variant="light">
									{output.title || output.key}
								</Badge>
								<Handle
									id={buildGuardSourceHandleId(output.key)}
									type="source"
									position={Position.Right}
									style={{
										...GUARD_HANDLE_STYLE,
										top: '50%',
										right: -5,
										transform: 'translateY(-50%)',
									}}
								/>
							</div>
						))}
					</Stack>
				) : null}

				<Text size="xs" c="dimmed" lineClamp={1}>
					{d.opId}
				</Text>
			</Stack>
		</Paper>
	);
});

OperationFlowNode.displayName = 'OperationFlowNode';
