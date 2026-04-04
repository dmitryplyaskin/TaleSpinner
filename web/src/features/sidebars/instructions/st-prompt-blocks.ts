import { v4 as uuidv4 } from 'uuid';

import { getStPromptDefinition, getStPromptSourceLabel, ST_SYSTEM_PROMPT_DEFAULTS } from '@model/instructions/st-preset';

import type { StBasePrompt } from '@shared/types/instructions';

const STANDARD_PROMPT_IDENTIFIERS = new Set(ST_SYSTEM_PROMPT_DEFAULTS.map((item) => item.identifier));

export type PromptBlockRole = NonNullable<StBasePrompt['role']>;

export type PromptBlockFields = {
	name: string;
	role: PromptBlockRole;
	content: string;
};

export function createEmptyPromptBlockFields(): PromptBlockFields {
	return {
		name: '',
		role: 'system',
		content: '',
	};
}

export function normalizePromptForEdit(prompt: StBasePrompt | undefined, identifier: string): StBasePrompt {
	if (prompt) return { ...prompt };

	const definition = getStPromptDefinition(identifier);
	if (definition) return { ...definition };

	return {
		identifier,
		name: identifier,
		role: 'system',
		system_prompt: true,
		content: '',
	};
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
	return {
		identifier: createIdentifier(),
		name: fields.name.trim() || undefined,
		role: fields.role,
		system_prompt: true,
		marker: false,
		content: fields.content,
	};
}
