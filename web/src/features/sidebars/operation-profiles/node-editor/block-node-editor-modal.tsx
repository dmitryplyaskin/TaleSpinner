import '@xyflow/react/dist/style.css';
import './node-editor-modal.css';

import { Alert, Divider, Group, Modal, SegmentedControl, Stack } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { type Node } from '@xyflow/react';
import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
	type FieldArrayWithId,
	FormProvider,
	useWatch,
	type UseFieldArrayAppend,
	type UseFieldArrayReplace,
	type UseFormReturn,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Z_INDEX } from '@ui/z-index';

import { type OperationProfileFormValues } from '../form/operation-profile-form-mapping';

import { buildOperationFlowNodeData, buildOperationFlowNodeSignature } from './flow/operation-flow-node-model';
import { buildGraphOperations, buildGraphWatchPaths } from './graph-form-state';
import { useNodeEditorActions } from './hooks/use-node-editor-actions';
import { useNodeEditorFlowState } from './hooks/use-node-editor-flow-state';
import { useNodeEditorGroups } from './hooks/use-node-editor-groups';
import { readNodeEditorMeta, writeNodeEditorMeta } from './meta/node-editor-meta';
import { buildOperationGraphEdges } from './operation-graph';
import { GroupEditorModal } from './ui/group-editor-modal';
import { NodeEditorContextMenu } from './ui/node-editor-context-menu';
import { NodeEditorFormHeader } from './ui/node-editor-form-header';
import { NodeEditorGraphPanel } from './ui/node-editor-graph-panel';
import { NodeEditorHelpModal } from './ui/node-editor-help-modal';
import { NodeEditorInspectorPanel } from './ui/node-editor-inspector-panel';
import { addOperationNamesToErrorMessage } from './utils/operation-error-message';

import type { OperationFlowNodeData } from './flow/operation-flow-node';
import type { OperationBlockDto } from '../../../../api/chat-core';
import type { NodeEditorViewState } from '../ui/types';

type Props = {
	opened: boolean;
	onClose: () => void;
	block: OperationBlockDto;
	form: UseFormReturn<OperationProfileFormValues>;
	operationsFieldArray: {
		fields: Array<FieldArrayWithId<OperationProfileFormValues, 'operations', '_key'>>;
		append: UseFieldArrayAppend<OperationProfileFormValues, 'operations'>;
		replace: UseFieldArrayReplace<OperationProfileFormValues, 'operations'>;
	};
	initialValues: OperationProfileFormValues;
	onSaveDraft: (values: OperationProfileFormValues, meta?: unknown) => Promise<void>;
};

const GROUP_BG_ALPHA = 0.08;

function extractOpIds(values: OperationProfileFormValues): string[] {
	return values.operations.map((o) => o.opId).filter(Boolean);
}

