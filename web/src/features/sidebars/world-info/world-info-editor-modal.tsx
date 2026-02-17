import { Accordion, Button, Divider, Group, MultiSelect, NumberInput, Pagination, ScrollArea, Select, Stack, Switch, TagsInput, Text, TextInput, Textarea } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuArrowDown, LuArrowUp, LuCopy, LuPlus, LuTrash2 } from 'react-icons/lu';

import { Dialog } from '@ui/dialog';
import { IconButtonWithTooltip } from '@ui/icon-button-with-tooltip';
import { LiquidDocsButton } from '@ui/liquid-template-docs';
import { toaster } from '@ui/toaster';

import type { WorldInfoBookDto, WorldInfoGenerationTrigger } from '../../../api/world-info';

type EntryDraft = {
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

type EntryState = {
	id: string;
	original: Record<string, unknown>;
	draft: EntryDraft;
};

type BookDraft = {
	id: string;
	name: string;
	slug: string;
	description: string;
	version: number;
	entries: EntryState[];
};

type Props = {
	opened: boolean;
	book: WorldInfoBookDto | null;
	saving: boolean;
	onClose: () => void;
	onSave: (payload: {
		id: string;
		name: string;
		slug: string;
		description: string | null;
		data: unknown;
		version: number;
	}) => void;
};

type NullableBoolSelect = 'inherit' | 'true' | 'false';
type EntryStateMode = 'normal' | 'constant' | 'vectorized';

const ST_TRIGGER_OPTIONS: Array<{ value: WorldInfoGenerationTrigger; label: string }> = [
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

function isRecord(value: unknown): value is Record<string, unknown> {
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

function parseNullableBool(value: NullableBoolSelect): boolean | null {
	if (value === 'true') return true;
	if (value === 'false') return false;
	return null;
}

function toNullableBool(value: boolean | null): NullableBoolSelect {
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

function normalizeTriggerArray(value: unknown): WorldInfoGenerationTrigger[] {
	if (!Array.isArray(value)) return [];
	const deduped = new Set<WorldInfoGenerationTrigger>();
	value.forEach((item) => {
		const normalized = normalizeTrigger(item);
		if (normalized) deduped.add(normalized);
	});
	return Array.from(deduped);
}

function getEntryStateMode(draft: EntryDraft): EntryStateMode {
	if (draft.constant) return 'constant';
	if (draft.vectorized) return 'vectorized';
	return 'normal';
}

function applyEntryStateMode(draft: EntryDraft, mode: EntryStateMode): EntryDraft {
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

function buildDraft(book: WorldInfoBookDto): BookDraft {
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

function nextEntryId(entries: EntryState[]): string {
	const numeric = entries.map((entry) => Number(entry.id)).filter((value) => Number.isFinite(value) && value >= 0);
	if (numeric.length === 0) return String(entries.length);
	return String(Math.max(...numeric) + 1);
}

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [
	{ value: '10', label: '10' },
	{ value: '25', label: '25' },
	{ value: '50', label: '50' },
];

function filterEntries(entries: EntryState[], search: string): EntryState[] {
	const query = search.trim().toLowerCase();
	if (!query) return entries;
	return entries.filter((entry) => {
		const text = [entry.id, entry.draft.comment, entry.draft.content, ...entry.draft.key, ...entry.draft.keysecondary]
			.join(' ')
			.toLowerCase();
		return text.includes(query);
	});
}

function resolveEntryPage(entries: EntryState[], search: string, pageSize: number, entryId: string): number | null {
	const visibleEntries = filterEntries(entries, search);
	const index = visibleEntries.findIndex((entry) => entry.id === entryId);
	if (index < 0) return null;
	return Math.floor(index / pageSize) + 1;
}

function getEntryLabel(entry: EntryState): string {
	return entry.draft.comment || entry.draft.key[0] || `entry #${entry.id}`;
}

function toEntryPayload(entry: EntryState): Record<string, unknown> {
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

export const WorldInfoEditorModal = ({ opened, book, saving, onClose, onSave }: Props) => {
	const { t } = useTranslation();
	const isMobile = useMediaQuery('(max-width: 48em)');
	const [draft, setDraft] = useState<BookDraft | null>(null);
	const [hasChanges, setHasChanges] = useState(false);
	const [expandedEntryIds, setExpandedEntryIds] = useState<string[]>([]);
	const [search, setSearch] = useState('');
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

	useEffect(() => {
		if (!opened || !book) return;
		const next = buildDraft(book);
		setDraft(next);
		setHasChanges(false);
		setExpandedEntryIds(next.entries[0] ? [next.entries[0].id] : []);
		setSearch('');
		setCurrentPage(1);
		setPageSize(DEFAULT_PAGE_SIZE);
	}, [book, opened]);

	const visibleEntries = useMemo(() => {
		if (!draft) return [];
		return filterEntries(draft.entries, search);
	}, [draft, search]);

	const totalItems = visibleEntries.length;
	const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
	const paginatedEntries = useMemo(() => {
		const start = (currentPage - 1) * pageSize;
		return visibleEntries.slice(start, start + pageSize);
	}, [currentPage, pageSize, visibleEntries]);

	useEffect(() => {
		setCurrentPage((prev) => Math.min(Math.max(prev, 1), totalPages));
	}, [totalPages]);

	useEffect(() => {
		setExpandedEntryIds((prev) => {
			if (!draft) return [];
			const ids = new Set(draft.entries.map((entry) => entry.id));
			return prev.filter((id) => ids.has(id));
		});
	}, [draft]);

	const requestClose = () => {
		if (saving) return;
		if (hasChanges && !window.confirm(t('worldInfo.confirm.discardChanges'))) return;
		onClose();
	};

	const mutateDraft = useCallback((updater: (current: BookDraft) => BookDraft) => {
		setDraft((current) => {
			if (!current) return current;
			const next = updater(current);
			if (next !== current) setHasChanges(true);
			return next;
		});
	}, []);

	const mutateEntry = useCallback((entryId: string, updater: (entry: EntryState) => EntryState) => {
		mutateDraft((current) => {
			const index = current.entries.findIndex((entry) => entry.id === entryId);
			if (index < 0) return current;
			const currentEntry = current.entries[index];
			const nextEntry = updater(currentEntry);
			if (nextEntry === currentEntry) return current;
			const nextEntries = current.entries.slice();
			nextEntries[index] = nextEntry;
			return {
				...current,
				entries: nextEntries,
			};
		});
	}, [mutateDraft]);

	const addEntry = () => {
		setSearch('');
		mutateDraft((current) => {
			if (!current) return current;
			const id = nextEntryId(current.entries);
			const nextEntries = [...current.entries, { id, original: {}, draft: normalizeEntry({ uid: current.entries.length }, current.entries.length) }];
			setExpandedEntryIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
			setCurrentPage(Math.floor((nextEntries.length - 1) / pageSize) + 1);
			return { ...current, entries: nextEntries };
		});
	};

	const duplicateEntry = (sourceId: string) => {
		setSearch('');
		mutateDraft((current) => {
			if (!current) return current;
			const source = current.entries.find((entry) => entry.id === sourceId);
			if (!source) return current;
			const id = nextEntryId(current.entries);
			const nextEntries = [...current.entries, { ...source, id }];
			setExpandedEntryIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
			setCurrentPage(Math.floor((nextEntries.length - 1) / pageSize) + 1);
			return { ...current, entries: nextEntries };
		});
	};

	const deleteEntry = (entryId: string) => {
		mutateDraft((current) => {
			if (!current) return current;
			const nextEntries = current.entries.filter((entry) => entry.id !== entryId);
			setExpandedEntryIds((prev) => prev.filter((id) => id !== entryId));
			const nextVisibleEntries = filterEntries(nextEntries, search);
			const nextTotalPages = Math.max(1, Math.ceil(nextVisibleEntries.length / pageSize));
			setCurrentPage((prev) => Math.min(prev, nextTotalPages));
			return { ...current, entries: nextEntries };
		});
	};

	const moveEntry = (entryId: string, direction: 'up' | 'down') => {
		mutateDraft((current) => {
			if (!current) return current;
			const index = current.entries.findIndex((entry) => entry.id === entryId);
			if (index < 0) return current;
			if (direction === 'up' && index === 0) return current;
			if (direction === 'down' && index === current.entries.length - 1) return current;
			const targetIndex = direction === 'up' ? index - 1 : index + 1;
			const nextEntries = current.entries.slice();
			const temp = nextEntries[targetIndex];
			nextEntries[targetIndex] = nextEntries[index];
			nextEntries[index] = temp;
			const nextPage = resolveEntryPage(nextEntries, search, pageSize, entryId);
			if (nextPage) setCurrentPage(nextPage);
			return { ...current, entries: nextEntries };
		});
	};

	const save = () => {
		if (!draft) return;
		if (!draft.name.trim()) {
			toaster.error({ title: t('worldInfo.toasts.bookNameRequired') });
			return;
		}

		try {
			const entries = Object.fromEntries(draft.entries.map((entry) => [entry.id, toEntryPayload(entry)]));
			onSave({
				id: draft.id,
				name: draft.name.trim(),
				slug: draft.slug.trim(),
				description: draft.description.trim() || null,
				data: { entries },
				version: draft.version,
			});
			setHasChanges(false);
		} catch (error) {
			toaster.error({
				title: t('worldInfo.toasts.invalidBookJson'),
				description: error instanceof Error ? error.message : String(error),
			});
		}
	};

	return (
		<Dialog
			open={opened}
			onOpenChange={(open) => {
				if (!open) requestClose();
			}}
			title={t('worldInfo.editor.title')}
			size="cover"
			fullScreenContentMaxWidth={isMobile ? undefined : 1500}
			fillBodyHeight
			footer={
				<>
					<Button variant="subtle" disabled={saving} onClick={requestClose}>
						{t('common.cancel')}
					</Button>
					<Button loading={saving} onClick={save}>
						{t('common.save')}
					</Button>
				</>
			}
		>
			{!draft ? (
				<Text c="dimmed">{t('sidebars.selectBookToEdit')}</Text>
			) : (
				<Stack gap="sm" style={{ flex: 1, minHeight: 0 }}>
					<Group grow align="end" wrap={isMobile ? 'wrap' : 'nowrap'}>
						<TextInput
							label={t('worldInfo.fields.name')}
							value={draft.name}
							onChange={(event) => {
								const value = event.currentTarget.value;
								mutateDraft((current) => ({ ...current, name: value }));
							}}
						/>
						<TextInput
							label={t('worldInfo.fields.slug')}
							value={draft.slug}
							onChange={(event) => {
								const value = event.currentTarget.value;
								mutateDraft((current) => ({ ...current, slug: value }));
							}}
						/>
						<TextInput
							label={t('worldInfo.fields.description')}
							value={draft.description}
							onChange={(event) => {
								const value = event.currentTarget.value;
								mutateDraft((current) => ({ ...current, description: value }));
							}}
						/>
					</Group>

					<Divider />

					<Group justify="space-between" align="center">
						<Text fw={600}>{t('worldInfo.editor.entriesTitle')}</Text>
						<IconButtonWithTooltip icon={<LuPlus />} tooltip={t('worldInfo.editor.addEntry')} aria-label={t('worldInfo.editor.addEntry')} onClick={addEntry} />
					</Group>

					<Group grow align="end" wrap={isMobile ? 'wrap' : 'nowrap'}>
						<TextInput
							label={t('worldInfo.editor.searchEntries')}
							value={search}
							onChange={(event) => {
								const value = event.currentTarget.value;
								setSearch(value);
								setCurrentPage(1);
							}}
						/>
						<Select
							label={t('worldInfo.editor.pageSizeLabel')}
							value={String(pageSize)}
							data={PAGE_SIZE_OPTIONS}
							onChange={(value) => {
								const nextPageSize = Number(value ?? DEFAULT_PAGE_SIZE);
								setPageSize(nextPageSize);
								setCurrentPage(1);
							}}
							comboboxProps={{ withinPortal: false }}
						/>
					</Group>

					<Group justify="space-between" align="center" wrap="nowrap">
						{totalItems > pageSize ? <Pagination total={totalPages} value={currentPage} onChange={setCurrentPage} withEdges /> : <div />}
						<Text size="sm" c="dimmed" style={{ marginLeft: 'auto' }}>
							{t('worldInfo.editor.shownOfTotal', { shown: paginatedEntries.length, total: totalItems })}
						</Text>
					</Group>

					<ScrollArea style={{ flex: 1 }}>
						{paginatedEntries.length === 0 ? (
							<Text c="dimmed" size="sm">
								{search.trim() ? t('worldInfo.editor.noSearchResults') : t('worldInfo.editor.noEntries')}
							</Text>
						) : (
							<Accordion multiple value={expandedEntryIds} onChange={setExpandedEntryIds} variant="separated">
								{paginatedEntries.map((entry) => {
									const globalIndex = draft.entries.findIndex((item) => item.id === entry.id);
									const canMoveUp = globalIndex > 0;
									const canMoveDown = globalIndex >= 0 && globalIndex < draft.entries.length - 1;
									const isExpanded = expandedEntryIds.includes(entry.id);
									const activeEntry = entry;
									const mutateActiveEntry = (updater: (item: EntryState) => EntryState) => {
										const nextEntry = updater(activeEntry);
										mutateEntry(entry.id, () => nextEntry);
									};
									return (
										<Accordion.Item key={entry.id} value={entry.id}>
											<Accordion.Control>
												<Group justify="space-between" align="center" wrap="nowrap" style={{ width: '100%' }}>
													<Stack gap={0}>
														<Text fw={600}>{getEntryLabel(entry)}</Text>
														<Text size="xs" c="dimmed">
															{t('worldInfo.editor.entryTitle', { id: entry.id })}
														</Text>
													</Stack>
													<Group gap={4} wrap="nowrap">
														<IconButtonWithTooltip
															icon={<LuArrowUp />}
															tooltip={t('worldInfo.editor.actions.moveUp')}
															aria-label={t('worldInfo.editor.actions.moveUp')}
															disabled={!canMoveUp}
															onMouseDown={(event) => {
																event.preventDefault();
																event.stopPropagation();
															}}
															onClick={(event) => {
																event.preventDefault();
																event.stopPropagation();
																moveEntry(entry.id, 'up');
															}}
														/>
														<IconButtonWithTooltip
															icon={<LuArrowDown />}
															tooltip={t('worldInfo.editor.actions.moveDown')}
															aria-label={t('worldInfo.editor.actions.moveDown')}
															disabled={!canMoveDown}
															onMouseDown={(event) => {
																event.preventDefault();
																event.stopPropagation();
															}}
															onClick={(event) => {
																event.preventDefault();
																event.stopPropagation();
																moveEntry(entry.id, 'down');
															}}
														/>
														<IconButtonWithTooltip
															icon={<LuCopy />}
															tooltip={t('worldInfo.editor.duplicateEntry')}
															aria-label={t('worldInfo.editor.duplicateEntry')}
															onMouseDown={(event) => {
																event.preventDefault();
																event.stopPropagation();
															}}
															onClick={(event) => {
																event.preventDefault();
																event.stopPropagation();
																duplicateEntry(entry.id);
															}}
														/>
														<IconButtonWithTooltip
															icon={<LuTrash2 />}
															tooltip={t('worldInfo.editor.deleteEntry')}
															aria-label={t('worldInfo.editor.deleteEntry')}
															colorPalette="red"
															onMouseDown={(event) => {
																event.preventDefault();
																event.stopPropagation();
															}}
															onClick={(event) => {
																event.preventDefault();
																event.stopPropagation();
																deleteEntry(entry.id);
															}}
														/>
													</Group>
												</Group>
											</Accordion.Control>
											<Accordion.Panel>
												{isExpanded ? <Stack gap="sm" pb="md">
										<TextInput label={t('worldInfo.editor.fields.comment')} value={activeEntry.draft.comment} onChange={(event) => mutateActiveEntry((entry) => ({ ...entry, draft: { ...entry.draft, comment: event.currentTarget.value } }))} />
										<Group grow align="end">
											<Select label={t('worldInfo.editor.fields.strategy')} data={[{ value: 'normal', label: t('worldInfo.editor.strategy.normal') }, { value: 'constant', label: t('worldInfo.editor.strategy.constant') }, { value: 'vectorized', label: t('worldInfo.editor.strategy.vectorized') }]} value={getEntryStateMode(activeEntry.draft)} onChange={(value) => mutateActiveEntry((entry) => ({ ...entry, draft: applyEntryStateMode(entry.draft, (value as EntryStateMode) ?? 'normal') }))} comboboxProps={{ withinPortal: false }} />
											<Select label={t('worldInfo.editor.fields.position')} data={[{ value: '0', label: 'before' }, { value: '1', label: 'after' }, { value: '2', label: 'ANTop' }, { value: '3', label: 'ANBottom' }, { value: '4', label: '@depth' }, { value: '5', label: 'EMTop' }, { value: '6', label: 'EMBottom' }, { value: '7', label: 'outlet' }]} value={String(activeEntry.draft.position)} onChange={(value) => mutateActiveEntry((entry) => ({ ...entry, draft: { ...entry.draft, position: (Number(value) || 0) as EntryDraft['position'] } }))} comboboxProps={{ withinPortal: false }} />
											<NumberInput label={t('worldInfo.editor.fields.depth')} min={0} value={activeEntry.draft.depth} onChange={(value) => mutateActiveEntry((entry) => ({ ...entry, draft: { ...entry.draft, depth: Math.max(0, Number(value) || 0) } }))} />
											<NumberInput label={t('worldInfo.editor.fields.order')} value={activeEntry.draft.order} onChange={(value) => mutateActiveEntry((entry) => ({ ...entry, draft: { ...entry.draft, order: Number(value) || 0 } }))} />
											<NumberInput label={t('worldInfo.editor.fields.probability')} min={0} max={100} value={activeEntry.draft.probability} onChange={(value) => mutateActiveEntry((entry) => ({ ...entry, draft: { ...entry.draft, probability: Math.max(0, Math.min(100, Number(value) || 0)) } }))} />
										</Group>
										<Group grow>
											<Switch label={t('worldInfo.editor.fields.useProbability')} checked={activeEntry.draft.useProbability} onChange={(event) => mutateActiveEntry((entry) => ({ ...entry, draft: { ...entry.draft, useProbability: event.currentTarget.checked } }))} />
											<Switch label={t('worldInfo.editor.fields.disable')} checked={activeEntry.draft.disable} onChange={(event) => mutateActiveEntry((entry) => ({ ...entry, draft: { ...entry.draft, disable: event.currentTarget.checked } }))} />
											{activeEntry.draft.position === 7 ? (
												<TextInput label={t('worldInfo.editor.fields.outletName')} value={activeEntry.draft.outletName} onChange={(event) => mutateActiveEntry((entry) => ({ ...entry, draft: { ...entry.draft, outletName: event.currentTarget.value } }))} />
											) : (
												<Select label={t('worldInfo.editor.fields.role')} data={[{ value: '0', label: 'system' }, { value: '1', label: 'user' }, { value: '2', label: 'assistant' }]} value={String(activeEntry.draft.role)} onChange={(value) => mutateActiveEntry((entry) => ({ ...entry, draft: { ...entry.draft, role: (Number(value) || 0) as EntryDraft['role'] } }))} comboboxProps={{ withinPortal: false }} />
											)}
										</Group>
										<TagsInput label={t('worldInfo.editor.fields.key')} value={activeEntry.draft.key} onChange={(value) => mutateActiveEntry((entry) => ({ ...entry, draft: { ...entry.draft, key: value } }))} />
										<Group grow align="end">
											<Select label={t('worldInfo.editor.fields.selectiveLogic')} data={[{ value: '0', label: 'AND ANY' }, { value: '1', label: 'NOT ALL' }, { value: '2', label: 'NOT ANY' }, { value: '3', label: 'AND ALL' }]} value={String(activeEntry.draft.selectiveLogic)} onChange={(value) => mutateActiveEntry((entry) => ({ ...entry, draft: { ...entry.draft, selectiveLogic: (Number(value) || 0) as EntryDraft['selectiveLogic'] } }))} comboboxProps={{ withinPortal: false }} />
											<Switch label={t('worldInfo.editor.fields.selective')} checked={activeEntry.draft.selective} onChange={(event) => mutateActiveEntry((entry) => ({ ...entry, draft: { ...entry.draft, selective: event.currentTarget.checked } }))} />
										</Group>
										<TagsInput label={t('worldInfo.editor.fields.keysecondary')} value={activeEntry.draft.keysecondary} onChange={(value) => mutateActiveEntry((entry) => ({ ...entry, draft: { ...entry.draft, keysecondary: value } }))} />
										<Group grow align="end">
											<NumberInput label={t('worldInfo.editor.fields.scanDepth')} min={0} value={activeEntry.draft.scanDepth ?? ''} onChange={(value) => mutateActiveEntry((entry) => ({ ...entry, draft: { ...entry.draft, scanDepth: value === '' ? null : Number(value) || 0 } }))} />
											<Select label={t('worldInfo.editor.fields.caseSensitive')} data={[{ value: 'inherit', label: t('worldInfo.editor.inherit') }, { value: 'true', label: t('worldInfo.editor.true') }, { value: 'false', label: t('worldInfo.editor.false') }]} value={toNullableBool(activeEntry.draft.caseSensitive)} onChange={(value) => mutateActiveEntry((entry) => ({ ...entry, draft: { ...entry.draft, caseSensitive: parseNullableBool((value as NullableBoolSelect) ?? 'inherit') } }))} comboboxProps={{ withinPortal: false }} />
											<Select label={t('worldInfo.editor.fields.matchWholeWords')} data={[{ value: 'inherit', label: t('worldInfo.editor.inherit') }, { value: 'true', label: t('worldInfo.editor.true') }, { value: 'false', label: t('worldInfo.editor.false') }]} value={toNullableBool(activeEntry.draft.matchWholeWords)} onChange={(value) => mutateActiveEntry((entry) => ({ ...entry, draft: { ...entry.draft, matchWholeWords: parseNullableBool((value as NullableBoolSelect) ?? 'inherit') } }))} comboboxProps={{ withinPortal: false }} />
											<Select label={t('worldInfo.editor.fields.useGroupScoring')} data={[{ value: 'inherit', label: t('worldInfo.editor.inherit') }, { value: 'true', label: t('worldInfo.editor.true') }, { value: 'false', label: t('worldInfo.editor.false') }]} value={toNullableBool(activeEntry.draft.useGroupScoring)} onChange={(value) => mutateActiveEntry((entry) => ({ ...entry, draft: { ...entry.draft, useGroupScoring: parseNullableBool((value as NullableBoolSelect) ?? 'inherit') } }))} comboboxProps={{ withinPortal: false }} />
											<TextInput label={t('worldInfo.editor.fields.automationId')} value={activeEntry.draft.automationId} onChange={(event) => mutateActiveEntry((entry) => ({ ...entry, draft: { ...entry.draft, automationId: event.currentTarget.value } }))} />
										</Group>
										<Group grow>
											<Switch label={t('worldInfo.editor.fields.excludeRecursion')} checked={activeEntry.draft.excludeRecursion} onChange={(event) => mutateActiveEntry((entry) => ({ ...entry, draft: { ...entry.draft, excludeRecursion: event.currentTarget.checked } }))} />
											<Switch label={t('worldInfo.editor.fields.preventRecursion')} checked={activeEntry.draft.preventRecursion} onChange={(event) => mutateActiveEntry((entry) => ({ ...entry, draft: { ...entry.draft, preventRecursion: event.currentTarget.checked } }))} />
											<Switch label={t('worldInfo.editor.fields.ignoreBudget')} checked={activeEntry.draft.ignoreBudget} onChange={(event) => mutateActiveEntry((entry) => ({ ...entry, draft: { ...entry.draft, ignoreBudget: event.currentTarget.checked } }))} />
											<NumberInput label={t('worldInfo.editor.fields.delayUntilRecursion')} min={0} value={activeEntry.draft.delayUntilRecursion} onChange={(value) => mutateActiveEntry((entry) => ({ ...entry, draft: { ...entry.draft, delayUntilRecursion: Math.max(0, Number(value) || 0) } }))} />
										</Group>
										<Textarea
											label={
												<Group gap={6} wrap="nowrap" align="center">
													{t('worldInfo.editor.fields.content')}
													<LiquidDocsButton context="world_info_entry" />
												</Group>
											}
											minRows={8}
											autosize
											value={activeEntry.draft.content}
											onChange={(event) =>
												mutateActiveEntry((entry) => ({
													...entry,
													draft: { ...entry.draft, content: event.currentTarget.value },
												}))
											}
										/>
										<Group grow align="end">
											<TextInput label={t('worldInfo.editor.fields.group')} value={activeEntry.draft.group} onChange={(event) => mutateActiveEntry((entry) => ({ ...entry, draft: { ...entry.draft, group: event.currentTarget.value } }))} />
											<Switch label={t('worldInfo.editor.fields.groupOverride')} checked={activeEntry.draft.groupOverride} onChange={(event) => mutateActiveEntry((entry) => ({ ...entry, draft: { ...entry.draft, groupOverride: event.currentTarget.checked } }))} />
											<NumberInput label={t('worldInfo.editor.fields.groupWeight')} min={0} value={activeEntry.draft.groupWeight} onChange={(value) => mutateActiveEntry((entry) => ({ ...entry, draft: { ...entry.draft, groupWeight: Math.max(0, Number(value) || 0) } }))} />
											<NumberInput label={t('worldInfo.editor.fields.sticky')} min={0} value={activeEntry.draft.sticky ?? ''} onChange={(value) => mutateActiveEntry((entry) => ({ ...entry, draft: { ...entry.draft, sticky: value === '' ? null : Number(value) || 0 } }))} />
											<NumberInput label={t('worldInfo.editor.fields.cooldown')} min={0} value={activeEntry.draft.cooldown ?? ''} onChange={(value) => mutateActiveEntry((entry) => ({ ...entry, draft: { ...entry.draft, cooldown: value === '' ? null : Number(value) || 0 } }))} />
											<NumberInput label={t('worldInfo.editor.fields.delay')} min={0} value={activeEntry.draft.delay ?? ''} onChange={(value) => mutateActiveEntry((entry) => ({ ...entry, draft: { ...entry.draft, delay: value === '' ? null : Number(value) || 0 } }))} />
										</Group>
										<Group grow>
											<Switch label={t('worldInfo.editor.fields.characterFilterExclude')} checked={activeEntry.draft.characterFilter.isExclude} onChange={(event) => mutateActiveEntry((entry) => ({ ...entry, draft: { ...entry.draft, characterFilter: { ...entry.draft.characterFilter, isExclude: event.currentTarget.checked } } }))} />
											<TagsInput label={t('worldInfo.editor.fields.characterFilterNames')} value={activeEntry.draft.characterFilter.names} onChange={(value) => mutateActiveEntry((entry) => ({ ...entry, draft: { ...entry.draft, characterFilter: { ...entry.draft.characterFilter, names: value } } }))} />
											<TagsInput label={t('worldInfo.editor.fields.characterFilterTags')} value={activeEntry.draft.characterFilter.tags} onChange={(value) => mutateActiveEntry((entry) => ({ ...entry, draft: { ...entry.draft, characterFilter: { ...entry.draft.characterFilter, tags: value } } }))} />
										</Group>
										<MultiSelect label={t('worldInfo.editor.fields.triggers')} data={ST_TRIGGER_OPTIONS} value={activeEntry.draft.triggers} onChange={(value) => mutateActiveEntry((entry) => ({ ...entry, draft: { ...entry.draft, triggers: normalizeTriggerArray(value) } }))} clearable comboboxProps={{ withinPortal: false }} />
										<Accordion variant="separated">
											<Accordion.Item value="additional-matching-sources">
												<Accordion.Control>{t('worldInfo.editor.fields.additionalMatchingSources')}</Accordion.Control>
												<Accordion.Panel>
													<Group grow>
														<Switch label={t('worldInfo.editor.fields.matchPersonaDescription')} checked={activeEntry.draft.matchPersonaDescription} onChange={(event) => mutateActiveEntry((entry) => ({ ...entry, draft: { ...entry.draft, matchPersonaDescription: event.currentTarget.checked } }))} />
														<Switch label={t('worldInfo.editor.fields.matchCharacterDescription')} checked={activeEntry.draft.matchCharacterDescription} onChange={(event) => mutateActiveEntry((entry) => ({ ...entry, draft: { ...entry.draft, matchCharacterDescription: event.currentTarget.checked } }))} />
														<Switch label={t('worldInfo.editor.fields.matchCharacterPersonality')} checked={activeEntry.draft.matchCharacterPersonality} onChange={(event) => mutateActiveEntry((entry) => ({ ...entry, draft: { ...entry.draft, matchCharacterPersonality: event.currentTarget.checked } }))} />
													</Group>
													<Group grow>
														<Switch label={t('worldInfo.editor.fields.matchCharacterDepthPrompt')} checked={activeEntry.draft.matchCharacterDepthPrompt} onChange={(event) => mutateActiveEntry((entry) => ({ ...entry, draft: { ...entry.draft, matchCharacterDepthPrompt: event.currentTarget.checked } }))} />
														<Switch label={t('worldInfo.editor.fields.matchScenario')} checked={activeEntry.draft.matchScenario} onChange={(event) => mutateActiveEntry((entry) => ({ ...entry, draft: { ...entry.draft, matchScenario: event.currentTarget.checked } }))} />
														<Switch label={t('worldInfo.editor.fields.matchCreatorNotes')} checked={activeEntry.draft.matchCreatorNotes} onChange={(event) => mutateActiveEntry((entry) => ({ ...entry, draft: { ...entry.draft, matchCreatorNotes: event.currentTarget.checked } }))} />
													</Group>
												</Accordion.Panel>
											</Accordion.Item>
											<Accordion.Item value="advanced">
												<Accordion.Control>{t('worldInfo.editor.fields.advanced')}</Accordion.Control>
												<Accordion.Panel>
													<Stack gap="sm">
														<NumberInput label={t('worldInfo.editor.fields.uid')} min={0} value={activeEntry.draft.uid} onChange={(value) => mutateActiveEntry((entry) => ({ ...entry, draft: { ...entry.draft, uid: Math.max(0, Number(value) || 0) } }))} />
														<Textarea label={t('worldInfo.editor.fields.extensionsJson')} minRows={6} autosize value={activeEntry.draft.extensionsJson} onChange={(event) => mutateActiveEntry((entry) => ({ ...entry, draft: { ...entry.draft, extensionsJson: event.currentTarget.value } }))} />
													</Stack>
												</Accordion.Panel>
											</Accordion.Item>
										</Accordion>
									</Stack> : null}
											</Accordion.Panel>
										</Accordion.Item>
									);
								})}
							</Accordion>
						)}
					</ScrollArea>
				</Stack>
			)}
		</Dialog>
	);
};
