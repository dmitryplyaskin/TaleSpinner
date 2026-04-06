import type { StBasePrompt } from '@shared/types/instructions';

export type StPromptBlockEditorState = {
	identifier: string;
	name: string;
	role: 'system' | 'user' | 'assistant';
	content: string;
	injectionPosition: 0 | 1;
	injectionDepth: number;
	injectionOrder: number;
	contentReadOnly: boolean;
};

export type StPromptBlockEditorSavePlan = {
	promptPatch: Pick<
		StBasePrompt,
		'name' | 'role' | 'content' | 'injection_position' | 'injection_depth' | 'injection_order'
	>;
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
		injectionPosition: params.prompt.injection_position ?? 0,
		injectionDepth: params.prompt.injection_depth ?? 4,
		injectionOrder: params.prompt.injection_order ?? 100,
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
		left.injectionPosition === right.injectionPosition &&
		left.injectionDepth === right.injectionDepth &&
		left.injectionOrder === right.injectionOrder &&
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
			injection_position: state.injectionPosition,
			injection_depth: state.injectionDepth,
			injection_order: state.injectionOrder,
		},
	};
}
