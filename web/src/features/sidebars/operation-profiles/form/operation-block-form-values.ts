import { toOperationProfileForm, type OperationProfileFormValues } from './operation-profile-form-mapping';

import type { OperationBlockDto, OperationProfileDto } from '../../../../api/chat-core';

export function toOperationBlockFormValues(block: OperationBlockDto): OperationProfileFormValues {
	return toOperationProfileForm({
		profileId: block.blockId,
		ownerId: block.ownerId,
		name: block.name,
		description: block.description,
		enabled: block.enabled,
		executionMode: 'sequential',
		operationProfileSessionId: '00000000-0000-0000-0000-000000000000',
		blockRefs: [],
		operations: block.operations,
		meta: block.meta,
		version: block.version,
		createdAt: block.createdAt,
		updatedAt: block.updatedAt,
	} satisfies OperationProfileDto);
}
