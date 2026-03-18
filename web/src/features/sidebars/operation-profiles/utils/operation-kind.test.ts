import { describe, expect, it } from 'vitest';

import { OPERATION_KIND_OPTIONS, isOperationKind } from './operation-kind';

describe('operation-kind', () => {
	it('does not expose legacy in kind options', () => {
		expect(OPERATION_KIND_OPTIONS).not.toContain('legacy');
	});

	it('does not accept legacy as an operation kind', () => {
		expect(isOperationKind('legacy')).toBe(false);
	});
});
