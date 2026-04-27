import type { OperationKind } from '@shared/types/operation-profiles';

export const OPERATION_KIND_OPTIONS = [
	'template',
	'llm',
	'guard',
	'knowledge_search',
	'knowledge_reveal',
	'rag',
	'tool',
	'compute',
	'transform',
] as const satisfies OperationKind[];

export function isOperationKind(value: unknown): value is OperationKind {
	return (
		value === 'template' ||
		value === 'llm' ||
		value === 'guard' ||
		value === 'knowledge_search' ||
		value === 'knowledge_reveal' ||
		value === 'rag' ||
		value === 'tool' ||
		value === 'compute' ||
		value === 'transform'
	);
}
