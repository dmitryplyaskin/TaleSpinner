import { describe, expect, it } from 'vitest';

import {
	buildWorldInfoBindingOptions,
	createWorldInfoBindingSelectProps,
} from './world-info-binding-section.model';

describe('world info binding section model', () => {
	it('prepends the unbound option before world info books', () => {
		expect(
			buildWorldInfoBindingOptions({
				noneLabel: 'Not linked',
				books: [
					{ id: 'book-1', name: 'Alpha' },
					{ id: 'book-2', name: 'Beta' },
				],
			}),
		).toEqual([
			{ value: '__none__', label: 'Not linked' },
			{ value: 'book-1', label: 'Alpha' },
			{ value: 'book-2', label: 'Beta' },
		]);
	});

	it('enables name search in the dropdown', () => {
		expect(createWorldInfoBindingSelectProps('No matches')).toEqual({
			searchable: true,
			nothingFoundMessage: 'No matches',
			maxDropdownHeight: 320,
			comboboxProps: {
				withinPortal: false,
			},
		});
	});
});
