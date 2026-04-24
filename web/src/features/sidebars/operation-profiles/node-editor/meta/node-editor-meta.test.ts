import { describe, expect, it } from 'vitest';

import { readNodeEditorMeta, writeNodeEditorMeta } from './node-editor-meta';

describe('node editor meta', () => {
	it('round-trips viewport data while preserving other meta', () => {
		const written = writeNodeEditorMeta(
			{ owner: 'test' },
			{
				version: 1,
				nodes: { 'op-1': { x: 10, y: 20 } },
				viewport: { x: -100, y: -50, zoom: 0.75 },
			},
		);

		expect(written).toMatchObject({ owner: 'test' });
		expect(readNodeEditorMeta(written)).toEqual({
			version: 1,
			nodes: { 'op-1': { x: 10, y: 20 } },
			viewport: { x: -100, y: -50, zoom: 0.75 },
		});
	});

	it('ignores invalid viewport data', () => {
		expect(
			readNodeEditorMeta({
				nodeEditor: {
					version: 1,
					nodes: {},
					viewport: { x: 1, y: 'bad', zoom: 1 },
				},
			})?.viewport,
		).toBeUndefined();
	});
});
