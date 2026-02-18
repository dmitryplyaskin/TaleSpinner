import type { WorldInfoBookDto, WorldInfoGenerationTrigger } from '../../../api/world-info';

export type EntryDraft = {
	uid: number;
	comment: string;
	content: string;
	key: string[];
	keysecondary: string[];
	position: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
	order: number;
	depth: number;
	outletName: string;
	selective: boolean;
	selectiveLogic: 0 | 1 | 2 | 3;
	scanDepth: number | null;
	caseSensitive: boolean | null;
	matchWholeWords: boolean | null;
	useGroupScoring: boolean | null;
	matchPersonaDescription: boolean;
	matchCharacterDescription: boolean;
	matchCharacterPersonality: boolean;
	matchCharacterDepthPrompt: boolean;
	matchScenario: boolean;
	matchCreatorNotes: boolean;
	constant: boolean;
	vectorized: boolean;
	disable: boolean;
	useProbability: boolean;
	probability: number;
	ignoreBudget: boolean;
	excludeRecursion: boolean;
	preventRecursion: boolean;
	delayUntilRecursion: number;
	group: string;
	groupOverride: boolean;
	groupWeight: number;
	sticky: number | null;
	cooldown: number | null;
	delay: number | null;
	triggers: WorldInfoGenerationTrigger[];
	role: 0 | 1 | 2;
	automationId: string;
	characterFilter: {
		isExclude: boolean;
		names: string[];
		tags: string[];
	};
	extensionsJson: string;
};

export type EntryState = {
	id: string;
	original: Record<string, unknown>;
	draft: EntryDraft;
};

export type BookDraft = {
	id: string;
	name: string;
	slug: string;
	description: string;
	version: number;
	entries: EntryState[];
};

export type NullableBoolSelect = 'inherit' | 'true' | 'false';
export type EntryStateMode = 'normal' | 'constant' | 'vectorized';

export const ST_TRIGGER_OPTIONS: Array<{ value: WorldInfoGenerationTrigger; label: string }> = [
	{ value: 'normal', label: 'normal' },
	{ value: 'continue', label: 'continue' },
	{ value: 'impersonate', label: 'impersonate' },
	{ value: 'swipe', label: 'swipe' },
	{ value: 'regenerate', label: 'regenerate' },
	{ value: 'quiet', label: 'quiet' },
];

const ST_TRIGGER_SET = new Set<WorldInfoGenerationTrigger>(ST_TRIGGER_OPTIONS.map((item) => item.value));
const LEGACY_TRIGGER_MAP: Record<string, WorldInfoGenerationTrigger> = {
	generate: 'normal',
	normal: 'normal',
	continue: 'continue',
	continue_generation: 'continue',
	continue_generate: 'continue',
	impersonate: 'impersonate',
	swipe: 'swipe',
	regenerate: 'regenerate',
	quiet: 'quiet',
};

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [
	{ value: '10', label: '10' },
	{ value: '25', label: '25' },
	{ value: '50', label: '50' },
];

export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = ''): string {
	return typeof value === 'string' ? value : fallback;
}

function asStringArray(value: unknown): string[] {
	if (!Array.isArray(value)) return [];
	return value.filter((item): item is string => typeof item === 'string');
}

function asNumber(value: unknown, fallback: number): number {
	return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
	return typeof value === 'boolean' ? value : fallback;
}

