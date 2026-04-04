import { describe, expect, it } from 'vitest';

import {
	areStPromptBlockEditorStatesEqual,
	createStPromptBlockEditorSavePlan,
	createStPromptBlockEditorState,
	resolveStPromptBlockEditorCloseAction,
} from './st-prompt-block-editor-state';

describe('st prompt block editor state', () => {
	it('keeps close action simple when nothing changed', () => {
		const initial = createStPromptBlockEditorState({
			prompt: {
				identifier: 'main',
				name: 'Main prompt',
				role: 'system',
				system_prompt: true,
				content: 'Hello',
			},
			contentReadOnly: false,
		});

		expect(areStPromptBlockEditorStatesEqual(initial, { ...initial })).toBe(true);
		expect(resolveStPromptBlockEditorCloseAction(initial, { ...initial })).toBe('close');
	});

	it('asks for confirmation when draft changed', () => {
		const initial = createStPromptBlockEditorState({
			prompt: {
				identifier: 'authorNote',
				name: 'Author note',
				role: 'system',
				system_prompt: true,
				marker: false,
				content: 'Initial',
			},
			contentReadOnly: false,
		});

		const changed = {
			...initial,
			content: 'Updated',
		};

		expect(areStPromptBlockEditorStatesEqual(initial, changed)).toBe(false);
		expect(resolveStPromptBlockEditorCloseAction(initial, changed)).toBe('confirm-save');
	});

	it('builds save plan and trims blank names', () => {
		const draft = createStPromptBlockEditorState({
			prompt: {
				identifier: 'custom.block',
				name: 'Custom block',
				role: 'assistant',
				system_prompt: false,
				marker: true,
				content: 'Body',
			},
			contentReadOnly: false,
		});

		const plan = createStPromptBlockEditorSavePlan({
			...draft,
			name: '   ',
			content: 'Updated body',
		});

		expect(plan).toEqual({
			promptPatch: {
				name: undefined,
				role: 'assistant',
				content: 'Updated body',
			},
		});
	});

	it('keeps read-only flag in state equality', () => {
		const draft = createStPromptBlockEditorState({
			prompt: {
				identifier: 'main',
				name: 'Main prompt',
				role: 'system',
				system_prompt: true,
				content: 'Body',
			},
			contentReadOnly: true,
		});

		expect(areStPromptBlockEditorStatesEqual(draft, { ...draft })).toBe(true);
		expect(areStPromptBlockEditorStatesEqual(draft, { ...draft, contentReadOnly: false })).toBe(false);
	});
});
