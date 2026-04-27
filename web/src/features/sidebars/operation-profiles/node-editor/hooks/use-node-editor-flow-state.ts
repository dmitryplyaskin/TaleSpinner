import { type Edge, type Node, type NodeChange, type ReactFlowInstance, useNodesState } from '@xyflow/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Z_INDEX } from '@ui/z-index';

import { buildOperationFlowNodeData } from '../flow/operation-flow-node-model';
import { computeSimpleLayout, readNodeEditorMeta } from '../meta/node-editor-meta';
import { computeOperationAutoLayout } from '../utils/layout';
import { mergeOperationNodes, type OperationNodeDraft } from '../utils/node-state';

import type { FormOperation, OperationProfileFormValues } from '../../form/operation-profile-form-mapping';
import type { OperationFlowNodeData } from '../flow/operation-flow-node';

type UseNodeEditorFlowStateParams = {
	opened: boolean;
	blockId: string;
	blockMeta: unknown;
	initialValues: OperationProfileFormValues;
	nodeDrafts: OperationNodeDraft[];
	edges: Edge[];
	onDirty: () => void;
};

function edgesToDeps(edges: Array<{ source: string; target: string }>): Array<{ source: string; target: string }> {
	return edges.map((edge) => ({ source: edge.source, target: edge.target }));
}

function extractOpIds(values: OperationProfileFormValues): string[] {
	return values.operations.map((operation) => operation.opId).filter(Boolean);
}

function buildNodesFromOperations(
	operations: FormOperation[],
	positions: Record<string, { x: number; y: number }>,
): Array<Node<OperationFlowNodeData>> {
	return operations.map((operation) => ({
		id: operation.opId,
		type: 'operation',
		position: positions[operation.opId] ?? { x: 0, y: 0 },
		zIndex: Z_INDEX.flow.node,
		data: buildOperationFlowNodeData(operation),
	}));
}

function readNodeSize(node: Node<OperationFlowNodeData>): { width: number; height: number } {
	const width = node.measured?.width ?? node.width ?? 260;
	const height = node.measured?.height ?? node.height ?? 80;
	return {
		width: Number.isFinite(width) && width > 0 ? width : 260,
		height: Number.isFinite(height) && height > 0 ? height : 80,
	};
}

export function useNodeEditorFlowState(params: UseNodeEditorFlowStateParams) {
	const { opened, blockId, blockMeta, initialValues, nodeDrafts, edges, onDirty } = params;
	const [flow, setFlow] = useState<ReactFlowInstance | null>(null);
	const [isAutoLayouting, setIsAutoLayouting] = useState(false);
	const flowWrapperRef = useRef<HTMLDivElement | null>(null);
	const nodesRef = useRef<Array<Node<OperationFlowNodeData>>>([]);
	const signaturesRef = useRef<Map<string, string>>(new Map());
	const [nodes, setNodes, onNodesChangeBase] = useNodesState<Node<OperationFlowNodeData>>([]);

	const fallbackPositions = useMemo(
		() => computeSimpleLayout(nodeDrafts.map((draft) => draft.opId), edgesToDeps(edges)),
		[nodeDrafts, edges],
	);

	const resetNodesFromInitialValues = useCallback(() => {
		const meta = readNodeEditorMeta(blockMeta);
		const resetEdges = edgesToDeps(edges);
		const resetFallback = computeSimpleLayout(extractOpIds(initialValues), resetEdges);
		const positions = { ...resetFallback, ...(meta?.nodes ?? {}) };
		const nextNodes = buildNodesFromOperations(initialValues.operations, positions);
		signaturesRef.current = new Map(nodeDrafts.map((draft) => [draft.opId, draft.signature]));
		setNodes(nextNodes);
	}, [blockMeta, edges, initialValues, nodeDrafts, setNodes]);

	useEffect(() => {
		nodesRef.current = nodes;
	}, [nodes]);

	useEffect(() => {
		if (!opened) return;
		const meta = readNodeEditorMeta(blockMeta);
		const positions = { ...fallbackPositions, ...(meta?.nodes ?? {}) };
		const nextNodes = nodeDrafts.map((draft) => ({
			id: draft.opId,
			type: 'operation',
			position: positions[draft.opId] ?? { x: 0, y: 0 },
			zIndex: Z_INDEX.flow.node,
			data: draft.data,
		}));
		signaturesRef.current = new Map(nodeDrafts.map((draft) => [draft.opId, draft.signature]));
		setNodes(nextNodes);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [opened, blockId]);

	useEffect(() => {
		if (!opened || !flow) return;
		const viewport = readNodeEditorMeta(blockMeta)?.viewport;
		if (!viewport) return;
		void flow.setViewport(viewport, { duration: 0 });
	}, [opened, blockId, blockMeta, flow]);

	useEffect(() => {
		if (!opened) return;
		setNodes((previous) => {
			const result = mergeOperationNodes({
				previous,
				drafts: nodeDrafts,
				previousSignatures: signaturesRef.current,
				fallbackPositions,
				zIndex: Z_INDEX.flow.node,
			});
			signaturesRef.current = result.signatures;
			return result.nodes;
		});
	}, [fallbackPositions, nodeDrafts, opened, setNodes]);

	const onNodesChange = useCallback(
		(changes: NodeChange[]) => {
			onNodesChangeBase(changes as Parameters<typeof onNodesChangeBase>[0]);
			if (changes.some((change) => change.type === 'position')) onDirty();
		},
		[onDirty, onNodesChangeBase],
	);

	const runAutoLayout = useCallback(async () => {
		const currentNodes = nodesRef.current;
		if (currentNodes.length === 0) return;
		setIsAutoLayouting(true);
		try {
			const positions = await computeOperationAutoLayout({
				nodes: currentNodes.map((node) => {
					const size = readNodeSize(node);
					return { id: String(node.id), ...size };
				}),
				edges: edges.map((edge) => ({ id: edge.id, source: String(edge.source), target: String(edge.target) })),
			});
			setNodes((previous) =>
				previous.map((node) => {
					const position = positions[String(node.id)];
					return position ? { ...node, position } : node;
				}),
			);
			onDirty();
			window.requestAnimationFrame(() => {
				void flow?.fitView({ padding: 0.2, duration: 180 });
			});
		} finally {
			setIsAutoLayouting(false);
		}
	}, [edges, flow, onDirty, setNodes]);

	return {
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
	};
}
