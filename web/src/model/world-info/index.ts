import { combine, createEffect, createEvent, createStore, sample } from 'effector';

import {
	createWorldInfoBook,
	deleteWorldInfoBook,
	duplicateWorldInfoBook,
	getWorldInfoBook,
	getWorldInfoSettings,
	importWorldInfoBook,
	listWorldInfoBindings,
	listWorldInfoBooks,
	replaceWorldInfoBindings,
	updateWorldInfoBook,
	updateWorldInfoSettings,
	type WorldInfoBindingDto,
	type WorldInfoBookData,
	type WorldInfoBookDto,
	type WorldInfoBookSummaryDto,
	type WorldInfoScope,
	type WorldInfoSettingsDto,
} from '../../api/world-info';
import i18n from '../../i18n';
import { toaster } from '../../ui/toaster';
import { $currentChat, setOpenedChat } from '../chat-core';

import { buildSingleBindingItems, createCanonicalBookMapByScopeId, pickCanonicalBinding } from './binding-utils';

import type { ChatDto } from '../../api/chat-core';

const DEFAULT_OWNER_ID = 'global';

const DEFAULT_BOOK_DATA: WorldInfoBookData = {
	entries: {},
	extensions: {},
};

type ScopeBindingParams = {
	scope: WorldInfoScope;
	scopeId?: string | null;
	bookId: string | null;
};

type EntityBindingParams = {
	entityProfileId: string;
	bookId: string | null;
	silent?: boolean;
};

type PersonaBindingParams = {
	personaId: string;
	bookId: string | null;
	silent?: boolean;
};

async function replaceSingleBinding(params: ScopeBindingParams): Promise<WorldInfoBindingDto[]> {
	return replaceWorldInfoBindings({
		ownerId: DEFAULT_OWNER_ID,
		scope: params.scope,
		scopeId: params.scopeId,
		items: buildSingleBindingItems(params.bookId),
	});
}

function showBindingSuccessToast(): void {
	toaster.success({ title: i18n.t('worldInfo.toasts.bindingUpdated') });
}

function showBindingErrorToast(error: unknown): void {
	toaster.error({
		title: i18n.t('worldInfo.toasts.bindingUpdateErrorTitle'),
		description: error instanceof Error ? error.message : String(error),
	});
}

export const worldInfoRefreshRequested = createEvent();
export const worldInfoBookSelected = createEvent<string | null>();
export const worldInfoBookCreateRequested = createEvent();
export const worldInfoBookDuplicateRequested = createEvent<{ id: string }>();
export const worldInfoBookDeleteRequested = createEvent<{ id: string }>();
export const worldInfoBookSaveRequested = createEvent<{
	id: string;
	name: string;
	slug: string;
	description: string | null;
	data: unknown;
	version: number;
}>();
export const worldInfoSettingsSaveRequested = createEvent<{
	patch: Partial<Omit<WorldInfoSettingsDto, 'ownerId' | 'createdAt' | 'updatedAt'>>;
}>();
export const worldInfoImportBookRequested = createEvent<{ file: File }>();
export const worldInfoEditorOpenRequested = createEvent<{ bookId: string | null }>();
export const setWorldInfoBookBoundToGlobalRequested = createEvent<{ bookId: string | null }>();
export const setWorldInfoBookBoundToCurrentChatRequested = createEvent<{ chatId: string; bookId: string | null }>();
export const setWorldInfoBookBoundToEntityRequested = createEvent<EntityBindingParams>();
export const setWorldInfoBookBoundToPersonaRequested = createEvent<PersonaBindingParams>();

export const loadWorldInfoBooksFx = createEffect(async (): Promise<WorldInfoBookSummaryDto[]> => {
	const response = await listWorldInfoBooks({ ownerId: DEFAULT_OWNER_ID, limit: 200 });
	return response.items;
});

export const loadWorldInfoBookFx = createEffect(async (id: string): Promise<WorldInfoBookDto> => {
	return getWorldInfoBook(id);
});

export const loadWorldInfoSettingsFx = createEffect(async (): Promise<WorldInfoSettingsDto> => {
	return getWorldInfoSettings(DEFAULT_OWNER_ID);
});

export const loadWorldInfoGlobalBindingsFx = createEffect(async (): Promise<WorldInfoBindingDto[]> => {
	return listWorldInfoBindings({
		ownerId: DEFAULT_OWNER_ID,
		scope: 'global',
	});
});

