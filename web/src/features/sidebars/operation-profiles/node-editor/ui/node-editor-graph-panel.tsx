import { Button, Group, Select, Stack } from '@mantine/core';
import {
	Background,
	ConnectionLineType,
	Controls,
	type Connection,
	type Edge,
	type EdgeChange,
	type Node,
	type NodeChange,
	Panel,
	ReactFlow,
	ReactFlowProvider,
	type ReactFlowInstance,
} from '@xyflow/react';
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { LuPlus, LuTrash2 } from 'react-icons/lu';

import { OperationFlowNode, type OperationFlowNodeData } from '../flow/operation-flow-node';

import { GroupOverlays, type EditorGroup } from './group-overlays';

type Props = {
	flowWrapperRef: React.RefObject<HTMLDivElement | null>;
	nodes: Array<Node<OperationFlowNodeData>>;
	edges: Edge[];
	onInit: React.Dispatch<React.SetStateAction<ReactFlowInstance | null>>;
	onConnect: (connection: Connection) => void;
	onConnectStart: (
		event: unknown,
		params: { nodeId?: string | null; handleType?: 'source' | 'target' | null; handleId?: string | null },
	) => void;
	onConnectEnd: (event: MouseEvent | TouchEvent) => void;
	onEdgesChange: (changes: EdgeChange[]) => void;
	onNodesChange: (changes: NodeChange[]) => void;
	onNodeDragStop: (event: unknown, node: Node) => void;
	onSelectionChange: (selection: { nodes: Array<{ id: string | number }> }) => void;
	onNodeClick: (event: unknown, node: Node) => void;
	onPaneClick: () => void;
	groups: Record<string, EditorGroup>;
	selectedGroupId: string | null;
	groupBgAlpha: number;
	computeGroupBounds: (nodeIds: string[]) => { x: number; y: number; width: number; height: number } | null;
	onGroupLabelPointerDown: (event: React.PointerEvent, groupId: string) => void;
	onGroupLabelPointerMove: (event: React.PointerEvent) => void;
	onGroupLabelPointerUp: (event: React.PointerEvent, groupId: string) => void;
	onAddOperation: () => void;
	onDeleteSelected: () => void;
	onCreateGroup: () => void;
	selectedNodeCount: number;
	hasSelectedOperation: boolean;
	groupOptions: Array<{ value: string; label: string }>;
	onSelectedGroupChange: (value: string | null) => void;
	onUngroup: () => void;
};

const NODE_TYPES = { operation: OperationFlowNode };

export const NodeEditorGraphPanel: React.FC<Props> = memo(
	({
		flowWrapperRef,
		nodes,
		edges,
		onInit,
		onConnect,
		onConnectStart,
		onConnectEnd,
		onEdgesChange,
		onNodesChange,
		onNodeDragStop,
		onSelectionChange,
		onNodeClick,
		onPaneClick,
		groups,
		selectedGroupId,
		groupBgAlpha,
		computeGroupBounds,
		onGroupLabelPointerDown,
		onGroupLabelPointerMove,
		onGroupLabelPointerUp,
		onAddOperation,
		onDeleteSelected,
		onCreateGroup,
		selectedNodeCount,
		hasSelectedOperation,
		groupOptions,
		onSelectedGroupChange,
		onUngroup,
	}) => {
		const { t } = useTranslation();

		return (
			<div ref={flowWrapperRef} className="opProfileNodeEditorFlow opNodePanel" style={{ flex: 1, minHeight: 0 }}>
				<ReactFlowProvider>
					<ReactFlow
						nodes={nodes}
						edges={edges}
						nodeTypes={NODE_TYPES}
						connectionLineType={ConnectionLineType.SmoothStep}
						onInit={onInit}
						onConnect={onConnect}
						onConnectStart={onConnectStart}
						onConnectEnd={onConnectEnd}
						onEdgesChange={onEdgesChange}
						onNodesChange={onNodesChange}
						onNodeDragStop={onNodeDragStop}
						selectionOnDrag
						selectionKeyCode={['Shift']}
						multiSelectionKeyCode={['Control', 'Meta', 'Shift']}
						deleteKeyCode={null}
						onSelectionChange={onSelectionChange as never}
						onNodeClick={onNodeClick}
						onPaneClick={onPaneClick}
					>
						<Background />
						<Controls />
						<GroupOverlays
							groups={groups}
							selectedGroupId={selectedGroupId}
							groupBgAlpha={groupBgAlpha}
							computeBounds={computeGroupBounds}
							onLabelPointerDown={onGroupLabelPointerDown}
							onLabelPointerMove={onGroupLabelPointerMove}
							onLabelPointerUp={onGroupLabelPointerUp}
						/>
						<Panel position="top-left">
							<Stack gap={6} className="opNodeToolbar">
								<Group gap="xs" wrap="nowrap">
									<Button size="xs" leftSection={<LuPlus />} onClick={onAddOperation}>
										{t('common.add')}
									</Button>
									<Button
										size="xs"
										color="red"
										variant="light"
										leftSection={<LuTrash2 />}
										disabled={selectedNodeCount === 0 && !hasSelectedOperation}
										onClick={onDeleteSelected}
									>
										{t('common.delete')}
									</Button>
									<Button size="xs" variant="light" disabled={selectedNodeCount < 2} onClick={onCreateGroup}>
										{t('operationProfiles.actions.group')}
									</Button>
								</Group>

								<Group gap="xs" wrap="nowrap">
									<Select
										size="xs"
										placeholder={t('operationProfiles.nodeEditor.groupsPlaceholder')}
										data={groupOptions}
										value={selectedGroupId ?? ''}
										onChange={(value) => onSelectedGroupChange(value && value !== '' ? value : null)}
										comboboxProps={{ withinPortal: false }}
										style={{ minWidth: 200 }}
									/>
									<Button size="xs" variant="default" disabled={!selectedGroupId} onClick={onUngroup}>
										{t('operationProfiles.actions.ungroup')}
									</Button>
								</Group>
							</Stack>
						</Panel>
					</ReactFlow>
				</ReactFlowProvider>
			</div>
		);
	},
);

NodeEditorGraphPanel.displayName = 'NodeEditorGraphPanel';
