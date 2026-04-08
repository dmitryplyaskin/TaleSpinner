import { Z_INDEX } from '@ui/z-index';

type WorldInfoBookOptionSource = {
	id: string;
	name: string;
};

export function buildChatWorldInfoBindingOptions(params: {
	noneLabel: string;
	books: WorldInfoBookOptionSource[];
}) {
	return [
		{ value: '__none__', label: params.noneLabel },
		...params.books.map((book) => ({ value: book.id, label: book.name })),
	];
}

export function createChatWorldInfoBindingSelectProps(nothingFoundMessage: string) {
	return {
		searchable: true,
		nothingFoundMessage,
		maxDropdownHeight: 320,
		comboboxProps: {
			withinPortal: true,
			zIndex: Z_INDEX.overlay.popup,
		},
	} as const;
}
