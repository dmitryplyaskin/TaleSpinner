export const WORLD_INFO_UNBOUND_OPTION_VALUE = '__none__';

type WorldInfoBookOptionSource = {
	id: string;
	name: string;
};

export function buildWorldInfoBindingOptions(params: {
	noneLabel: string;
	books: WorldInfoBookOptionSource[];
}) {
	return [
		{ value: WORLD_INFO_UNBOUND_OPTION_VALUE, label: params.noneLabel },
		...params.books.map((book) => ({ value: book.id, label: book.name })),
	];
}

export function createWorldInfoBindingSelectProps(nothingFoundMessage: string) {
	return {
		searchable: true,
		nothingFoundMessage,
		maxDropdownHeight: 320,
		comboboxProps: {
			withinPortal: false,
		},
	} as const;
}

export function parseWorldInfoBindingValue(value: string | null): string | null {
	return value === WORLD_INFO_UNBOUND_OPTION_VALUE ? null : value;
}
