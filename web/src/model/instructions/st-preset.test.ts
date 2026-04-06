import { describe, expect, it } from 'vitest';

import { buildStPresetFromStBase, createStBaseConfigFromPreset } from './st-preset';

describe('st-preset prompt injection fields', () => {
	it('normalizes missing injection fields to SillyTavern defaults', () => {
		const stBase = createStBaseConfigFromPreset({
			preset: {
				chat_completion_source: 'openai',
				prompts: [{ identifier: 'main', role: 'system', content: 'Main' }],
				prompt_order: [{ character_id: 100001, order: [{ identifier: 'main', enabled: true }] }],
			},
			fileName: 'Default.json',
			sensitiveImportMode: 'keep',
		});

		expect(stBase.prompts).toEqual([
			expect.objectContaining({
				identifier: 'main',
				injection_position: 0,
				injection_depth: 4,
				injection_order: 100,
			}),
		]);
	});

	it('exports injection fields back to preset prompts', () => {
		const stBase = createStBaseConfigFromPreset({
			preset: {
				chat_completion_source: 'openai',
				prompts: [
					{
						identifier: 'main',
						role: 'assistant',
						content: 'Main',
						injection_position: 1,
						injection_depth: 2,
						injection_order: 70,
					},
				],
				prompt_order: [{ character_id: 100001, order: [{ identifier: 'main', enabled: true }] }],
			},
			fileName: 'Default.json',
			sensitiveImportMode: 'keep',
		});

		const preset = buildStPresetFromStBase(stBase);

		expect(preset.prompts).toEqual([
			expect.objectContaining({
				identifier: 'main',
				injection_position: 1,
				injection_depth: 2,
				injection_order: 70,
			}),
		]);
	});
});
