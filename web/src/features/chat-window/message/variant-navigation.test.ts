import { describe, expect, it } from 'vitest';

import { pickActiveVariantIndex, resolveNextVariantAction, resolvePreviousVariantAction } from './variant-navigation';

describe('variant navigation', () => {
	it('falls back to the last known variant when the active id is absent', () => {
		expect(
			pickActiveVariantIndex(
				[
					{ variantId: 'v1' },
					{ variantId: 'v2' },
				],
				'missing',
			),
		).toBe(1);
	});

	it('goes to the previous stored variant when the active variant exists only locally', () => {
		expect(
			resolvePreviousVariantAction({
				variants: [
					{ variantId: 'v1' },
					{ variantId: 'v2' },
				],
				activeVariantId: 'local-active',
				hasActiveOutsideList: true,
			}),
		).toEqual({ kind: 'select', variantId: 'v2' });
	});

	it('requests loading variants before regenerating when the list is still empty', () => {
		expect(
			resolveNextVariantAction({
				variants: [],
				activeVariantId: 'local-active',
				hasActiveOutsideList: false,
				isImportedFirstMessage: false,
				isLoading: false,
			}),
		).toEqual({ kind: 'load' });
	});

	it('regenerates on the last assistant variant when regeneration is allowed', () => {
		expect(
			resolveNextVariantAction({
				variants: [
					{ variantId: 'v1' },
					{ variantId: 'v2' },
				],
				activeVariantId: 'v2',
				hasActiveOutsideList: false,
				isImportedFirstMessage: false,
				isLoading: false,
			}),
		).toEqual({ kind: 'regenerate' });
	});

	it('blocks regeneration for imported first messages on the last variant', () => {
		expect(
			resolveNextVariantAction({
				variants: [
					{ variantId: 'v1' },
					{ variantId: 'v2' },
				],
				activeVariantId: 'v2',
				hasActiveOutsideList: false,
				isImportedFirstMessage: true,
				isLoading: false,
			}),
		).toEqual({ kind: 'none' });
	});
});
