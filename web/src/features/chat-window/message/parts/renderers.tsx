import { Box, Code, Paper, Text } from '@mantine/core';

import { RenderMd } from '@ui/render-md';

import type { Part } from '@shared/types/chat-entry-parts';
import type React from 'react';

export type PartRenderer = React.FC<{ part: Part }>;
export type RenderPartOptions = {
	plainTextForMarkdown?: boolean;
};

function renderTextPart(part: Part): React.ReactNode {
	const content = typeof part.payload === 'string' ? part.payload : '';
	return (
		<Text style={{ whiteSpace: 'pre-wrap' }} size="sm" className="ts-chat-serif">
			{content}
		</Text>
	);
}

function renderMarkdownPart(part: Part): React.ReactNode {
	const content = typeof part.payload === 'string' ? part.payload : '';
	return <RenderMd content={content} containerProps={{ className: 'ts-chat-serif' }} />;
}

function renderJsonPart(part: Part): React.ReactNode {
	const value = typeof part.payload === 'string' ? part.payload : part.payload;
	const json = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
	return (
		<Paper withBorder radius="sm" p="sm">
			<Code block>{json}</Code>
		</Paper>
	);
}

function renderFallbackPart(part: Part): React.ReactNode {
	return (
		<Box>
			<Text fw={600} size="sm">
				Unknown renderer: {part.ui?.rendererId ?? '(none)'}
			</Text>
			{renderJsonPart(part)}
		</Box>
	);
}

export function renderPart(part: Part, options?: RenderPartOptions): React.ReactNode {
	const id = part.ui?.rendererId ?? 'markdown';
	if (id === 'text') return renderTextPart(part);
	if (id === 'markdown' && options?.plainTextForMarkdown) return renderTextPart(part);
	if (id === 'markdown') return renderMarkdownPart(part);
	if (id === 'json') return renderJsonPart(part);
	if (id === 'card') return renderJsonPart(part);
	return renderFallbackPart(part);
}

