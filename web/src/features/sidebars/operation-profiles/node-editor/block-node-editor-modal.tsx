import '@xyflow/react/dist/style.css';
import './node-editor-modal.css';

import { Alert, Divider, Group, Modal, SegmentedControl, Stack } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
	type EdgeChange,
	type Node,
	type NodeChange,
	type Connection,
	type ReactFlowInstance,
	useNodesState,
} from '@xyflow/react';
import { useUnit } from 'effector-react';
import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { FormProvider, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';

import { updateOperationBlockFx } from '@model/operation-blocks';
import { Z_INDEX } from '@ui/z-index';

import {
	fromOperationProfileForm,
	makeDefaultOperation,
	toOperationProfileForm,
	type OperationProfileFormValues,
} from '../form/operation-profile-form-mapping';

import { buildOperationFlowNodeData, buildOperationFlowNodeSignature } from './flow/operation-flow-node-model';
import { buildGraphOperations, buildGraphWatchPaths } from './graph-form-state';
import { useGroupLabelDrag } from './hooks/use-group-label-drag';
import { computeSimpleLayout, readNodeEditorMeta, writeNodeEditorMeta } from './meta/node-editor-meta';
import {
	applyConnectionToOperations,
	buildOperationGraphEdges,
	connectSourceToOperation,
	removeEdgeFromOperations,
	removeOperationReferences,
} from './operation-graph';
import { GroupEditorModal, type GroupEditorDraft } from './ui/group-editor-modal';
import { NodeEditorFormHeader } from './ui/node-editor-form-header';
import { NodeEditorGraphPanel } from './ui/node-editor-graph-panel';
import { NodeEditorInspectorPanel } from './ui/node-editor-inspector-panel';
import { computeBoundsFromNodes } from './utils/bounds';
import { DEFAULT_GROUP_COLOR_HEX, normalizeCssColorToOpaqueRgbString } from './utils/color';

import type { OperationFlowNodeData } from './flow/operation-flow-node';
import type { EditorGroup } from './ui/group-overlays';
import type { OperationBlockDto, OperationProfileDto } from '../../../../api/chat-core';
import type { NodeEditorViewState } from '../ui/types';

type Props = {
	opened: boolean;
	onClose: () => void;
	block: OperationBlockDto;
};

type OpEdge = { source: string; target: string };
type PendingConnection = { sourceId: string; sourceHandle: string | null };

const GROUP_BG_ALPHA = 0.08;

function edgesToDeps(edges: Array<{ source: string; target: string }>): OpEdge[] {
	return edges.map((e) => ({ source: e.source, target: e.target }));
}

function extractOpIds(values: OperationProfileFormValues): string[] {
	return values.operations.map((o) => o.opId).filter(Boolean);
}

function isTextEditingTarget(target: EventTarget | null): boolean {
	if (!target || !(target instanceof HTMLElement)) return false;
	if (target.isContentEditable) return true;
	const tag = target.tagName.toLowerCase();
	if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
	return Boolean(target.closest?.('[contenteditable="true"]'));
}

function toFormValuesFromBlock(block: OperationBlockDto): OperationProfileFormValues {
	return toOperationProfileForm({
		profileId: block.blockId,
		ownerId: block.ownerId,
		name: block.name,
		description: block.description,
		enabled: block.enabled,
		executionMode: 'sequential',
		operationProfileSessionId: '00000000-0000-0000-0000-000000000000',
		blockRefs: [],
		operations: block.operations,
		meta: block.meta,
		version: block.version,
		createdAt: block.createdAt,
		updatedAt: block.updatedAt,
	} satisfies OperationProfileDto);
}

export const OperationBlockNodeEditorModal: React.FC<Props> = ({ opened, onClose, block }) => {
	const { t } = useTranslation();
	const doUpdate = useUnit(updateOperationBlockFx);
	const isCompactLayout = useMediaQuery('(max-width: 1024px)');

	const initial = useMemo(() => toFormValuesFromBlock(block), [block]);
	const methods = useForm<OperationProfileFormValues>({ defaultValues: initial });
	const { control, reset: resetForm } = methods;

	const { fields, append, replace } = useFieldArray({ name: 'operations', control, keyName: '_key' });

	const [selectedOpId, setSelectedOpId] = useState<string | null>(null);
	const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
	const [groups, setGroups] = useState<Record<string, EditorGroup>>({});
	const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
	const [jsonError, setJsonError] = useState<string | null>(null);
	const [isLayoutDirty, setIsLayoutDirty] = useState(false);
	const [flow, setFlow] = useState<ReactFlowInstance | null>(null);
	const [groupEditor, setGroupEditor] = useState<GroupEditorDraft | null>(null);
	const [viewState, setViewState] = useState<NodeEditorViewState>('graph');
	const [isInspectorVisible, setIsInspectorVisible] = useState(true);

	const connectingSourceRef = useRef<PendingConnection | null>(null);
	const didConnectRef = useRef(false);
	const prevNodeIdsKeyRef = useRef<string>('');
	const flowWrapperRef = useRef<HTMLDivElement | null>(null);
	const nodesRef = useRef<Array<Node<OperationFlowNodeData>>>([]);
	const [nodes, setNodes, onNodesChangeBase] = useNodesState<Node<OperationFlowNodeData>>([]);

	const resetToInitialState = useCallback(() => {
		setJsonError(null);
		resetForm(initial);
		setSelectedOpId(null);
		setSelectedNodeIds([]);
		const metaGroups = readNodeEditorMeta(block.meta)?.groups ?? {};
		setGroups(metaGroups);
		setSelectedGroupId(null);
		setGroupEditor(null);
		setIsLayoutDirty(false);
		setViewState('graph');
		setIsInspectorVisible(true);

		const meta = readNodeEditorMeta(block.meta);
		const resetEdges = buildOperationGraphEdges(initial.operations);
		const resetFallbackPositions = computeSimpleLayout(extractOpIds(initial), edgesToDeps(resetEdges));
		const nextNodes: Array<Node<OperationFlowNodeData>> = initial.operations.map((op) => {
			const pos = meta?.nodes?.[op.opId] ?? resetFallbackPositions[op.opId] ?? { x: 0, y: 0 };
			return {
				id: op.opId,
				type: 'operation',
				position: pos,
				zIndex: Z_INDEX.flow.node,
				data: buildOperationFlowNodeData(op),
			};
		});
		setNodes(nextNodes);
	}, [initial, block.meta, resetForm, setNodes]);

	useEffect(() => {
		resetToInitialState();
	}, [resetToInitialState]);

	const areStringArraysEqual = useCallback((a: string[], b: string[]) => {
		if (a === b) return true;
		if (a.length !== b.length) return false;
		for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
		return true;
	}, []);

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
	const fallbackPositions = useMemo(
		() => computeSimpleLayout(nodeDrafts.map((draft) => draft.opId), edgesToDeps(edges)),
		[nodeDrafts, edges],
	);
	useEffect(() => {
		nodesRef.current = nodes;
	}, [nodes]);

	// Initialize nodes on open / profile change.
	useEffect(() => {
		if (!opened) return;
		const meta = readNodeEditorMeta(block.meta);
		const initialNodes: Array<Node<OperationFlowNodeData>> = nodeDrafts.map((draft) => {
			const pos = meta?.nodes?.[draft.opId] ?? fallbackPositions[draft.opId] ?? { x: 0, y: 0 };
			return {
				id: draft.opId,
				type: 'operation',
				position: pos,
				zIndex: Z_INDEX.flow.node,
				data: draft.data,
			};
		});
		setNodes(initialNodes);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [opened, block.blockId]);

	useEffect(() => {
		if (!opened) return;
		setIsInspectorVisible(true);
	}, [opened, block.blockId]);

	// Keep node data in sync with form, but preserve positions while dragging.
	useEffect(() => {
		if (!opened) return;
		setNodes((prev) => {
			const prevById = new Map(prev.map((n) => [String(n.id), n]));
			const next = nodeDrafts.map((draft) => {
				const existing = prevById.get(draft.opId);

				// Important: preserve measured/width/height/etc that ReactFlow stores in node state.
				// Otherwise ReactFlow will keep re-measuring and emitting node changes, which can cause
				// mount-time update loops ("Maximum update depth exceeded").
				return {
					...(existing ?? {}),
					id: draft.opId,
					type: 'operation',
					position: existing?.position ?? fallbackPositions[draft.opId] ?? { x: 0, y: 0 },
					zIndex: existing?.zIndex ?? Z_INDEX.flow.node,
					data: draft.data,
				} satisfies Node<OperationFlowNodeData>;
			});

			// Avoid pointless state updates (helps prevent feedback loops).
			if (prev.length === next.length) {
				let same = true;
				for (let i = 0; i < next.length; i++) {
					const a = prev[i];
					const b = next[i];
					if (!a || !b) {
						same = false;
						break;
					}
					if (String(a.id) !== String(b.id)) {
						same = false;
						break;
					}
					if ((a.type ?? '') !== (b.type ?? '')) {
						same = false;
						break;
					}
					if ((a.position?.x ?? 0) !== (b.position?.x ?? 0) || (a.position?.y ?? 0) !== (b.position?.y ?? 0)) {
						same = false;
						break;
					}
					if (nodeDrafts[i]?.signature !== buildOperationFlowNodeSignature(a.data as OperationFlowNodeData)) {
						same = false;
						break;
					}
				}
				if (same) return prev;
			}

			return next;
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [opened, nodeDrafts, fallbackPositions]);

	const selectedIndex = selectedOpId ? (opIndexById.get(selectedOpId) ?? null) : null;

	const onSave = methods.handleSubmit(async (values) => {
		setJsonError(null);
		try {
			const payload = fromOperationProfileForm(values, { validateJson: true });
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
			};
			const updatedBlock = await doUpdate({
				blockId: block.blockId,
				patch: {
					name: payload.name,
					description: payload.description,
					enabled: payload.enabled,
					operations: payload.operations,
					meta: writeNodeEditorMeta(block.meta, nodeEditorMeta),
				},
			});
			resetForm(toFormValuesFromBlock(updatedBlock));
			setIsLayoutDirty(false);
		} catch (e) {
			setJsonError(e instanceof Error ? e.message : String(e));
		}
	});

	const addOperation = useCallback(() => {
		const next = makeDefaultOperation();
		append(next);

		let position = { x: 0, y: fields.length * 160 };
		if (flow && flowWrapperRef.current) {
			const r = flowWrapperRef.current.getBoundingClientRect();
			const center = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
			const p = (flow as any).screenToFlowPosition ? (flow as any).screenToFlowPosition(center) : null;
			if (p && typeof p.x === 'number' && typeof p.y === 'number') position = { x: p.x, y: p.y };
		}
		setNodes((prev) => [
			...prev,
			{
				id: next.opId,
				type: 'operation',
				position,
				zIndex: Z_INDEX.flow.node,
				data: buildOperationFlowNodeData(next),
			},
		]);
		setIsLayoutDirty(true);
		setSelectedOpId(next.opId);
		if (isCompactLayout) setViewState('inspector');
		else setIsInspectorVisible(true);
	}, [append, fields.length, flow, isCompactLayout, setNodes]);

	const deleteSelectedNodes = useCallback(() => {
		const ids = selectedNodeIds.length ? selectedNodeIds : selectedOpId ? [selectedOpId] : [];
		if (ids.length === 0) return;

		let current = methods.getValues();
		for (const removedOpId of ids) {
			current = {
				...current,
				operations: removeOperationReferences(current.operations, removedOpId),
			};
		}
		const nextOps = current.operations.filter((op) => !ids.includes(op.opId));
		replace(nextOps);

		setNodes((prev) => prev.filter((n) => !ids.includes(String(n.id))));
		setIsLayoutDirty(true);

		setSelectedNodeIds((prev) => prev.filter((id) => !ids.includes(id)));
		setSelectedOpId((prev) => (prev && ids.includes(prev) ? null : prev));
	}, [methods, replace, selectedNodeIds, selectedOpId, setNodes]);

	// Keyboard delete (Delete / Backspace) — but do not interfere with typing in inputs.
	useEffect(() => {
		if (!opened) return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.defaultPrevented) return;
			if (isTextEditingTarget(e.target)) return;
			if (e.key !== 'Delete' && e.key !== 'Backspace') return;
			deleteSelectedNodes();
			e.preventDefault();
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [opened, deleteSelectedNodes]);

	const createGroupFromSelection = useCallback(() => {
		const ids = [...new Set(selectedNodeIds)].filter(Boolean);
		if (ids.length < 2) return;
		const suggestedName = t('operationProfiles.nodeEditor.groupNameDefault', { index: Object.keys(groups).length + 1 });
		const name = window.prompt(t('operationProfiles.nodeEditor.groupNamePrompt'), suggestedName);
		if (!name || !name.trim()) return;
		const groupId = uuidv4();
		setGroups((prev) => ({ ...prev, [groupId]: { name: name.trim(), nodeIds: ids } }));
		setSelectedGroupId(groupId);
		setIsLayoutDirty(true);
	}, [groups, selectedNodeIds, t]);

	const ungroupSelected = useCallback(() => {
		if (!selectedGroupId) return;
		setGroups((prev) => {
			if (!prev[selectedGroupId]) return prev;
			const { [selectedGroupId]: _removed, ...rest } = prev;
			return rest;
		});
		setSelectedGroupId(null);
		setGroupEditor((prev) => (prev?.groupId === selectedGroupId ? null : prev));
		setIsLayoutDirty(true);
	}, [selectedGroupId]);

	const groupSelectData = useMemo(
		() => Object.entries(groups).map(([value, g]) => ({ value, label: g.name })),
		[groups],
	);

	const nodesById = useMemo(() => {
		const out = new Map<string, Node<OperationFlowNodeData>>();
		for (const node of nodes) out.set(String(node.id), node);
		return out;
	}, [nodes]);

	const computeGroupBounds = useCallback(
		(nodeIds: string[]) => {
			const live: Array<Node<OperationFlowNodeData>> = [];
			for (const nodeId of nodeIds) {
				const node = nodesById.get(nodeId);
				if (node) live.push(node);
			}
			return computeBoundsFromNodes(live);
		},
		[nodesById],
	);

	const openGroupEditor = useCallback(
		(groupId: string) => {
			const g = groups[groupId];
			if (!g) return;
			setSelectedGroupId(groupId);
			setGroupEditor({
				groupId,
				name: (g.name ?? '').trim(),
				bg: typeof g.bg === 'string' ? g.bg : '',
			});
		},
		[groups],
	);

	const groupLabelDrag = useGroupLabelDrag({
		flow,
		groups,
		nodesRef,
		setNodes,
		onSelectGroup: (groupId) => setSelectedGroupId(groupId),
		onOpenGroupEditor: openGroupEditor,
		markLayoutDirty: () => setIsLayoutDirty(true),
	});

	// Keep groups consistent when nodes are removed.
	useEffect(() => {
		// Important: avoid pruning while nodes are still initializing (prevents mount-time loops).
		if (nodes.length === 0) return;
		const nodeIdsKey = nodes.map((n) => String(n.id)).join('\u001f');
		if (prevNodeIdsKeyRef.current === nodeIdsKey) return;
		prevNodeIdsKeyRef.current = nodeIdsKey;

		const existing = new Set(nodes.map((n) => String(n.id)));

		setGroups((prev) => {
			const pruned: Record<string, EditorGroup> = {};
			for (const [groupId, g] of Object.entries(prev)) {
				const name = (g?.name ?? '').trim();
				const nodeIds = Array.isArray(g?.nodeIds) ? g.nodeIds.filter((id) => existing.has(id)) : [];
				if (!groupId || !name || nodeIds.length === 0) continue;
				const bg = typeof g?.bg === 'string' && g.bg.trim() ? g.bg.trim() : undefined;
				pruned[groupId] = { name, nodeIds: [...new Set(nodeIds)], bg };
			}

			const sameKeys = Object.keys(pruned).length === Object.keys(prev).length && Object.keys(pruned).every((k) => prev[k]);
			const sameContent =
				sameKeys &&
				Object.entries(pruned).every(([k, v]) => {
					const g = prev[k];
					if (!g) return false;
					if ((g.name ?? '').trim() !== v.name) return false;
					const a = [...new Set(g.nodeIds ?? [])].slice().sort();
					const b = [...new Set(v.nodeIds ?? [])].slice().sort();
					return a.length === b.length && a.every((id, idx) => id === b[idx]);
				});

			if (sameContent) return prev;
			setIsLayoutDirty(true);
			return pruned;
		});
	}, [nodes]);

	// If selected group disappeared, clear selection.
	useEffect(() => {
		if (!selectedGroupId) return;
		if (!groups[selectedGroupId]) setSelectedGroupId(null);
	}, [groups, selectedGroupId]);

	// If opened group editor group disappeared, close editor.
	useEffect(() => {
		if (!groupEditor) return;
		if (!groups[groupEditor.groupId]) setGroupEditor(null);
	}, [groupEditor, groups]);

	const onConnect = useCallback((conn: Connection) => {
		didConnectRef.current = true;
		if (!conn.source || !conn.target) return;
		if (conn.source === conn.target) return;
		const nextOperations = applyConnectionToOperations(methods.getValues().operations, conn);
		replace(nextOperations);
	}, [methods, replace]);

	const onConnectStart = useCallback((
		_: unknown,
		params: { nodeId?: string | null; handleType?: 'source' | 'target' | null; handleId?: string | null },
	) => {
		didConnectRef.current = false;
		connectingSourceRef.current =
			params.handleType === 'source' && params.nodeId
				? { sourceId: String(params.nodeId), sourceHandle: params.handleId ?? null }
				: null;
	}, []);

	const onConnectEnd = useCallback((event: MouseEvent | TouchEvent) => {
		const pendingConnection = connectingSourceRef.current;
		connectingSourceRef.current = null;

		if (!pendingConnection?.sourceId) return;
		if (didConnectRef.current) return;
		if (!flow) return;

		const target = event.target as HTMLElement | null;
		const isPane = Boolean(target?.closest?.('.react-flow__pane'));
		if (!isPane) return;

		const p =
			'touches' in event && event.touches?.[0]
				? { x: event.touches[0].clientX, y: event.touches[0].clientY }
				: 'changedTouches' in event && event.changedTouches?.[0]
					? { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY }
					: 'clientX' in event && typeof event.clientX === 'number' && typeof event.clientY === 'number'
						? { x: event.clientX, y: event.clientY }
						: null;
		if (!p) return;

		// Create new operation at drop position and connect source -> new (new.dependsOn=[source]).
		const pos = (flow as any).screenToFlowPosition ? (flow as any).screenToFlowPosition(p) : null;
		if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number') return;

		const next = makeDefaultOperation();
		const nextOperation = connectSourceToOperation(next, {
			source: pendingConnection.sourceId,
			sourceHandle: pendingConnection.sourceHandle,
		});
		append(nextOperation);

		setNodes((prev) => [
			...prev,
			{
				id: nextOperation.opId,
				type: 'operation',
				position: { x: pos.x, y: pos.y },
				zIndex: Z_INDEX.flow.node,
				data: buildOperationFlowNodeData(nextOperation),
			},
		]);
		setSelectedOpId(nextOperation.opId);
		setIsLayoutDirty(true);
		if (isCompactLayout) setViewState('inspector');
		else setIsInspectorVisible(true);
	}, [append, flow, isCompactLayout, setNodes]);

	const onEdgesChange = useCallback((changes: EdgeChange[]) => {
		const removed = changes.filter((c) => c.type === 'remove').map((c) => c.id);
		if (removed.length === 0) return;

		let nextOperations = methods.getValues().operations;
		for (const id of removed) nextOperations = removeEdgeFromOperations(nextOperations, String(id));
		replace(nextOperations);
	}, [methods, replace]);

	const onNodesChange = useCallback((changes: NodeChange[]) => {
		onNodesChangeBase(changes as any);
		if (changes.some((c) => c.type === 'position')) setIsLayoutDirty(true);
	}, [onNodesChangeBase]);

	const onSelectionChange = useCallback(
		({ nodes: selectedNodes }: { nodes: Array<{ id: string | number }> }) => {
			const ids = selectedNodes.map((n) => String(n.id));
			setSelectedNodeIds((prev) => (areStringArraysEqual(prev, ids) ? prev : ids));
		},
		[areStringArraysEqual],
	);

	const onNodeClick = useCallback(
		(_: unknown, node: Node) => {
			setSelectedOpId(String(node.id));
			if (isCompactLayout) setViewState('inspector');
			else setIsInspectorVisible(true);
		},
		[isCompactLayout],
	);

	const onPaneClick = useCallback(() => {
		setSelectedOpId(null);
		setSelectedNodeIds((prev) => (prev.length === 0 ? prev : []));
		if (isCompactLayout) setViewState('graph');
	}, [isCompactLayout]);

	const onNodeDragStop = useCallback((_: unknown, node: Node) => {
		setNodes((prev) => prev.map((n) => (String(n.id) === String(node.id) ? { ...n, position: node.position } : n)));
		setIsLayoutDirty(true);
	}, [setNodes]);

	const autoLayout = useCallback(() => {
		const opIds = extractOpIds(methods.getValues());
		const deps = edgesToDeps(edges);
		const positions = computeSimpleLayout(opIds, deps);
		setNodes((prev) =>
			prev.map((n) => {
				const pos = positions[String(n.id)];
				return pos ? { ...n, position: pos } : n;
			}),
		);
		setIsLayoutDirty(true);
	}, [edges, methods, setNodes]);

	const deleteSelectedAction = useCallback(() => {
		if (!window.confirm(t('operationProfiles.confirm.deleteSelectedOperations'))) return;
		deleteSelectedNodes();
	}, [deleteSelectedNodes, t]);

	const ungroupSelectedAction = useCallback(() => {
		if (!selectedGroupId) return;
		if (!window.confirm(t('operationProfiles.confirm.ungroupSelected'))) return;
		ungroupSelected();
	}, [selectedGroupId, t, ungroupSelected]);

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
						onAutoLayout={autoLayout}
						onSave={onSave}
						onClose={onClose}
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
								onCreateGroup={createGroupFromSelection}
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
				</Stack>

				<GroupEditorModal
					draft={groupEditor}
					onClose={() => setGroupEditor(null)}
					onDelete={(groupId) => {
						setGroups((prev) => {
							if (!prev[groupId]) return prev;
							const { [groupId]: _removed, ...rest } = prev;
							return rest;
						});
						setSelectedGroupId((prev) => (prev === groupId ? null : prev));
						setIsLayoutDirty(true);
						setGroupEditor(null);
					}}
					onSave={(draft) => {
						const id = draft.groupId;
						const name = draft.name.trim();
						const bgRaw = draft.bg.trim();
						if (!name) return;

						// Store an opaque base color; alpha is applied at render time.
						const bg = normalizeCssColorToOpaqueRgbString(bgRaw, DEFAULT_GROUP_COLOR_HEX);

						setGroups((prev) => {
							const g = prev[id];
							if (!g) return prev;
							return { ...prev, [id]: { ...g, name, bg: bgRaw ? bg : undefined } };
						});
						setIsLayoutDirty(true);
						setGroupEditor(null);
					}}
				/>
			</FormProvider>
		</Modal>
	);
};
