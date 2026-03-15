import { MarkerType, type Connection, type Edge } from '@xyflow/react';

import type { FormOperation } from '../form/operation-profile-form-mapping';
import type { OperationRunCondition } from '@shared/types/operation-profiles';

export const DEPENDENCY_EDGE_PREFIX = 'dep:';
export const GUARD_EDGE_PREFIX = 'guard:';
export const GUARD_SOURCE_HANDLE_PREFIX = 'guard-output:';
export const DEFAULT_SOURCE_HANDLE_ID = 'depends_on';

type GraphEdgeKind = 'dependency' | 'guard_output';

type OperationGraphEdgeData = {
	kind: GraphEdgeKind;
	outputKey?: string;
	operator?: 'is_true' | 'is_false';
};

type OperationGraphSource = {
	opId: string;
	config: {
		dependsOn?: string[];
		runConditions?: FormOperation['config']['runConditions'];
	};
};

function normalizeRunConditions(conditions: FormOperation['config']['runConditions'] | undefined): OperationRunCondition[] {
	return Array.isArray(conditions)
		? conditions.filter(
				(condition): condition is OperationRunCondition =>
					Boolean(condition) &&
					condition.type === 'guard_output' &&
					typeof condition.sourceOpId === 'string' &&
					typeof condition.outputKey === 'string' &&
					(condition.operator === 'is_true' || condition.operator === 'is_false'),
		  )
		: [];
}

export function buildGuardSourceHandleId(outputKey: string): string {
	return `${GUARD_SOURCE_HANDLE_PREFIX}${outputKey}`;
}

export function parseGuardSourceHandleId(handleId?: string | null): string | null {
	if (!handleId?.startsWith(GUARD_SOURCE_HANDLE_PREFIX)) return null;
	const outputKey = handleId.slice(GUARD_SOURCE_HANDLE_PREFIX.length).trim();
	return outputKey.length > 0 ? outputKey : null;
}

function buildDependencyEdgeId(source: string, target: string): string {
	return `${DEPENDENCY_EDGE_PREFIX}${source}=>${target}`;
}

function buildGuardEdgeId(condition: OperationRunCondition, target: string): string {
	return `${GUARD_EDGE_PREFIX}${condition.sourceOpId}:${condition.outputKey}:${condition.operator}=>${target}`;
}

function parseEdgeId(edgeId: string):
	| { kind: 'dependency'; source: string; target: string }
	| { kind: 'guard_output'; source: string; outputKey: string; operator: 'is_true' | 'is_false'; target: string }
	| null {
	if (edgeId.startsWith(DEPENDENCY_EDGE_PREFIX)) {
		const [source, target] = edgeId.slice(DEPENDENCY_EDGE_PREFIX.length).split('=>');
		if (!source || !target) return null;
		return { kind: 'dependency', source, target };
	}

	if (edgeId.startsWith(GUARD_EDGE_PREFIX)) {
		const [left, target] = edgeId.slice(GUARD_EDGE_PREFIX.length).split('=>');
		if (!left || !target) return null;
		const [source, outputKey, operatorRaw] = left.split(':');
		if (!source || !outputKey || (operatorRaw !== 'is_true' && operatorRaw !== 'is_false')) return null;
		return { kind: 'guard_output', source, outputKey, operator: operatorRaw, target };
	}

	return null;
}

function withUnique<T>(items: T[]): T[] {
	return Array.from(new Set(items));
}

function upsertGuardCondition(conditions: OperationRunCondition[], nextCondition: OperationRunCondition): OperationRunCondition[] {
	if (
		conditions.some(
			(condition) =>
				condition.type === 'guard_output' &&
				condition.sourceOpId === nextCondition.sourceOpId &&
				condition.outputKey === nextCondition.outputKey,
		)
	) {
		return conditions;
	}
	return [...conditions, nextCondition];
}