export const loadWorldInfoChatBindingsFx = createEffect(async (params: { chatId: string }): Promise<WorldInfoBindingDto[]> => {
	return listWorldInfoBindings({
		ownerId: DEFAULT_OWNER_ID,
		scope: 'chat',
		scopeId: params.chatId,
	});
});

export const loadWorldInfoEntityBindingsFx = createEffect(async (): Promise<WorldInfoBindingDto[]> => {
	return listWorldInfoBindings({
		ownerId: DEFAULT_OWNER_ID,
		scope: 'entity_profile',
	});
});

export const loadWorldInfoPersonaBindingsFx = createEffect(async (): Promise<WorldInfoBindingDto[]> => {
	return listWorldInfoBindings({
		ownerId: DEFAULT_OWNER_ID,
		scope: 'persona',
	});
});

export const createWorldInfoBookFx = createEffect(async (): Promise<WorldInfoBookDto> => {
	return createWorldInfoBook({
		ownerId: DEFAULT_OWNER_ID,
		name: i18n.t('worldInfo.defaults.newBook'),
		data: DEFAULT_BOOK_DATA,
	});
});

export const duplicateWorldInfoBookFx = createEffect(async (params: { id: string }): Promise<WorldInfoBookDto> => {
	return duplicateWorldInfoBook({ id: params.id, ownerId: DEFAULT_OWNER_ID });
});

export const deleteWorldInfoBookFx = createEffect(async (params: { id: string }): Promise<{ id: string }> => {
	return deleteWorldInfoBook(params.id);
});

export const saveWorldInfoBookFx = createEffect(
	async (params: { id: string; name: string; slug: string; description: string | null; data: unknown; version: number }) => {
		return updateWorldInfoBook({
			id: params.id,
			ownerId: DEFAULT_OWNER_ID,
			name: params.name,
			slug: params.slug,
			description: params.description,
			data: params.data,
			version: params.version,
		});
	},
);

export const saveWorldInfoSettingsFx = createEffect(
	async (params: { patch: Partial<Omit<WorldInfoSettingsDto, 'ownerId' | 'createdAt' | 'updatedAt'>> }) => {
		return updateWorldInfoSettings({ ownerId: DEFAULT_OWNER_ID, patch: params.patch });
	},
);

export const setWorldInfoBookBoundToGlobalFx = createEffect(async (params: { bookId: string | null }) => {
	return replaceSingleBinding({
		scope: 'global',
		bookId: params.bookId,
	});
});

export const setWorldInfoBookBoundToCurrentChatFx = createEffect(async (params: { chatId: string; bookId: string | null }) => {
	return replaceSingleBinding({
		scope: 'chat',
		scopeId: params.chatId,
		bookId: params.bookId,
	});
});

export const setWorldInfoBookBoundToEntityFx = createEffect(async (params: EntityBindingParams): Promise<WorldInfoBindingDto[]> => {
	return replaceSingleBinding({
		scope: 'entity_profile',
		scopeId: params.entityProfileId,
		bookId: params.bookId,
	});
});

export const setWorldInfoBookBoundToPersonaFx = createEffect(async (params: PersonaBindingParams): Promise<WorldInfoBindingDto[]> => {
	return replaceSingleBinding({
		scope: 'persona',
		scopeId: params.personaId,
		bookId: params.bookId,
	});
});

export const importWorldInfoBookFx = createEffect(async (params: { file: File }) => {
	return importWorldInfoBook({ file: params.file, ownerId: DEFAULT_OWNER_ID, format: 'auto' });
});

export const $worldInfoBooks = createStore<WorldInfoBookSummaryDto[]>([]).on(loadWorldInfoBooksFx.doneData, (_, items) => items);

export const $selectedWorldInfoBookId = createStore<string | null>(null).on(worldInfoBookSelected, (_, id) => id);
export const $worldInfoEditorLaunch = createStore<{ nonce: number; bookId: string | null }>({ nonce: 0, bookId: null }).on(
	worldInfoEditorOpenRequested,
	(state, payload) => ({
		nonce: state.nonce + 1,
		bookId: payload.bookId,
	}),
);

export const clearSelectedWorldInfoBook = createEvent();

export const $selectedWorldInfoBook = createStore<WorldInfoBookDto | null>(null)
	.on(loadWorldInfoBookFx.doneData, (_, item) => item)
	.on(saveWorldInfoBookFx.doneData, (_, item) => item)
	.on(clearSelectedWorldInfoBook, () => null);

export const $worldInfoSettings = createStore<WorldInfoSettingsDto | null>(null)
	.on(loadWorldInfoSettingsFx.doneData, (_, settings) => settings)
	.on(saveWorldInfoSettingsFx.doneData, (_, settings) => settings);

