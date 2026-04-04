import type { StBasePrompt } from '@shared/types/instructions';

export type StPromptBlockEditorState = {
	identifier: string;
	name: string;
	role: 'system' | 'user' | 'assistant';
	content: string;
	contentReadOnly: boolean;
};

export type StPromptBlockEditorSavePlan = {
	promptPatch: Pick<StBasePrompt, 'name' | 'role' | 'content'>;
};

type CreateStateParams = {
	prompt: StBasePrompt;
	contentReadOnly: boolean;
};

export function createStPromptBlockEditorState(params: CreateStateParams): StPromptBlockEditorState {
	return {
		identifier: params.prompt.identifier,
		name: params.prompt.name ?? params.prompt.identifier,
		role: params.prompt.role ?? 'system',
		content: params.prompt.content ?? '',
		contentReadOnly: params.contentReadOnly,
	};
}

export function areStPromptBlockEditorStatesEqual(
	left: StPromptBlockEditorState,
	right: StPromptBlockEditorState,
): boolean {
	return (
		left.identifier === right.identifier &&
		left.name === right.name &&
		left.role === right.role &&
		left.content === right.content &&
		left.contentReadOnly === right.contentReadOnly
	);
}

export function resolveStPromptBlockEditorCloseAction(
	initial: StPromptBlockEditorState,
	current: StPromptBlockEditorState,
): 'close' | 'confirm-save' {
	return areStPromptBlockEditorStatesEqual(initial, current) ? 'close' : 'confirm-save';
}

export function createStPromptBlockEditorSavePlan(
	state: StPromptBlockEditorState,
): StPromptBlockEditorSavePlan {
	return {
		promptPatch: {
			name: state.name.trim() || undefined,
			role: state.role,
			content: state.content,
		},
	};
}
