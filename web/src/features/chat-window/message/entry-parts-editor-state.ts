import type { Part } from '@shared/types/chat-entry-parts';

export type DraftPartState = {
	id: string;
	partId?: string;
	clientPartId?: string;
	channel: Part['channel'];
	payloadFormat: Part['payloadFormat'];
	source: Part['source'];
	replacesPartId: string | null;
	visibilityUi: 'always' | 'never';
	visibilityPrompt: boolean;
	payloadRaw: string;
};

export function sortPartsStable(left: Part, right: Part): number {
	if (left.order !== right.order) return left.order - right.order;
	return left.partId.localeCompare(right.partId);
}

export function toPartPayloadRaw(part: Part): string {
	if (part.payloadFormat === 'json') {
		if (typeof part.payload === 'string') return part.payload;
		try {
			return JSON.stringify(part.payload, null, 2);
		} catch {
			return String(part.payload);
		}
	}

	if (typeof part.payload === 'string') return part.payload;
	try {
		return JSON.stringify(part.payload);
	} catch {
		return String(part.payload);
	}
}

export function createDraftPartFromSource(part: Part): DraftPartState {
	return {
		id: part.partId,
		partId: part.partId,
		channel: part.channel,
		payloadFormat: part.payloadFormat,
		source: part.source,
		replacesPartId: typeof part.replacesPartId === 'string' && part.replacesPartId.trim().length > 0 ? part.replacesPartId : null,
		visibilityUi: part.visibility?.ui === 'never' ? 'never' : 'always',
		visibilityPrompt: Boolean(part.visibility?.prompt),
		payloadRaw: toPartPayloadRaw(part),
	};
}

export function createNewDraftPart(index: number): DraftPartState {
	const clientPartId = `new-part-${Date.now()}-${index}`;
	return {
		id: clientPartId,
		clientPartId,
		channel: 'aux',
		payloadFormat: 'markdown',
		source: 'user',
		replacesPartId: null,
		visibilityUi: 'always',
		visibilityPrompt: true,
		payloadRaw: '',
	};
}

export function isTextLikeDraftPart(part: DraftPartState): boolean {
	return part.payloadFormat === 'text' || part.payloadFormat === 'markdown';
}

export function resolveFallbackMainPartId(parts: DraftPartState[]): string {
	return parts.find(isTextLikeDraftPart)?.id ?? parts[0]?.id ?? '';
}

export function parseDraftPayload(part: DraftPartState): string | object | number | boolean | null {
	if (part.payloadFormat === 'json') {
		return JSON.parse(part.payloadRaw) as string | object | number | boolean | null;
	}
	return part.payloadRaw;
}

export function buildEntryPartsEditorRequestParts(params: {
	draftParts: DraftPartState[];
	removedParts: Part[];
}): Array<{
	partId?: string;
	clientPartId?: string;
	deleted?: boolean;
	channel?: Part['channel'];
	payloadFormat?: Part['payloadFormat'];
	visibility: { ui: 'always' | 'never'; prompt: boolean };
	payload: string | object | number | boolean | null;
}> {
	const activeParts = params.draftParts.map((part) => ({
		...(part.partId ? { partId: part.partId, deleted: false } : { clientPartId: part.clientPartId, channel: part.channel, payloadFormat: part.payloadFormat }),
		visibility: {
			ui: part.visibilityUi,
			prompt: part.visibilityPrompt,
		},
		payload: parseDraftPayload(part),
	}));

	const deletedParts = params.removedParts.map((part) => ({
		partId: part.partId,
		deleted: true,
		visibility: {
			ui: part.visibility?.ui === 'never' ? ('never' as const) : ('always' as const),
			prompt: Boolean(part.visibility?.prompt),
		},
		payload: part.payload,
	}));

	return [...activeParts, ...deletedParts];
}
