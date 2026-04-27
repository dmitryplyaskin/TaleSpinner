import { describe, expect, it } from 'vitest';

import {
	buildEntryPartsEditorRequestParts,
	createDraftPartFromSource,
	resolveFallbackMainPartId,
} from './entry-parts-editor-state';

import type { Part } from '@shared/types/chat-entry-parts';

function makePart(params: Partial<Part> & Pick<Part, 'partId'>): Part {
	return {
		partId: params.partId,
		channel: params.channel ?? 'aux',
		order: params.order ?? 0,
		payload: params.payload ?? '',
		payloadFormat: params.payloadFormat ?? 'markdown',
		visibility: params.visibility ?? { ui: 'always', prompt: true },
		ui: { rendererId: 'markdown' },
		prompt: { serializerId: 'asMarkdown' },
		lifespan: 'infinite',
		createdTurn: 1,
		source: params.source ?? 'user',
	};
}

describe('entry parts editor state', () => {
	it('builds hard-delete request entries for removed source parts', () => {
		const keep = createDraftPartFromSource(makePart({ partId: 'keep', channel: 'main', payload: 'keep' }));
		const remove = makePart({ partId: 'remove', channel: 'aux', payload: 'remove' });

		const requestParts = buildEntryPartsEditorRequestParts({
			draftParts: [keep],
			removedParts: [remove],
		});

		expect(requestParts).toEqual([
			expect.objectContaining({ partId: 'keep', deleted: false }),
			expect.objectContaining({ partId: 'remove', deleted: true, payload: 'remove' }),
		]);
	});

	it('keeps new block identity and format in save payload', () => {
		const newPart = {
			id: 'new-block',
			clientPartId: 'new-block',
			channel: 'aux' as const,
			payloadFormat: 'json' as const,
			source: 'user' as const,
			replacesPartId: null,
			visibilityUi: 'always' as const,
			visibilityPrompt: false,
			payloadRaw: '{"ok":true}',
		};

		const requestParts = buildEntryPartsEditorRequestParts({
			draftParts: [newPart],
			removedParts: [],
		});

		expect(requestParts).toEqual([
			expect.objectContaining({
				clientPartId: 'new-block',
				channel: 'aux',
				payloadFormat: 'json',
				payload: { ok: true },
			}),
		]);
	});

	it('selects a text-like fallback main after removing the current main', () => {
		const jsonPart = createDraftPartFromSource(makePart({ partId: 'json', payloadFormat: 'json', payload: { a: 1 } }));
		const textPart = createDraftPartFromSource(makePart({ partId: 'text', payloadFormat: 'text', payload: 'text' }));

		expect(resolveFallbackMainPartId([jsonPart, textPart])).toBe('text');
	});
});
