export type PromptOrderItem = {
	identifier: string;
	enabled: boolean;
};

export function movePromptOrderItem<T>(
	items: readonly T[],
	fromIndex: number,
	toIndex: number,
): T[] {
	if (
		!Number.isInteger(fromIndex) ||
		!Number.isInteger(toIndex) ||
		fromIndex < 0 ||
		toIndex < 0 ||
		fromIndex >= items.length ||
		toIndex >= items.length ||
		fromIndex === toIndex
	) {
		return [...items];
	}

	const nextItems = [...items];
	const [movedItem] = nextItems.splice(fromIndex, 1);
	if (typeof movedItem === 'undefined') {
		return [...items];
	}

	nextItems.splice(toIndex, 0, movedItem);
	return nextItems;
}
