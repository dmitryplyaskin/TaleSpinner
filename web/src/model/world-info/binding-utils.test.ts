import { describe, expect, it } from 'vitest';

import {
	buildSingleBindingItems,
	createCanonicalBookMapByScopeId,
	pickCanonicalBinding,
	sortBindingsByCanonicalOrder,
} from './binding-utils';

import type { WorldInfoBindingDto } from '../../api/world-info';

function makeBinding(
	id: string,
	patch: Partial<WorldInfoBindingDto> = {},
): WorldInfoBindingDto {
	return {
		id,
		ownerId: 'global',
		scope: 'entity_profile',
		scopeId: 'scope-1',
		bookId: `${id}-book`,
		bindingRole: 'primary',
		displayOrder: 0,
		enabled: true,
		meta: null,
		createdAt: '2026-01-01T00:00:00.000Z',
		updatedAt: '2026-01-01T00:00:00.000Z',
		...patch,
	};
}

describe('world-info binding utils', () => {
	it('sorts bindings by displayOrder, createdAt, and id while skipping disabled entries for canonical pick', () => {
		const result = pickCanonicalBinding([
			makeBinding('disabled-first', {
				bookId: 'book-disabled',
				displayOrder: 0,
				enabled: false,
			}),
			makeBinding('later', {
				bookId: 'book-later',
				displayOrder: 2,
			}),
			makeBinding('same-order-z', {
				bookId: 'book-z',
				displayOrder: 1,
				createdAt: '2026-01-02T00:00:00.000Z',
				id: 'z-id',
			}),
			makeBinding('same-order-a', {
				bookId: 'book-a',
				displayOrder: 1,
				createdAt: '2026-01-02T00:00:00.000Z',
				id: 'a-id',
			}),
		]);

		expect(result?.bookId).toBe('book-a');
		expect(sortBindingsByCanonicalOrder([
			makeBinding('same-order-z', {
				bookId: 'book-z',
				displayOrder: 1,
				createdAt: '2026-01-02T00:00:00.000Z',
				id: 'z-id',
			}),
			makeBinding('later', {
				bookId: 'book-later',
				displayOrder: 2,
			}),
			makeBinding('same-order-a', {
				bookId: 'book-a',
				displayOrder: 1,
				createdAt: '2026-01-02T00:00:00.000Z',
				id: 'a-id',
			}),
		]).map((item) => item.bookId)).toEqual(['book-a', 'book-z', 'book-later']);
	});

	it('creates a canonical single-book map per scope id', () => {
		expect(createCanonicalBookMapByScopeId([
			makeBinding('entity-1-second', {
				scopeId: 'entity-1',
				bookId: 'book-entity-1-second',
				displayOrder: 1,
			}),
			makeBinding('entity-2-only', {
				scopeId: 'entity-2',
				bookId: 'book-entity-2-only',
				displayOrder: 0,
			}),
			makeBinding('entity-1-first', {
				scopeId: 'entity-1',
				bookId: 'book-entity-1-first',
				displayOrder: 0,
			}),
			makeBinding('entity-2-disabled', {
				scopeId: 'entity-2',
				bookId: 'book-entity-2-disabled',
				displayOrder: -1,
				enabled: false,
			}),
		])).toEqual({
			'entity-1': 'book-entity-1-first',
			'entity-2': 'book-entity-2-only',
		});
	});

	it('builds zero-or-one replacement payloads for scope writes', () => {
		expect(buildSingleBindingItems(null)).toEqual([]);
		expect(buildSingleBindingItems('book-1')).toEqual([
			{
				bookId: 'book-1',
				bindingRole: 'primary',
				displayOrder: 0,
				enabled: true,
			},
		]);
		expect(buildSingleBindingItems('book-2', 'additional')).toEqual([
			{
				bookId: 'book-2',
				bindingRole: 'additional',
				displayOrder: 0,
				enabled: true,
			},
		]);
	});
});
