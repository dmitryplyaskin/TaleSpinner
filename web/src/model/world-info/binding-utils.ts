import type { WorldInfoBindingDto, WorldInfoBindingRole } from '../../api/world-info';

function toTimestamp(value: string): number {
	const parsed = Date.parse(value);
	return Number.isFinite(parsed) ? parsed : 0;
}

export function sortBindingsByCanonicalOrder(
	items: WorldInfoBindingDto[],
): WorldInfoBindingDto[] {
	return items.slice().sort((a, b) => {
		if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
		const aCreatedAt = toTimestamp(a.createdAt);
		const bCreatedAt = toTimestamp(b.createdAt);
		if (aCreatedAt !== bCreatedAt) return aCreatedAt - bCreatedAt;
		return a.id.localeCompare(b.id);
	});
}

export function pickCanonicalBinding(
	items: WorldInfoBindingDto[],
): WorldInfoBindingDto | null {
	return sortBindingsByCanonicalOrder(items.filter((item) => item.enabled))[0] ?? null;
}

export function createCanonicalBookMapByScopeId(
	items: WorldInfoBindingDto[],
): Record<string, string | null> {
	const grouped = new Map<string, WorldInfoBindingDto[]>();

	items.forEach((item) => {
		if (!item.scopeId) return;
		const group = grouped.get(item.scopeId) ?? [];
		group.push(item);
		grouped.set(item.scopeId, group);
	});

	return Array.from(grouped.entries()).reduce<Record<string, string | null>>(
		(acc, [scopeId, bindings]) => {
			acc[scopeId] = pickCanonicalBinding(bindings)?.bookId ?? null;
			return acc;
		},
		{},
	);
}

export function buildSingleBindingItems(
	bookId: string | null,
	bindingRole: WorldInfoBindingRole = 'primary',
): Array<{
	bookId: string;
	bindingRole: WorldInfoBindingRole;
	displayOrder: number;
	enabled: boolean;
}> {
	if (!bookId) return [];

	return [
		{
			bookId,
			bindingRole,
			displayOrder: 0,
			enabled: true,
		},
	];
}