function applyConnectionToOperation(operation: FormOperation, connection: Pick<Connection, 'source' | 'sourceHandle' | 'target'>): FormOperation {
	if (!connection.source || connection.source === operation.opId) return operation;
	const outputKey = parseGuardSourceHandleId(connection.sourceHandle);
	const dependsOn = withUnique([...(operation.config.dependsOn ?? []), connection.source]);

	if (!outputKey) {
		return {
			...operation,
			config: {
				...operation.config,
				dependsOn,
			},
		};
	}

	const nextCondition: OperationRunCondition = {
		type: 'guard_output',
		sourceOpId: connection.source,
		outputKey,
		operator: 'is_true',
	};

	return {
		...operation,
		config: {
			...operation.config,
			dependsOn,
			runConditions: upsertGuardCondition(normalizeRunConditions(operation.config.runConditions), nextCondition),
		},
	};
}

export function applyConnectionToOperations(
	operations: FormOperation[],
	connection: Pick<Connection, 'source' | 'sourceHandle' | 'target'>,
): FormOperation[] {
	if (!connection.source || !connection.target || connection.source === connection.target) return operations;
	return operations.map((operation) =>
		operation.opId === connection.target ? applyConnectionToOperation(operation, connection) : operation,
	);
}

export function connectSourceToOperation(
	operation: FormOperation,
	connection: Pick<Connection, 'source' | 'sourceHandle'>,
): FormOperation {
	return applyConnectionToOperation(operation, {
		source: connection.source,
		sourceHandle: connection.sourceHandle,
		target: operation.opId,
	});
}

export function buildOperationGraphEdges(operations: OperationGraphSource[]): Edge<OperationGraphEdgeData>[] {
	const edges: Edge<OperationGraphEdgeData>[] = [];
	for (const operation of operations) {
		const runConditions = normalizeRunConditions(operation.config.runConditions);
		const guardSources = new Set(runConditions.map((condition) => condition.sourceOpId));
		for (const source of operation.config.dependsOn ?? []) {
			if (!source || source === operation.opId || guardSources.has(source)) continue;
			edges.push({
				id: buildDependencyEdgeId(source, operation.opId),
				source,
				target: operation.opId,
				sourceHandle: DEFAULT_SOURCE_HANDLE_ID,
				animated: false,
				markerEnd: { type: MarkerType.ArrowClosed },
				style: { strokeWidth: 2 },
				data: { kind: 'dependency' },
			});
		}

		for (const condition of runConditions) {
			if (condition.sourceOpId === operation.opId) continue;
			edges.push({
				id: buildGuardEdgeId(condition, operation.opId),
				source: condition.sourceOpId,
				target: operation.opId,
				sourceHandle: buildGuardSourceHandleId(condition.outputKey),
				animated: false,
				markerEnd: { type: MarkerType.ArrowClosed },
				style: { strokeWidth: 2, stroke: 'var(--mantine-color-teal-6)' },
				data: {
					kind: 'guard_output',
					outputKey: condition.outputKey,
					operator: condition.operator,
				},
			});
		}
	}
	return edges;
}

export function removeEdgeFromOperations(operations: FormOperation[], edgeId: string): FormOperation[] {
	const edge = parseEdgeId(edgeId);
	if (!edge) return operations;

	return operations.map((operation) => {
		if (operation.opId !== edge.target) return operation;

		if (edge.kind === 'dependency') {
			return {
				...operation,
				config: {
					...operation.config,
					dependsOn: operation.config.dependsOn.filter((value) => value !== edge.source),
				},
			};
		}

		const nextConditions = normalizeRunConditions(operation.config.runConditions).filter(
			(condition) =>
				!(
					condition.type === 'guard_output' &&
					condition.sourceOpId === edge.source &&
					condition.outputKey === edge.outputKey &&
					condition.operator === edge.operator
				),
		);
		const hasConditionsFromSameSource = nextConditions.some((condition) => condition.sourceOpId === edge.source);

		return {
			...operation,
			config: {
				...operation.config,
				runConditions: nextConditions,
				dependsOn: hasConditionsFromSameSource
					? operation.config.dependsOn
					: operation.config.dependsOn.filter((value) => value !== edge.source),
			},
		};
	});
}

export function removeOperationReferences(operations: FormOperation[], removedOpId: string): FormOperation[] {
	return operations.map((operation) => ({
		...operation,
		config: {
			...operation.config,
			dependsOn: operation.config.dependsOn.filter((value) => value !== removedOpId),
			runConditions: normalizeRunConditions(operation.config.runConditions).filter(
				(condition) => condition.sourceOpId !== removedOpId,
			),
		},
	}));
}