function asNullableNumber(value: unknown): number | null {
	return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function parseNullableBool(value: NullableBoolSelect): boolean | null {
	if (value === 'true') return true;
	if (value === 'false') return false;
	return null;
}

export function toNullableBool(value: boolean | null): NullableBoolSelect {
	if (value === true) return 'true';
	if (value === false) return 'false';
	return 'inherit';
}

function normalizeTrigger(value: unknown): WorldInfoGenerationTrigger | null {
	if (typeof value !== 'string') return null;
	const normalized = value.trim().toLowerCase();
	if (!normalized) return null;
	if (ST_TRIGGER_SET.has(normalized as WorldInfoGenerationTrigger)) {
		return normalized as WorldInfoGenerationTrigger;
	}
	return LEGACY_TRIGGER_MAP[normalized] ?? null;
}

export function normalizeTriggerArray(value: unknown): WorldInfoGenerationTrigger[] {
	if (!Array.isArray(value)) return [];
	const deduped = new Set<WorldInfoGenerationTrigger>();
	value.forEach((item) => {
		const normalized = normalizeTrigger(item);
		if (normalized) deduped.add(normalized);
	});
	return Array.from(deduped);
}

export function getEntryStateMode(draft: EntryDraft): EntryStateMode {
	if (draft.constant) return 'constant';
	if (draft.vectorized) return 'vectorized';
	return 'normal';
}

export function applyEntryStateMode(draft: EntryDraft, mode: EntryStateMode): EntryDraft {
	if (mode === 'constant') {
		return { ...draft, constant: true, vectorized: false };
	}
	if (mode === 'vectorized') {
		return { ...draft, constant: false, vectorized: true };
	}
	return { ...draft, constant: false, vectorized: false };
}

function normalizeEntry(raw: unknown, fallbackUid: number): EntryDraft {
	const source = isRecord(raw) ? raw : {};
	const filter = isRecord(source.characterFilter) ? source.characterFilter : {};
	let extensionsJson = '{}';
	try {
		extensionsJson = JSON.stringify(isRecord(source.extensions) ? source.extensions : {}, null, 2);
	} catch {
		extensionsJson = '{}';
	}

	const delayUntilRecursionRaw = source.delayUntilRecursion;
	const delayUntilRecursion =
		typeof delayUntilRecursionRaw === 'boolean'
			? delayUntilRecursionRaw
				? 1
				: 0
			: Math.max(0, asNumber(delayUntilRecursionRaw, 0));

	return {
		uid: Math.max(0, asNumber(source.uid, fallbackUid)),
		comment: asString(source.comment),
		content: asString(source.content),
		key: asStringArray(source.key),
		keysecondary: asStringArray(source.keysecondary),
		position: asNumber(source.position, 0) as EntryDraft['position'],
		order: asNumber(source.order, 100),
		depth: Math.max(0, asNumber(source.depth, 4)),
		outletName: asString(source.outletName),
		selective: asBoolean(source.selective, true),
		selectiveLogic: asNumber(source.selectiveLogic, 0) as EntryDraft['selectiveLogic'],
		scanDepth: asNullableNumber(source.scanDepth),
		caseSensitive: typeof source.caseSensitive === 'boolean' ? source.caseSensitive : null,
		matchWholeWords: typeof source.matchWholeWords === 'boolean' ? source.matchWholeWords : null,
		useGroupScoring: typeof source.useGroupScoring === 'boolean' ? source.useGroupScoring : null,
		matchPersonaDescription: asBoolean(source.matchPersonaDescription, false),
		matchCharacterDescription: asBoolean(source.matchCharacterDescription, false),
		matchCharacterPersonality: asBoolean(source.matchCharacterPersonality, false),
		matchCharacterDepthPrompt: asBoolean(source.matchCharacterDepthPrompt, false),
		matchScenario: asBoolean(source.matchScenario, false),
		matchCreatorNotes: asBoolean(source.matchCreatorNotes, false),
		constant: asBoolean(source.constant, false),
		vectorized: asBoolean(source.vectorized, false),
		disable: asBoolean(source.disable, false),
		useProbability: asBoolean(source.useProbability, true),
		probability: Math.max(0, Math.min(100, asNumber(source.probability, 100))),
		ignoreBudget: asBoolean(source.ignoreBudget, false),
		excludeRecursion: asBoolean(source.excludeRecursion, false),
		preventRecursion: asBoolean(source.preventRecursion, false),
		delayUntilRecursion,
		group: asString(source.group),
		groupOverride: asBoolean(source.groupOverride, false),
		groupWeight: Math.max(0, asNumber(source.groupWeight, 100)),
		sticky: asNullableNumber(source.sticky),
		cooldown: asNullableNumber(source.cooldown),
		delay: asNullableNumber(source.delay),
		triggers: normalizeTriggerArray(source.triggers),
		role: asNumber(source.role, 0) as EntryDraft['role'],
		automationId: asString(source.automationId),
		characterFilter: {
			isExclude: asBoolean(filter.isExclude, false),
			names: asStringArray(filter.names),
			tags: asStringArray(filter.tags),
		},
		extensionsJson,
	};
}

export function buildDraft(book: WorldInfoBookDto): BookDraft {
	const data: Record<string, unknown> = isRecord(book.data) ? book.data : {};
	const entriesRecord = isRecord(data.entries) ? data.entries : {};
	const entries = Object.keys(entriesRecord).map((id, index) => {
		const source = entriesRecord[id];
		return {
			id,
			original: isRecord(source) ? source : {},
			draft: normalizeEntry(source, index),
		};
	});
	return {
		id: book.id,
		name: book.name,
		slug: book.slug,
		description: book.description ?? '',
		version: book.version,
		entries,
	};
}

export function nextEntryId(entries: EntryState[]): string {
	const numeric = entries.map((entry) => Number(entry.id)).filter((value) => Number.isFinite(value) && value >= 0);
	if (numeric.length === 0) return String(entries.length);
	return String(Math.max(...numeric) + 1);
}

export function cloneEntryState(entry: EntryState, newId: string): EntryState {
	return {
		id: newId,
		original: { ...entry.original },
		draft: {
			...entry.draft,
			key: [...entry.draft.key],
			keysecondary: [...entry.draft.keysecondary],
			triggers: [...entry.draft.triggers],
			characterFilter: {
				isExclude: entry.draft.characterFilter.isExclude,
				names: [...entry.draft.characterFilter.names],
				tags: [...entry.draft.characterFilter.tags],
			},
		},
	};
}

export function createEmptyEntryState(entryId: string, fallbackUid: number): EntryState {
	return {
		id: entryId,
		original: {},
		draft: normalizeEntry({ uid: fallbackUid }, fallbackUid),
	};
}

export function getEntryLabelFromDraft(entryId: string, comment: string | undefined, key: string[] | undefined): string {
	return (comment ?? '').trim() || key?.[0] || `entry #${entryId}`;
}

export function getEntrySearchText(payload: {
	id: string;
	comment: string;
	content: string;
	key: string[];
	keysecondary: string[];
}): string {
	return [payload.id, payload.comment, payload.content, ...payload.key, ...payload.keysecondary].join(' ').toLowerCase();
}

export function resolveEntryPage(entries: EntryState[], search: string, pageSize: number, entryId: string): number | null {
	const query = search.trim().toLowerCase();
	const visibleEntries =
		query.length === 0
			? entries
			: entries.filter((entry) =>
					getEntrySearchText({
						id: entry.id,
						comment: entry.draft.comment,
						content: entry.draft.content,
						key: entry.draft.key,
						keysecondary: entry.draft.keysecondary,
					}).includes(query),
			  );
	const index = visibleEntries.findIndex((entry) => entry.id === entryId);
	if (index < 0) return null;
	return Math.floor(index / pageSize) + 1;
}

export function toEntryPayload(entry: EntryState): Record<string, unknown> {
	const extensionsRaw = JSON.parse(entry.draft.extensionsJson || '{}') as unknown;
	return {
		...entry.original,
		uid: entry.draft.uid,
		comment: entry.draft.comment,
		content: entry.draft.content,
		key: entry.draft.key,
		keysecondary: entry.draft.keysecondary,
		position: entry.draft.position,
		order: entry.draft.order,
		depth: entry.draft.depth,
		outletName: entry.draft.outletName,
		selective: entry.draft.selective,
		selectiveLogic: entry.draft.selectiveLogic,
		scanDepth: entry.draft.scanDepth,
		caseSensitive: entry.draft.caseSensitive,
		matchWholeWords: entry.draft.matchWholeWords,
		useGroupScoring: entry.draft.useGroupScoring,
		matchPersonaDescription: entry.draft.matchPersonaDescription,
		matchCharacterDescription: entry.draft.matchCharacterDescription,
		matchCharacterPersonality: entry.draft.matchCharacterPersonality,
		matchCharacterDepthPrompt: entry.draft.matchCharacterDepthPrompt,
		matchScenario: entry.draft.matchScenario,
		matchCreatorNotes: entry.draft.matchCreatorNotes,
		constant: entry.draft.constant,
		vectorized: entry.draft.vectorized,
		disable: entry.draft.disable,
		useProbability: entry.draft.useProbability,
		probability: entry.draft.probability,
		ignoreBudget: entry.draft.ignoreBudget,
		excludeRecursion: entry.draft.excludeRecursion,
		preventRecursion: entry.draft.preventRecursion,
		delayUntilRecursion: entry.draft.delayUntilRecursion,
		group: entry.draft.group,
		groupOverride: entry.draft.groupOverride,
		groupWeight: entry.draft.groupWeight,
		sticky: entry.draft.sticky,
		cooldown: entry.draft.cooldown,
		delay: entry.draft.delay,
		triggers: entry.draft.triggers,
		role: entry.draft.role,
		automationId: entry.draft.automationId,
		characterFilter: entry.draft.characterFilter,
		extensions: isRecord(extensionsRaw) ? extensionsRaw : {},
	};
}
