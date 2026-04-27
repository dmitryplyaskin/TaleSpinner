import { describe, expect, it } from 'vitest';

import {
	buildChatWorldInfoBindingOptions,
	createChatWorldInfoBindingSelectProps,
} from './chat-world-info-binding-dialog.model';

describe('chat world info binding dialog model', () => {
	it('prepends the unbound option before world info books', () => {
		expect(
			buildChatWorldInfoBindingOptions({
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

	it('enables searchable dropdown props and renders it above the dialog', () => {
		expect(createChatWorldInfoBindingSelectProps('No matches')).toEqual({
			searchable: true,
			nothingFoundMessage: 'No matches',
			maxDropdownHeight: 320,
			comboboxProps: {
				withinPortal: true,
				zIndex: 4200,
			},
		});
	});
});
