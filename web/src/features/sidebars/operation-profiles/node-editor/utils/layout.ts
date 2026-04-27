import ELK from 'elkjs/lib/elk.bundled.js';

import type { ElkExtendedEdge, ElkNode } from 'elkjs/lib/elk-api';

const DEFAULT_NODE_WIDTH = 260;
const DEFAULT_NODE_HEIGHT = 80;
const LAYER_SPACING = 120;
const NODE_SPACING = 64;

const elk = new ELK();

export type OperationLayoutNode = {
	id: string;
	width?: number;
	height?: number;
};

export type OperationLayoutEdge = {
	id?: string;
	source: string;
	target: string;
};

export type OperationLayoutPosition = {
	x: number;
	y: number;
};

export type OperationAutoLayoutInput = {
	nodes: OperationLayoutNode[];
	edges: OperationLayoutEdge[];
};

function readSize(value: number | undefined, fallback: number): number {
	return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}

function stackDisconnected(nodes: OperationLayoutNode[]): Record<string, OperationLayoutPosition> {
	const positions: Record<string, OperationLayoutPosition> = {};
	let y = 0;
	for (const node of nodes) {
		positions[node.id] = { x: 0, y };
		y += readSize(node.height, DEFAULT_NODE_HEIGHT) + NODE_SPACING;
	}
	return positions;
}

function buildElkGraph(input: OperationAutoLayoutInput): ElkNode {
	const nodeIds = new Set(input.nodes.map((node) => node.id));
	const children: ElkNode[] = input.nodes.map((node) => ({
		id: node.id,
		width: readSize(node.width, DEFAULT_NODE_WIDTH),
		height: readSize(node.height, DEFAULT_NODE_HEIGHT),
	}));
	const edges: ElkExtendedEdge[] = input.edges
		.filter((edge) => edge.source !== edge.target && nodeIds.has(edge.source) && nodeIds.has(edge.target))
		.map((edge, index) => ({
			id: edge.id ?? `${edge.source}->${edge.target}:${index}`,
			sources: [edge.source],
			targets: [edge.target],
		}));

	return {
		id: 'operation-node-editor-layout',
		children,
		edges,
		layoutOptions: {
			'elk.algorithm': 'layered',
			'elk.direction': 'RIGHT',
			'elk.spacing.nodeNode': String(NODE_SPACING),
			'elk.layered.spacing.nodeNodeBetweenLayers': String(LAYER_SPACING),
			'elk.layered.spacing.edgeNodeBetweenLayers': '48',
			'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
			'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
			'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
			'elk.separateConnectedComponents': 'true',
			'elk.spacing.componentComponent': String(NODE_SPACING * 2),
		},
	};
}

function normalizePositions(children: ElkNode[] | undefined, inputNodes: OperationLayoutNode[]): Record<string, OperationLayoutPosition> {
	if (!children?.length) return stackDisconnected(inputNodes);

	const raw = new Map(children.map((child) => [child.id, { x: child.x ?? 0, y: child.y ?? 0 }]));
	const minX = Math.min(...Array.from(raw.values(), (position) => position.x));
	const minY = Math.min(...Array.from(raw.values(), (position) => position.y));
	const positions: Record<string, OperationLayoutPosition> = {};

	for (const node of inputNodes) {
		const position = raw.get(node.id) ?? { x: 0, y: 0 };
		positions[node.id] = {
			x: Math.round(position.x - minX),
			y: Math.round(position.y - minY),
		};
	}

	return positions;
}

export async function computeOperationAutoLayout(input: OperationAutoLayoutInput): Promise<Record<string, OperationLayoutPosition>> {
	if (input.nodes.length === 0) return {};
	if (input.edges.length === 0) return stackDisconnected(input.nodes);

	const graph = buildElkGraph(input);
	const result = await elk.layout(graph);
	return normalizePositions(result.children, input.nodes);
}
