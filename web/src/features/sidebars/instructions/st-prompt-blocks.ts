import {
	ST_PROMPT_DEFAULT_DEPTH,
	ST_PROMPT_DEFAULT_ORDER,
	ST_PROMPT_INJECTION_POSITION,
} from '@shared/types/instructions';
import { cloneStPromptWithDefaults } from '@shared/utils/st-prompts';
import { v4 as uuidv4 } from 'uuid';

import { getStPromptDefinition, getStPromptSourceLabel, ST_SYSTEM_PROMPT_DEFAULTS } from '@model/instructions/st-preset';

import type { StBasePrompt } from '@shared/types/instructions';

const STANDARD_PROMPT_IDENTIFIERS = new Set(ST_SYSTEM_PROMPT_DEFAULTS.map((item) => item.identifier));

export type PromptBlockRole = NonNullable<StBasePrompt['role']>;

export type PromptBlockFields = {
	name: string;
	role: PromptBlockRole;
	content: string;
	injectionPosition: 0 | 1;
	injectionDepth: number;
	injectionOrder: number;
};

export function createEmptyPromptBlockFields(): PromptBlockFields {
	return {
		name: '',
		role: 'system',
		content: '',
		injectionPosition: ST_PROMPT_INJECTION_POSITION.RELATIVE,
		injectionDepth: ST_PROMPT_DEFAULT_DEPTH,
		injectionOrder: ST_PROMPT_DEFAULT_ORDER,
	};
}

export function normalizePromptForEdit(prompt: StBasePrompt | undefined, identifier: string): StBasePrompt {
	if (prompt) return cloneStPromptWithDefaults(prompt);

	const definition = getStPromptDefinition(identifier);
	if (definition) return cloneStPromptWithDefaults(definition);

	return cloneStPromptWithDefaults({
		identifier,
		name: identifier,
		role: 'system',
		system_prompt: true,
		content: '',
	});
}

export function canDeletePrompt(identifier: string): boolean {
	return !STANDARD_PROMPT_IDENTIFIERS.has(identifier);
}

export function isRuntimeManagedPrompt(prompt: StBasePrompt): boolean {
	return prompt.marker === true && Boolean(getStPromptSourceLabel(prompt.identifier));
}

export function createCustomPrompt(
	fields: PromptBlockFields,
	createIdentifier: () => string = uuidv4,
): StBasePrompt {
	return cloneStPromptWithDefaults({
		identifier: createIdentifier(),
		name: fields.name.trim() || undefined,
		role: fields.role,
		system_prompt: true,
		marker: false,
		content: fields.content,
		injection_position: fields.injectionPosition,
		injection_depth: fields.injectionDepth,
		injection_order: fields.injectionOrder,
	});
}
