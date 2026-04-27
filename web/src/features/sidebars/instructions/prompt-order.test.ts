import { describe, expect, it } from 'vitest';

import { movePromptOrderItem } from './prompt-order';

describe('movePromptOrderItem', () => {
	it('moves a prompt block down to a later position', () => {
		const initialOrder = [
			{ identifier: 'main', enabled: true },
			{ identifier: 'worldInfoBefore', enabled: false },
			{ identifier: 'charDescription', enabled: true },
		];

		expect(movePromptOrderItem(initialOrder, 0, 2)).toEqual([
			{ identifier: 'worldInfoBefore', enabled: false },
			{ identifier: 'charDescription', enabled: true },
			{ identifier: 'main', enabled: true },
		]);
	});

	it('moves a prompt block up to an earlier position', () => {
		const initialOrder = [
			{ identifier: 'main', enabled: true },
			{ identifier: 'worldInfoBefore', enabled: false },
			{ identifier: 'charDescription', enabled: true },
		];

		expect(movePromptOrderItem(initialOrder, 2, 0)).toEqual([
			{ identifier: 'charDescription', enabled: true },
			{ identifier: 'main', enabled: true },
			{ identifier: 'worldInfoBefore', enabled: false },
		]);
	});

	it('returns the original order when indices do not produce a move', () => {
		const initialOrder = [
			{ identifier: 'main', enabled: true },
			{ identifier: 'worldInfoBefore', enabled: false },
		];

		expect(movePromptOrderItem(initialOrder, -1, 1)).toEqual(initialOrder);
		expect(movePromptOrderItem(initialOrder, 0, 0)).toEqual(initialOrder);
		expect(movePromptOrderItem(initialOrder, 0, 10)).toEqual(initialOrder);
	});
});
