import { type Connection, type Edge, type EdgeChange, type Node, type ReactFlowInstance } from '@xyflow/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Z_INDEX } from '@ui/z-index';

import { makeDefaultOperation, type OperationProfileFormValues } from '../../form/operation-profile-form-mapping';
import { buildOperationFlowNodeData } from '../flow/operation-flow-node-model';
import {
	applyConnectionToOperations,
	connectSourceToOperation,
	insertOperationBetweenEdge,
	removeEdgeFromOperations,
	removeOperationReferences,
} from '../operation-graph';

import type { NodeEditorViewState } from '../../ui/types';
import type { OperationFlowNodeData } from '../flow/operation-flow-node';
import type { FlowPosition, NodeEditorContextMenuState } from '../ui/node-editor-context-menu';
import type { UseFieldArrayAppend, UseFieldArrayReplace, UseFormReturn } from 'react-hook-form';

type PendingConnection = { sourceId: string; sourceHandle: string | null };

type UseNodeEditorActionsParams = {
	opened: boolean;
	isCompactLayout: boolean;
	flow: ReactFlowInstance | null;
	flowWrapperRef: React.RefObject<HTMLDivElement | null>;
	fieldsLength: number;
	append: UseFieldArrayAppend<OperationProfileFormValues, 'operations'>;
	replace: UseFieldArrayReplace<OperationProfileFormValues, 'operations'>;
	methods: UseFormReturn<OperationProfileFormValues>;
	edges: Edge[];
	nodesById: Map<string, Node<OperationFlowNodeData>>;
	setNodes: React.Dispatch<React.SetStateAction<Array<Node<OperationFlowNodeData>>>>;
	setViewState: React.Dispatch<React.SetStateAction<NodeEditorViewState>>;
	setIsInspectorVisible: React.Dispatch<React.SetStateAction<boolean>>;
	onDirty: () => void;
};

function areStringArraysEqual(a: string[], b: string[]): boolean {
	if (a === b) return true;
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
	return true;
}

function isTextEditingTarget(target: EventTarget | null): boolean {
	if (!target || !(target instanceof HTMLElement)) return false;
	if (target.isContentEditable) return true;
	const tag = target.tagName.toLowerCase();
	if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
	return Boolean(target.closest?.('[contenteditable="true"]'));
}

function readEventPoint(event: MouseEvent | TouchEvent): { x: number; y: number } | null {
	if ('touches' in event && event.touches?.[0]) return { x: event.touches[0].clientX, y: event.touches[0].clientY };
	if ('changedTouches' in event && event.changedTouches?.[0]) {
		return { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY };
	}
	if ('clientX' in event && typeof event.clientX === 'number' && typeof event.clientY === 'number') {
		return { x: event.clientX, y: event.clientY };
	}
	return null;
}

