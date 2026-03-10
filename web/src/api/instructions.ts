import { apiJson } from './api-json';

import type {
	InstructionKind,
	InstructionMeta,
	StBaseConfig,
} from '@shared/types/instructions';

type InstructionDtoBase = {
	id: string;
	ownerId: string;
	name: string;
	engine: 'liquidjs';
	meta: InstructionMeta | null;
	createdAt: string;
	updatedAt: string;
};

export type BasicInstructionDto = InstructionDtoBase & {
	kind: 'basic';
	templateText: string;
};

export type StBaseInstructionDto = InstructionDtoBase & {
	kind: 'st_base';
	stBase: StBaseConfig;
};

export type InstructionDto = BasicInstructionDto | StBaseInstructionDto;

export async function listInstructions(params?: { ownerId?: string }): Promise<InstructionDto[]> {
	const query = new URLSearchParams();
	if (typeof params?.ownerId === 'string') query.set('ownerId', params.ownerId);
	const suffix = query.size > 0 ? `?${query.toString()}` : '';
	return apiJson<InstructionDto[]>(`/instructions${suffix}`);
}

export async function createInstruction(params: {
	name: string;
	engine?: 'liquidjs';
	ownerId?: string;
	meta?: InstructionMeta;
} & ({
	kind: 'basic';
	templateText: string;
} | {
	kind: 'st_base';
	stBase: StBaseConfig;
})): Promise<InstructionDto> {
	return apiJson<InstructionDto>('/instructions', {
		method: 'POST',
		body: JSON.stringify(params),
	});
}

export async function updateInstruction(params: {
	id: string;
	name?: string;
	engine?: 'liquidjs';
	meta?: InstructionMeta;
} & ({
	kind: 'basic';
	templateText?: string;
} | {
	kind: 'st_base';
	stBase?: StBaseConfig;
})): Promise<InstructionDto> {
	const { id, ...body } = params;
	return apiJson<InstructionDto>(`/instructions/${encodeURIComponent(id)}`, {
		method: 'PUT',
		body: JSON.stringify(body),
	});
}

export type CreateInstructionDraft =
	| {
			kind: 'basic';
			name: string;
			templateText: string;
			meta?: InstructionMeta;
	  }
	| {
			kind: 'st_base';
			name: string;
			stBase: StBaseConfig;
			meta?: InstructionMeta;
	  };

export function getInstructionKindLabel(kind: InstructionKind): string {
	return kind === 'st_base' ? 'st-base' : 'basic';
}

export async function deleteInstruction(id: string): Promise<{ id: string }> {
	return apiJson<{ id: string }>(`/instructions/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function prerenderInstruction(params: {
	templateText: string;
	ownerId?: string;
	chatId?: string;
	branchId?: string;
	entityProfileId?: string;
	historyLimit?: number;
}): Promise<{ rendered: string }> {
	return apiJson<{ rendered: string }>('/instructions/prerender', {
		method: 'POST',
		body: JSON.stringify({
			ownerId: params.ownerId,
			templateText: params.templateText,
			chatId: params.chatId,
			branchId: params.branchId,
			entityProfileId: params.entityProfileId,
			historyLimit: params.historyLimit,
		}),
	});
}

