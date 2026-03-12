import { combine, createEffect, createEvent, createStore, sample } from 'effector';

import { toaster } from '@ui/toaster';

import {
	createInstruction,
	deleteInstruction,
	listInstructions,
	updateInstruction,
} from '../../api/instructions';
import i18n from '../../i18n';
import { $currentChat, setChatInstructionRequested, setOpenedChat } from '../chat-core';
import { createEmptyStBaseConfig } from './st-preset';

import type { CreateInstructionDraft, InstructionDto } from '../../api/instructions';
import type { InstructionMeta, StBaseConfig } from '@shared/types/instructions';

export type InstructionEditorDraft =
	| {
			sourceInstructionId: string;
			kind: 'basic';
			name: string;
			templateText: string;
			meta?: InstructionMeta;
	  }
	| {
			sourceInstructionId: string;
			kind: 'st_base';
			name: string;
			stBase: StBaseConfig;
			meta?: InstructionMeta;
	  };

function isInstructionDto(value: unknown): value is InstructionDto {
	if (!value || typeof value !== 'object') return false;
	const item = value as Record<string, unknown>;
	if (
		typeof item.id !== 'string' ||
		item.id.trim().length === 0 ||
		typeof item.name !== 'string' ||
		item.engine !== 'liquidjs'
	) {
		return false;
	}

	if (item.kind === 'basic') {
		return typeof item.templateText === 'string';
	}

	if (item.kind === 'st_base') {
		return typeof item.stBase === 'object' && item.stBase !== null;
	}

	return false;
}

function resolveCopyName(originalName: string, usedNames: Set<string>): string {
	const firstCopy = `${originalName} (copy)`;
	if (!usedNames.has(firstCopy)) return firstCopy;
	let index = 2;
	while (usedNames.has(`${originalName} (copy ${index})`)) {
		index += 1;
	}
	return `${originalName} (copy ${index})`;
}

export const loadInstructionsFx = createEffect(async () => {
	const raw = await listInstructions();
	return raw.filter(isInstructionDto);
});

export const $instructions = createStore<InstructionDto[]>([]).on(loadInstructionsFx.doneData, (_, items) => items);

export const setSelectedInstructionId = createEvent<string | null>();
export const $selectedInstructionId = createStore<string | null>(null).on(
	setSelectedInstructionId,
	(_, id) => id,
);

export const $selectedInstruction = combine($instructions, $selectedInstructionId, (items, id) => {
	if (!id) return null;
	return items.find((t) => t.id === id) ?? null;
});

export const instructionSelected = createEvent<string>();
export const instructionEditorDraftChanged = createEvent<InstructionEditorDraft | null>();

const refreshRequested = createEvent();

sample({
	clock: refreshRequested,
	target: loadInstructionsFx,
});

sample({
	clock: setOpenedChat,
	fn: ({ chat }) => chat.instructionId,
	target: setSelectedInstructionId,
});

sample({
	clock: loadInstructionsFx.doneData,
	source: { selectedId: $selectedInstructionId, chat: $currentChat },
	fn: ({ selectedId, chat }, items) => {
		if (items.length === 0) return null;
		const ids = new Set(items.map((t) => t.id));

		const chatId = chat?.instructionId ?? null;
		if (chatId && ids.has(chatId)) return chatId;
		if (selectedId && ids.has(selectedId)) return selectedId;
		return items[0]?.id ?? null;
	},
	target: setSelectedInstructionId,
});

sample({
	clock: loadInstructionsFx.doneData,
	source: $currentChat,
	filter: (chat, items) => Boolean(chat?.id) && Boolean(chat?.instructionId) && !items.some((t) => t.id === chat?.instructionId),
	fn: (_chat, items) => ({ instructionId: items[0]?.id ?? null }),
	target: setChatInstructionRequested,
});

sample({
	clock: [setOpenedChat, loadInstructionsFx.doneData],
	source: { chat: $currentChat, instructions: $instructions },
	filter: ({ chat, instructions }) => Boolean(chat?.id) && !chat?.instructionId && instructions.length > 0,
	fn: ({ instructions }) => instructions[0].id,
	target: setSelectedInstructionId,
});

sample({
	clock: [setOpenedChat, loadInstructionsFx.doneData],
	source: { chat: $currentChat, instructions: $instructions },
	filter: ({ chat, instructions }) => Boolean(chat?.id) && !chat?.instructionId && instructions.length > 0,
	fn: ({ instructions }) => ({ instructionId: instructions[0].id }),
	target: setChatInstructionRequested,
});