export const OperationBlockNodeEditorModal: React.FC<Props> = ({
	opened,
	onClose,
	block,
	form: methods,
	operationsFieldArray,
	initialValues,
	onSaveDraft,
}) => {
	const { t } = useTranslation();
	const isCompactLayout = useMediaQuery('(max-width: 1024px)');

	const { control, reset: resetForm } = methods;
	const { fields, append, replace } = operationsFieldArray;

	const [jsonError, setJsonError] = useState<string | null>(null);
	const [isLayoutDirty, setIsLayoutDirty] = useState(false);
	const [isHelpOpen, setIsHelpOpen] = useState(false);
	const [viewState, setViewState] = useState<NodeEditorViewState>('graph');
	const [isInspectorVisible, setIsInspectorVisible] = useState(true);

	const graphWatchPaths = useMemo(() => buildGraphWatchPaths(fields.length), [fields.length]);
	const graphWatchValues = useWatch({ control, name: graphWatchPaths as any }) as unknown[] | undefined;
	const graphOperations = useMemo(() => buildGraphOperations(fields, graphWatchValues), [fields, graphWatchValues]);
	const deferredGraphOperations = useDeferredValue(graphOperations);
	const nodeDrafts = useMemo(
		() =>
			deferredGraphOperations.map((operation) => {
				const data = buildOperationFlowNodeData(operation);
				return {
					opId: operation.opId,
					data,
					signature: buildOperationFlowNodeSignature(data),
				};
			}),
		[deferredGraphOperations],
	);
	const opIndexById = useMemo(() => new Map(fields.map((field, idx) => [String(field.opId), idx])), [fields]);
	const edges = useMemo(() => buildOperationGraphEdges(deferredGraphOperations), [deferredGraphOperations]);
	const {
		flow,
		setFlow,
		flowWrapperRef,
		nodes,
		setNodes,
		nodesRef,
		onNodesChange,
		resetNodesFromInitialValues,
		runAutoLayout,
		isAutoLayouting,
	} = useNodeEditorFlowState({
		opened,
		blockId: block.blockId,
		blockMeta: block.meta,
		initialValues,
		nodeDrafts,
		edges,
		onDirty: () => setIsLayoutDirty(true),
	});
	const nodesById = useMemo(() => {
		const out = new Map<string, Node<OperationFlowNodeData>>();
		for (const node of nodes) out.set(String(node.id), node);
		return out;
	}, [nodes]);
	const {
		groups,
		resetGroups,
		selectedGroupId,
		setSelectedGroupId,
		groupEditor,
		setGroupEditor,
		groupSelectData,
		computeGroupBounds,
		groupLabelDrag,
		createGroupFromSelection,
		ungroupSelectedAction,
		deleteGroup,
		saveGroup,
	} = useNodeEditorGroups({
		flow,
		nodes,
		nodesById,
		nodesRef,
		setNodes,
		onDirty: () => setIsLayoutDirty(true),
	});
	const {
		selectedOpId,
		selectedNodeIds,
		contextMenu,
		resetActionState,
		addOperation,
		deleteSelectedAction,
		openPaneContextMenu,
		openNodeContextMenu,
		openEdgeContextMenu,
		createOperationFromContext,
		deleteNodeFromContext,
		deleteEdgeFromContext,
		insertOperationFromEdgeContext,
		onConnect,
		onConnectStart,
		onConnectEnd,
		onEdgesChange,
		onSelectionChange,
		onNodeClick,
		onPaneClick,
		onNodeDragStop,
	} = useNodeEditorActions({
		opened,
		isCompactLayout,
		flow,
		flowWrapperRef,
		fieldsLength: fields.length,
		append,
		replace,
		methods,
		edges,
		nodesById,
		setNodes,
		setViewState,
		setIsInspectorVisible,
		onDirty: () => setIsLayoutDirty(true),
	});

	useEffect(() => {
		if (!opened) return;
		setJsonError(null);
		resetActionState();
		resetGroups(readNodeEditorMeta(block.meta)?.groups ?? {});
		setIsLayoutDirty(false);
		setViewState('graph');
		setIsInspectorVisible(true);
	}, [opened, block.blockId, block.meta, resetActionState, resetGroups]);

	const resetToInitialState = useCallback(() => {
		setJsonError(null);
		resetForm(initialValues);
		resetActionState();
		resetGroups(readNodeEditorMeta(block.meta)?.groups ?? {});
		setIsLayoutDirty(false);
		setViewState('graph');
		setIsInspectorVisible(true);
		resetNodesFromInitialValues();
	}, [block.meta, initialValues, resetActionState, resetForm, resetGroups, resetNodesFromInitialValues]);

	const selectedIndex = selectedOpId ? (opIndexById.get(selectedOpId) ?? null) : null;

	const onSave = methods.handleSubmit(async (values) => {
		setJsonError(null);
		try {
			const nodesMap: Record<string, { x: number; y: number }> = {};
			for (const n of nodes) {
				nodesMap[String(n.id)] = { x: n.position.x, y: n.position.y };
			}
			const allowedIds = new Set(extractOpIds(values));
			const groupsToSave: Record<string, { name: string; nodeIds: string[]; bg?: string }> = {};
			for (const [groupId, g] of Object.entries(groups)) {
				const name = (g?.name ?? '').trim();
				const nodeIds = Array.isArray(g?.nodeIds) ? g.nodeIds.filter((id) => allowedIds.has(id)) : [];
				if (!groupId || !name || nodeIds.length === 0) continue;
				const bg = typeof g?.bg === 'string' && g.bg.trim() ? g.bg.trim() : undefined;
				groupsToSave[groupId] = { name, nodeIds: [...new Set(nodeIds)], bg };
			}
			const nodeEditorMeta = {
				version: 1 as const,
				nodes: nodesMap,
				groups: Object.keys(groupsToSave).length ? groupsToSave : undefined,
				viewport: flow?.getViewport(),
			};
			await onSaveDraft(values, writeNodeEditorMeta(block.meta, nodeEditorMeta));
			setIsLayoutDirty(false);
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			setJsonError(addOperationNamesToErrorMessage(message, values.operations));
		}
	});

	const createSelectedGroupAction = useCallback(() => {
		createGroupFromSelection(selectedNodeIds);
	}, [createGroupFromSelection, selectedNodeIds]);

	const showGraphPanel = !isCompactLayout || viewState === 'graph';
	const showInspectorPanel = isCompactLayout ? viewState === 'inspector' : isInspectorVisible;

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			fullScreen
			withCloseButton={false}
			zIndex={Z_INDEX.overlay.modal}
			padding={0}
			styles={{
				content: { height: '100dvh' },
				body: { height: '100dvh', padding: 16, display: 'flex', flexDirection: 'column' },
			}}
		>
			<FormProvider {...methods}>
				<Stack gap="sm" style={{ flex: 1, minHeight: 0 }} className="opNodeShell">
					<NodeEditorFormHeader
						profileName={block.name}
						isLayoutDirty={isLayoutDirty}
						onAutoLayout={runAutoLayout}
						isAutoLayouting={isAutoLayouting}
						onSave={onSave}
						onClose={onClose}
						onOpenHelp={() => setIsHelpOpen(true)}
						isInspectorVisible={isInspectorVisible}
						onToggleInspector={() => setIsInspectorVisible((prev) => !prev)}
						showInspectorToggle={!isCompactLayout}
					/>

					{jsonError && (
						<Alert color="red" title={t('operationProfiles.nodeEditor.jsonError')}>
							{jsonError}
						</Alert>
					)}

					{isCompactLayout && (
						<SegmentedControl
							className="opNodeMobileSegment"
							fullWidth
							value={viewState}
							onChange={(next) => setViewState(next as NodeEditorViewState)}
							data={[
								{ value: 'graph', label: t('operationProfiles.nodeEditor.graphTab') },
								{ value: 'inspector', label: t('operationProfiles.nodeEditor.inspectorTab') },
							]}
						/>
					)}

					<Group gap={0} wrap="nowrap" align="stretch" style={{ flex: 1, minHeight: 0 }}>
						{showGraphPanel && (
							<NodeEditorGraphPanel
								flowWrapperRef={flowWrapperRef}
								nodes={nodes}
								edges={edges}
								onInit={setFlow}
								onConnect={onConnect}
								onConnectStart={onConnectStart}
								onConnectEnd={onConnectEnd}
								onEdgesChange={onEdgesChange}
								onNodesChange={onNodesChange}
								onNodeDragStop={onNodeDragStop}
								onSelectionChange={onSelectionChange}
								onNodeClick={onNodeClick}
								onNodeContextMenu={openNodeContextMenu}
								onEdgeContextMenu={openEdgeContextMenu}
								onPaneContextMenu={openPaneContextMenu}
								onPaneClick={onPaneClick}
								groups={groups}
								selectedGroupId={selectedGroupId}
								groupBgAlpha={GROUP_BG_ALPHA}
								computeGroupBounds={computeGroupBounds}
								onGroupLabelPointerDown={groupLabelDrag.onPointerDown}
								onGroupLabelPointerMove={groupLabelDrag.onPointerMove}
								onGroupLabelPointerUp={groupLabelDrag.onPointerUp}
								onAddOperation={addOperation}
								onDeleteSelected={deleteSelectedAction}
								onCreateGroup={createSelectedGroupAction}
								selectedNodeCount={selectedNodeIds.length}
								hasSelectedOperation={Boolean(selectedOpId)}
								groupOptions={groupSelectData}
								onSelectedGroupChange={setSelectedGroupId}
								onUngroup={ungroupSelectedAction}
							/>
						)}

						{showInspectorPanel && (
							<>
								{!isCompactLayout && <Divider orientation="vertical" mx="md" />}

								<NodeEditorInspectorPanel
									selectedIndex={selectedIndex}
									selectedOpId={selectedOpId}
									selectedKind={graphOperations[selectedIndex ?? -1]?.kind ?? 'template'}
									isCompactLayout={isCompactLayout}
									isLayoutDirty={isLayoutDirty}
									onSave={onSave}
									onDiscard={resetToInitialState}
									onRemove={deleteSelectedAction}
								/>
							</>
						)}
					</Group>

					{contextMenu && (
						<NodeEditorContextMenu
							state={contextMenu}
							onCreateOperation={createOperationFromContext}
							onDeleteNode={deleteNodeFromContext}
							onDeleteEdge={deleteEdgeFromContext}
							onInsertOperation={insertOperationFromEdgeContext}
						/>
					)}
				</Stack>

				<GroupEditorModal
					draft={groupEditor}
					onClose={() => setGroupEditor(null)}
					onDelete={deleteGroup}
					onSave={saveGroup}
				/>

				<NodeEditorHelpModal opened={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
			</FormProvider>
		</Modal>
	);
};
