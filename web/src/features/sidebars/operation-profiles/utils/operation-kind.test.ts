import { describe, expect, it } from 'vitest';

import { OPERATION_KIND_OPTIONS, isOperationKind } from './operation-kind';

describe('operation-kind', () => {
	it('does not expose legacy in kind options', () => {
		expect(OPERATION_KIND_OPTIONS).not.toContain('legacy');
	});

	it('exposes knowledge operation kinds in options', () => {
		expect(OPERATION_KIND_OPTIONS).toContain('knowledge_search');
		expect(OPERATION_KIND_OPTIONS).toContain('knowledge_reveal');
	});

	it('does not accept legacy as an operation kind', () => {
		expect(isOperationKind('legacy')).toBe(false);
	});

	it('accepts knowledge operation kinds', () => {
		expect(isOperationKind('knowledge_search')).toBe(true);
		expect(isOperationKind('knowledge_reveal')).toBe(true);
	});
});
