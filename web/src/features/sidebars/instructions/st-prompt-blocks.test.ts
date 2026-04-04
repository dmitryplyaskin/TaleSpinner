import { describe, expect, it } from 'vitest';

import {
	canDeletePrompt,
	createCustomPrompt,
	createEmptyPromptBlockFields,
	isRuntimeManagedPrompt,
	normalizePromptForEdit,
} from './st-prompt-blocks';

describe('st prompt blocks helpers', () => {
	it('creates custom prompts with default uuid identifier generator', () => {
		const prompt = createCustomPrompt({
			name: 'Author Note',
			role: 'system',
			content: 'Body',
		});

		expect(prompt.identifier).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
		);
	});

	it('creates custom prompts with generated identifier and stable defaults', () => {
		const prompt = createCustomPrompt(
			{
				name: 'Author Note',
				role: 'assistant',
				content: 'Body',
			},
			() => 'generated-uuid',
		);

		expect(prompt).toEqual({
			identifier: 'generated-uuid',
			name: 'Author Note',
			role: 'assistant',
			system_prompt: true,
			marker: false,
			content: 'Body',
		});
	});

	it('marks only custom prompts as deletable', () => {
		expect(canDeletePrompt('main')).toBe(false);
		expect(canDeletePrompt('worldInfoBefore')).toBe(false);
		expect(canDeletePrompt('2f9f5f0d-5ef0-4ef2-a7db-6301e6db5c77')).toBe(true);
	});

	it('detects runtime-managed prompts by known source identifiers and marker flag', () => {
		expect(
			isRuntimeManagedPrompt({
				identifier: 'worldInfoBefore',
				name: 'World Info',
				role: 'system',
				marker: true,
			}),
		).toBe(true);

		expect(
			isRuntimeManagedPrompt({
				identifier: 'main',
				name: 'Main',
				role: 'system',
				marker: false,
			}),
		).toBe(false);
	});

	it('falls back to definition or identifier when prompt data is partial', () => {
		expect(normalizePromptForEdit(undefined, 'main')).toMatchObject({
			identifier: 'main',
			name: 'Main Prompt',
			role: 'system',
			system_prompt: true,
		});

		expect(normalizePromptForEdit(undefined, 'custom-id')).toEqual({
			identifier: 'custom-id',
			name: 'custom-id',
			role: 'system',
			system_prompt: true,
			content: '',
		});
	});

	it('creates empty prompt fields for modal state', () => {
		expect(createEmptyPromptBlockFields()).toEqual({
			name: '',
			role: 'system',
			content: '',
		});
	});
});
