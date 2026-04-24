import { MantineProvider } from '@mantine/core';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import '../../../../i18n';
import { PartsView } from './parts-view';

import type { Entry, Part, Variant } from '@shared/types/chat-entry-parts';

function makeEntry(): Entry {
	return {
		entryId: 'entry_1',
		chatId: 'chat_1',
		branchId: 'branch_1',
		role: 'assistant',
		createdAt: Date.UTC(2026, 0, 1),
		activeVariantId: 'variant_1',
	};
}

function makeMarkdownPart(payload: string): Part {
	return {
		partId: 'part_1',
		channel: 'main',
		order: 0,
		payload,
		payloadFormat: 'markdown',
		visibility: { ui: 'always', prompt: true },
		ui: { rendererId: 'markdown' },
		prompt: { serializerId: 'asMarkdown' },
		lifespan: 'infinite',
		createdTurn: 0,
		source: 'llm',
	};
}

function makeVariant(part: Part): Variant {
	return {
		variantId: 'variant_1',
		entryId: 'entry_1',
		kind: 'generation',
		createdAt: Date.UTC(2026, 0, 1),
		parts: [part],
	};
}

function renderPartsView(variant: Variant): string {
	return renderToStaticMarkup(
		React.createElement(
			MantineProvider,
			{},
			React.createElement(PartsView, {
				entry: makeEntry(),
				variant,
				currentTurn: 0,
			}),
		),
	);
}

describe('PartsView', () => {
	it('keeps markdown rendering enabled while streaming assistant content', () => {
		const markup = renderPartsView(makeVariant(makeMarkdownPart('Streaming **bold** content')));

		expect(markup).toContain('<strong>bold</strong>');
		expect(markup).not.toContain('**bold**');
	});
});