export const $worldInfoGlobalBindings = createStore<WorldInfoBindingDto[]>([])
	.on(loadWorldInfoGlobalBindingsFx.doneData, (_, items) => items)
	.on(setWorldInfoBookBoundToGlobalFx.doneData, (_, items) => items);

export const $worldInfoChatBindings = createStore<WorldInfoBindingDto[]>([])
	.on(loadWorldInfoChatBindingsFx.doneData, (_, items) => items)
	.on(setWorldInfoBookBoundToCurrentChatFx.doneData, (_, items) => items);

export const $worldInfoEntityBindings = createStore<WorldInfoBindingDto[]>([])
	.on(loadWorldInfoEntityBindingsFx.doneData, (_, items) => items);

export const $worldInfoPersonaBindings = createStore<WorldInfoBindingDto[]>([])
	.on(loadWorldInfoPersonaBindingsFx.doneData, (_, items) => items);

export const $worldInfoGlobalBookId = $worldInfoGlobalBindings.map((bindings) => pickCanonicalBinding(bindings)?.bookId ?? null);

export const $worldInfoCurrentChatBookId = combine(
	$currentChat,
	$worldInfoChatBindings,
	(chat, bindings) => (chat ? pickCanonicalBinding(bindings)?.bookId ?? null : null),
);

export const $worldInfoEntityBookByProfileId = $worldInfoEntityBindings.map((bindings) => createCanonicalBookMapByScopeId(bindings));

export const $worldInfoPersonaBookByPersonaId = $worldInfoPersonaBindings.map((bindings) => createCanonicalBookMapByScopeId(bindings));

sample({
	clock: worldInfoRefreshRequested,
	target: [
		loadWorldInfoBooksFx,
		loadWorldInfoSettingsFx,
		loadWorldInfoGlobalBindingsFx,
		loadWorldInfoEntityBindingsFx,
		loadWorldInfoPersonaBindingsFx,
	],
});

sample({
	clock: loadWorldInfoBooksFx.doneData,
	source: $selectedWorldInfoBookId,
	fn: (selectedId, items) => {
		if (selectedId && items.some((item) => item.id === selectedId)) return selectedId;
		return items[0]?.id ?? null;
	},
	target: worldInfoBookSelected,
});

sample({
	clock: worldInfoBookSelected,
	filter: (id): id is string => Boolean(id),
	target: loadWorldInfoBookFx,
});

sample({
	clock: worldInfoBookSelected,
	filter: (id) => !id,
	target: clearSelectedWorldInfoBook,
});

sample({
	clock: worldInfoBookCreateRequested,
	target: createWorldInfoBookFx,
});

sample({
	clock: worldInfoBookDuplicateRequested,
	target: duplicateWorldInfoBookFx,
});

sample({
	clock: worldInfoBookDeleteRequested,
	target: deleteWorldInfoBookFx,
});

sample({
	clock: worldInfoBookSaveRequested,
	target: saveWorldInfoBookFx,
});

sample({
	clock: worldInfoSettingsSaveRequested,
	target: saveWorldInfoSettingsFx,
});

sample({
	clock: worldInfoImportBookRequested,
	target: importWorldInfoBookFx,
});

sample({
	clock: [createWorldInfoBookFx.doneData, duplicateWorldInfoBookFx.doneData, importWorldInfoBookFx.doneData],
	fn: (result) => ('book' in result ? result.book.id : result.id),
	target: worldInfoBookSelected,
});

sample({
	clock: [createWorldInfoBookFx.doneData, duplicateWorldInfoBookFx.doneData, deleteWorldInfoBookFx.doneData, importWorldInfoBookFx.doneData],
	target: loadWorldInfoBooksFx,
});

sample({
	clock: [deleteWorldInfoBookFx.doneData, importWorldInfoBookFx.doneData],
	target: [loadWorldInfoGlobalBindingsFx, loadWorldInfoEntityBindingsFx, loadWorldInfoPersonaBindingsFx],
});

sample({
	clock: [deleteWorldInfoBookFx.doneData, importWorldInfoBookFx.doneData],
	source: $currentChat,
	filter: (chat): chat is ChatDto => Boolean(chat?.id),
	fn: (chat) => ({ chatId: chat!.id }),
	target: loadWorldInfoChatBindingsFx,
});

sample({
	clock: saveWorldInfoBookFx.doneData,
	target: loadWorldInfoBooksFx,
});

sample({
	clock: setOpenedChat,
	fn: ({ chat }) => ({ chatId: chat.id }),
	target: loadWorldInfoChatBindingsFx,
});

