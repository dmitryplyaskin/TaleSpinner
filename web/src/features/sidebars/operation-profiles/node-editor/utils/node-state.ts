import { buildOperationFlowNodeSignature } from '../flow/operation-flow-node-model';

import type { OperationFlowNodeData } from '../flow/operation-flow-node';
import type { Node } from '@xyflow/react';

export type OperationNodeDraft = {
	opId: string;
	data: OperationFlowNodeData;
	signature: string;
};

type MergeOperationNodesParams = {
	previous: Array<Node<OperationFlowNodeData>>;
	drafts: OperationNodeDraft[];
	previousSignatures: Map<string, string>;
	fallbackPositions: Record<string, { x: number; y: number }>;
	zIndex?: number;
};

type MergeOperationNodesResult = {
	nodes: Array<Node<OperationFlowNodeData>>;
	changed: boolean;
	signatures: Map<string, string>;
};

function hasSameNodeShape(a: Node<OperationFlowNodeData>, b: Node<OperationFlowNodeData>): boolean {
	return (
		String(a.id) === String(b.id) &&
		(a.type ?? '') === (b.type ?? '') &&
		(a.position?.x ?? 0) === (b.position?.x ?? 0) &&
		(a.position?.y ?? 0) === (b.position?.y ?? 0) &&
		buildOperationFlowNodeSignature(a.data) === buildOperationFlowNodeSignature(b.data)
	);
}

export function mergeOperationNodes(params: MergeOperationNodesParams): MergeOperationNodesResult {
	const { previous, drafts, previousSignatures, fallbackPositions, zIndex } = params;
	const previousById = new Map(previous.map((node) => [String(node.id), node]));
	const nextSignatures = new Map<string, string>();
	let changed = previous.length !== drafts.length;

	const nodes = drafts.map((draft) => {
		const existing = previousById.get(draft.opId);
		nextSignatures.set(draft.opId, draft.signature);

		if (existing && previousSignatures.get(draft.opId) === draft.signature && buildOperationFlowNodeSignature(existing.data) === draft.signature) {
			return existing;
		}

		const nextNode = {
			...(existing ?? {}),
			id: draft.opId,
			type: 'operation',
			position: existing?.position ?? fallbackPositions[draft.opId] ?? { x: 0, y: 0 },
			zIndex: existing?.zIndex ?? zIndex,
			data: draft.data,
		} satisfies Node<OperationFlowNodeData>;

		if (!existing || !hasSameNodeShape(existing, nextNode)) changed = true;
		return nextNode;
	});

	if (!changed) {
		for (let i = 0; i < nodes.length; i++) {
			if (nodes[i] !== previous[i]) {
				changed = true;
				break;
			}
		}
	}

	return { nodes: changed ? nodes : previous, changed, signatures: nextSignatures };
}