export function useNodeEditorActions(params: UseNodeEditorActionsParams) {
	const {
		opened,
		isCompactLayout,
		flow,
		flowWrapperRef,
		fieldsLength,
		append,
		replace,
		methods,
		edges,
		nodesById,
		setNodes,
		setViewState,
		setIsInspectorVisible,
		onDirty,
	} = params;
	const { t } = useTranslation();
	const [selectedOpId, setSelectedOpId] = useState<string | null>(null);
	const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
	const [contextMenu, setContextMenu] = useState<NodeEditorContextMenuState | null>(null);
	const connectingSourceRef = useRef<PendingConnection | null>(null);
	const didConnectRef = useRef(false);

	const showInspector = useCallback(() => {
		if (isCompactLayout) setViewState('inspector');
		else setIsInspectorVisible(true);
	}, [isCompactLayout, setIsInspectorVisible, setViewState]);

	const closeContextMenu = useCallback(() => setContextMenu(null), []);

	const resetActionState = useCallback(() => {
		setSelectedOpId(null);
		setSelectedNodeIds([]);
		setContextMenu(null);
	}, []);

	const addOperationAt = useCallback(
		(position?: FlowPosition) => {
			const next = makeDefaultOperation();
			append(next);
			let nextPosition = position ?? { x: 0, y: fieldsLength * 160 };
			if (!position && flow && flowWrapperRef.current) {
				const rect = flowWrapperRef.current.getBoundingClientRect();
				const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
				const p = flow.screenToFlowPosition(center);
				if (p && typeof p.x === 'number' && typeof p.y === 'number') nextPosition = { x: p.x, y: p.y };
			}
			setNodes((previous) => [
				...previous,
				{
					id: next.opId,
					type: 'operation',
					position: nextPosition,
					zIndex: Z_INDEX.flow.node,
					data: buildOperationFlowNodeData(next),
				},
			]);
			onDirty();
			setSelectedOpId(next.opId);
			showInspector();
		},
		[append, fieldsLength, flow, flowWrapperRef, onDirty, setNodes, showInspector],
	);

	const addOperation = useCallback(() => addOperationAt(), [addOperationAt]);

	const deleteSelectedNodes = useCallback(() => {
		const ids = selectedNodeIds.length ? selectedNodeIds : selectedOpId ? [selectedOpId] : [];
		if (ids.length === 0) return;
		let current = methods.getValues();
		for (const removedOpId of ids) {
			current = { ...current, operations: removeOperationReferences(current.operations, removedOpId) };
		}
		replace(current.operations.filter((operation) => !ids.includes(operation.opId)));
		setNodes((previous) => previous.filter((node) => !ids.includes(String(node.id))));
		setSelectedNodeIds((previous) => previous.filter((id) => !ids.includes(id)));
		setSelectedOpId((previous) => (previous && ids.includes(previous) ? null : previous));
		onDirty();
		closeContextMenu();
	}, [closeContextMenu, methods, onDirty, replace, selectedNodeIds, selectedOpId, setNodes]);

	const deleteSelectedAction = useCallback(() => {
		if (!window.confirm(t('operationProfiles.confirm.deleteSelectedOperations'))) return;
		deleteSelectedNodes();
	}, [deleteSelectedNodes, t]);

	const openPaneContextMenu = useCallback(
		(event: React.MouseEvent | MouseEvent) => {
			event.preventDefault();
			const client = { x: event.clientX, y: event.clientY };
			const position = flow?.screenToFlowPosition(client) ?? { x: 0, y: 0 };
			setContextMenu({
				type: 'pane',
				x: client.x,
				y: client.y,
				position: {
					x: typeof position?.x === 'number' ? position.x : 0,
					y: typeof position?.y === 'number' ? position.y : 0,
				},
			});
		},
		[flow],
	);

	const openNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
		event.preventDefault();
		event.stopPropagation();
		const nodeId = String(node.id);
		setSelectedOpId(nodeId);
		setContextMenu({ type: 'node', x: event.clientX, y: event.clientY, nodeId });
	}, []);

	const openEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
		event.preventDefault();
		event.stopPropagation();
		setContextMenu({ type: 'edge', x: event.clientX, y: event.clientY, edgeId: String(edge.id) });
	}, []);

	const createOperationFromContext = useCallback(() => {
		if (contextMenu?.type !== 'pane') return;
		addOperationAt(contextMenu.position);
		closeContextMenu();
	}, [addOperationAt, closeContextMenu, contextMenu]);

	const deleteNodeById = useCallback(
		(nodeId: string) => {
			const current = methods.getValues();
			const nextOps = removeOperationReferences(current.operations, nodeId).filter((operation) => operation.opId !== nodeId);
			replace(nextOps);
			setNodes((previous) => previous.filter((node) => String(node.id) !== nodeId));
			setSelectedNodeIds((previous) => previous.filter((id) => id !== nodeId));
			setSelectedOpId((previous) => (previous === nodeId ? null : previous));
			onDirty();
			closeContextMenu();
		},
		[closeContextMenu, methods, onDirty, replace, setNodes],
	);

	const deleteNodeFromContext = useCallback(() => {
		if (contextMenu?.type !== 'node') return;
		if (!window.confirm(t('operationProfiles.confirm.deleteOperation'))) return;
		deleteNodeById(contextMenu.nodeId);
	}, [contextMenu, deleteNodeById, t]);

	const deleteEdgeFromContext = useCallback(() => {
		if (contextMenu?.type !== 'edge') return;
		replace(removeEdgeFromOperations(methods.getValues().operations, contextMenu.edgeId));
		onDirty();
		closeContextMenu();
	}, [closeContextMenu, contextMenu, methods, onDirty, replace]);

	const insertOperationFromEdgeContext = useCallback(() => {
		if (contextMenu?.type !== 'edge') return;
		const edge = edges.find((item) => item.id === contextMenu.edgeId);
		if (!edge) {
			closeContextMenu();
			return;
		}
		const sourceNode = nodesById.get(String(edge.source));
		const targetNode = nodesById.get(String(edge.target));
		const position = {
			x: ((sourceNode?.position.x ?? 0) + (targetNode?.position.x ?? 0)) / 2,
			y: ((sourceNode?.position.y ?? 0) + (targetNode?.position.y ?? 0)) / 2,
		};
		const next = makeDefaultOperation();
		replace(insertOperationBetweenEdge(methods.getValues().operations, contextMenu.edgeId, next));
		setNodes((previous) => [
			...previous,
			{ id: next.opId, type: 'operation', position, zIndex: Z_INDEX.flow.node, data: buildOperationFlowNodeData(next) },
		]);
		setSelectedOpId(next.opId);
		onDirty();
		closeContextMenu();
		showInspector();
	}, [closeContextMenu, contextMenu, edges, methods, nodesById, onDirty, replace, setNodes, showInspector]);

	const onConnect = useCallback(
		(connection: Connection) => {
			didConnectRef.current = true;
			if (!connection.source || !connection.target || connection.source === connection.target) return;
			replace(applyConnectionToOperations(methods.getValues().operations, connection));
		},
		[methods, replace],
	);

	const onConnectStart = useCallback(
		(_: unknown, params: { nodeId?: string | null; handleType?: 'source' | 'target' | null; handleId?: string | null }) => {
			didConnectRef.current = false;
			connectingSourceRef.current =
				params.handleType === 'source' && params.nodeId
					? { sourceId: String(params.nodeId), sourceHandle: params.handleId ?? null }
					: null;
		},
		[],
	);

	const onConnectEnd = useCallback(
		(event: MouseEvent | TouchEvent) => {
			const pendingConnection = connectingSourceRef.current;
			connectingSourceRef.current = null;
			if (!pendingConnection?.sourceId || didConnectRef.current || !flow) return;
			const target = event.target as HTMLElement | null;
			if (!target?.closest?.('.react-flow__pane')) return;
			const point = readEventPoint(event);
			if (!point) return;
			const position = flow.screenToFlowPosition(point);
			const nextOperation = connectSourceToOperation(makeDefaultOperation(), {
				source: pendingConnection.sourceId,
				sourceHandle: pendingConnection.sourceHandle,
			});
			append(nextOperation);
			setNodes((previous) => [
				...previous,
				{
					id: nextOperation.opId,
					type: 'operation',
					position: { x: position.x, y: position.y },
					zIndex: Z_INDEX.flow.node,
					data: buildOperationFlowNodeData(nextOperation),
				},
			]);
			setSelectedOpId(nextOperation.opId);
			onDirty();
			showInspector();
		},
		[append, flow, onDirty, setNodes, showInspector],
	);

	const onEdgesChange = useCallback(
		(changes: EdgeChange[]) => {
			const removed = changes.filter((change) => change.type === 'remove').map((change) => change.id);
			if (removed.length === 0) return;
			let nextOperations = methods.getValues().operations;
			for (const id of removed) nextOperations = removeEdgeFromOperations(nextOperations, String(id));
			replace(nextOperations);
		},
		[methods, replace],
	);

	const onSelectionChange = useCallback(({ nodes }: { nodes: Array<{ id: string | number }> }) => {
		const ids = nodes.map((node) => String(node.id));
		setSelectedNodeIds((previous) => (areStringArraysEqual(previous, ids) ? previous : ids));
	}, []);

	const onNodeClick = useCallback(
		(_: unknown, node: Node) => {
			setSelectedOpId(String(node.id));
			showInspector();
		},
		[showInspector],
	);

	const onPaneClick = useCallback(() => {
		closeContextMenu();
		setSelectedOpId(null);
		setSelectedNodeIds((previous) => (previous.length === 0 ? previous : []));
		if (isCompactLayout) setViewState('graph');
	}, [closeContextMenu, isCompactLayout, setViewState]);

	const onNodeDragStop = useCallback(
		(_: unknown, node: Node) => {
			setNodes((previous) => previous.map((item) => (String(item.id) === String(node.id) ? { ...item, position: node.position } : item)));
			onDirty();
		},
		[onDirty, setNodes],
	);

	useEffect(() => {
		if (!opened) return;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.defaultPrevented || isTextEditingTarget(event.target)) return;
			if (event.key !== 'Delete' && event.key !== 'Backspace') return;
			deleteSelectedNodes();
			event.preventDefault();
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [deleteSelectedNodes, opened]);

	return {
		selectedOpId,
		setSelectedOpId,
		selectedNodeIds,
		setSelectedNodeIds,
		contextMenu,
		closeContextMenu,
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
	};
}