sample({
	clock: setWorldInfoBookBoundToGlobalRequested,
	target: setWorldInfoBookBoundToGlobalFx,
});

sample({
	clock: setWorldInfoBookBoundToCurrentChatRequested,
	target: setWorldInfoBookBoundToCurrentChatFx,
});

sample({
	clock: setWorldInfoBookBoundToEntityRequested,
	target: setWorldInfoBookBoundToEntityFx,
});

sample({
	clock: setWorldInfoBookBoundToPersonaRequested,
	target: setWorldInfoBookBoundToPersonaFx,
});

sample({
	clock: setWorldInfoBookBoundToEntityFx.doneData,
	target: loadWorldInfoEntityBindingsFx,
});

sample({
	clock: setWorldInfoBookBoundToPersonaFx.doneData,
	target: loadWorldInfoPersonaBindingsFx,
});

createWorldInfoBookFx.failData.watch((error) => {
	toaster.error({ title: i18n.t('worldInfo.toasts.createErrorTitle'), description: error instanceof Error ? error.message : String(error) });
});

duplicateWorldInfoBookFx.failData.watch((error) => {
	toaster.error({ title: i18n.t('worldInfo.toasts.duplicateErrorTitle'), description: error instanceof Error ? error.message : String(error) });
});

deleteWorldInfoBookFx.failData.watch((error) => {
	toaster.error({ title: i18n.t('worldInfo.toasts.deleteErrorTitle'), description: error instanceof Error ? error.message : String(error) });
});

saveWorldInfoBookFx.doneData.watch(() => {
	toaster.success({ title: i18n.t('worldInfo.toasts.bookSaved') });
});

saveWorldInfoBookFx.failData.watch((error) => {
	toaster.error({ title: i18n.t('worldInfo.toasts.saveBookErrorTitle'), description: error instanceof Error ? error.message : String(error) });
});

saveWorldInfoSettingsFx.doneData.watch(() => {
	toaster.success({ title: i18n.t('worldInfo.toasts.settingsSaved') });
});

saveWorldInfoSettingsFx.failData.watch((error) => {
	toaster.error({ title: i18n.t('worldInfo.toasts.saveSettingsErrorTitle'), description: error instanceof Error ? error.message : String(error) });
});

setWorldInfoBookBoundToGlobalFx.doneData.watch(() => {
	showBindingSuccessToast();
});

setWorldInfoBookBoundToCurrentChatFx.doneData.watch(() => {
	showBindingSuccessToast();
});

setWorldInfoBookBoundToEntityFx.done.watch(({ params }) => {
	if (params.silent) return;
	showBindingSuccessToast();
});

setWorldInfoBookBoundToPersonaFx.done.watch(({ params }) => {
	if (params.silent) return;
	showBindingSuccessToast();
});

setWorldInfoBookBoundToGlobalFx.failData.watch((error) => {
	showBindingErrorToast(error);
});

setWorldInfoBookBoundToCurrentChatFx.failData.watch((error) => {
	showBindingErrorToast(error);
});

setWorldInfoBookBoundToEntityFx.fail.watch(({ params, error }) => {
	if (params.silent) return;
	showBindingErrorToast(error);
});

setWorldInfoBookBoundToPersonaFx.fail.watch(({ params, error }) => {
	if (params.silent) return;
	showBindingErrorToast(error);
});

importWorldInfoBookFx.doneData.watch((result) => {
	const warningSuffix = result.warnings.length > 0 ? ` (${result.warnings.join('; ')})` : '';
	toaster.success({ title: i18n.t('worldInfo.toasts.importedBook', { name: result.book.name, warningSuffix }) });
});

importWorldInfoBookFx.failData.watch((error) => {
	toaster.error({ title: i18n.t('worldInfo.toasts.importErrorTitle'), description: error instanceof Error ? error.message : String(error) });
});

loadWorldInfoBooksFx.failData.watch((error) => {
	toaster.error({ title: i18n.t('worldInfo.toasts.loadBooksErrorTitle'), description: error instanceof Error ? error.message : String(error) });
});

loadWorldInfoSettingsFx.failData.watch((error) => {
	toaster.error({ title: i18n.t('worldInfo.toasts.loadSettingsErrorTitle'), description: error instanceof Error ? error.message : String(error) });
});

loadWorldInfoBookFx.failData.watch((error) => {
	toaster.error({ title: i18n.t('worldInfo.toasts.loadBookErrorTitle'), description: error instanceof Error ? error.message : String(error) });
});

export const worldInfoInitRequested = worldInfoRefreshRequested;