sample({
	clock: instructionSelected,
	fn: (id) => id,
	target: setSelectedInstructionId,
});

sample({
	clock: instructionSelected,
	source: $currentChat,
	filter: (chat, id) => Boolean(chat?.id) && chat?.instructionId !== id,
	fn: (_chat, id) => ({ instructionId: id }),
	target: setChatInstructionRequested,
});

export const createInstructionFx = createEffect(async (params: CreateInstructionDraft) => createInstruction(params));

export const updateInstructionFx = createEffect(
	async (
		params:
			| { id: string; kind: 'basic'; name: string; templateText: string; meta?: InstructionMeta }
			| { id: string; kind: 'st_base'; name: string; stBase: StBaseConfig; meta?: InstructionMeta }
	) => updateInstruction(params),
);

export const deleteInstructionFx = createEffect(async (params: { id: string }) => deleteInstruction(params.id));

export const $instructionEditorDraft = createStore<InstructionEditorDraft | null>(null)
	.on(instructionEditorDraftChanged, (_, draft) => draft)
	.reset(setSelectedInstructionId, deleteInstructionFx.doneData);

export const createInstructionRequested = createEvent<{ kind: 'basic' | 'st_base' }>();
export const duplicateInstructionRequested = createEvent<{ id: string }>();
export const importInstructionRequested = createEvent<CreateInstructionDraft>();
export const updateInstructionRequested = createEvent<
	| { id: string; kind: 'basic'; name: string; templateText: string; meta?: InstructionMeta }
	| { id: string; kind: 'st_base'; name: string; stBase: StBaseConfig; meta?: InstructionMeta }
>();
export const deleteInstructionRequested = createEvent<{ id: string }>();

sample({
	clock: createInstructionRequested,
	fn: ({ kind }) =>
		kind === 'basic'
			? {
					kind: 'basic' as const,
					name: i18n.t('instructions.defaults.newInstruction'),
					templateText: '{{char.name}}',
			  }
			: {
				kind: 'st_base' as const,
				name: i18n.t('instructions.defaults.newStBaseInstruction'),
				stBase: createEmptyStBaseConfig(),
			  },
	target: createInstructionFx,
});

sample({
	clock: duplicateInstructionRequested,
	source: $instructions,
	filter: (items, payload) => items.some((t) => t.id === payload.id),
	fn: (items, payload): CreateInstructionDraft => {
		const instruction = items.find((t) => t.id === payload.id)!;
		const usedNames = new Set(items.map((item) => item.name));
		const name = resolveCopyName(instruction.name, usedNames);
		const meta = { ...(instruction.meta ?? {}), duplicatedFromId: instruction.id, source: 'duplicate' };
		if (instruction.kind === 'st_base') {
			return {
				kind: 'st_base',
				name,
				stBase: structuredClone(instruction.stBase),
				meta,
			};
		}
		return {
			kind: 'basic',
			name,
			templateText: instruction.templateText,
			meta,
		};
	},
	target: createInstructionFx,
});

sample({
	clock: importInstructionRequested,
	source: $instructions,
	fn: (items, payload) => {
		const usedNames = new Set(items.map((item) => item.name));
		const name = usedNames.has(payload.name)
			? resolveCopyName(payload.name, usedNames)
			: payload.name;
		return {
			...payload,
			name,
		};
	},
	target: createInstructionFx,
});

sample({
	clock: updateInstructionRequested,
	target: updateInstructionFx,
});

sample({
	clock: deleteInstructionRequested,
	target: deleteInstructionFx,
});

sample({
	clock: createInstructionFx.doneData,
	fn: (created) => created.id,
	target: setSelectedInstructionId,
});

sample({
	clock: createInstructionFx.doneData,
	fn: (created) => ({ instructionId: created.id }),
	target: setChatInstructionRequested,
});

sample({
	clock: [createInstructionFx.doneData, updateInstructionFx.doneData, deleteInstructionFx.doneData],
	target: refreshRequested,
});

createInstructionFx.failData.watch((error) => {
	toaster.error({
		title: i18n.t('instructions.toasts.createErrorTitle'),
		description: error instanceof Error ? error.message : String(error),
	});
});

updateInstructionFx.failData.watch((error) => {
	toaster.error({
		title: i18n.t('instructions.toasts.saveErrorTitle'),
		description: error instanceof Error ? error.message : String(error),
	});
});

deleteInstructionFx.failData.watch((error) => {
	toaster.error({
		title: i18n.t('instructions.toasts.deleteErrorTitle'),
		description: error instanceof Error ? error.message : String(error),
	});
});

export const instructionsInitRequested = refreshRequested;
