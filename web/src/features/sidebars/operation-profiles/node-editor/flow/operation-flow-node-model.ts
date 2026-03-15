import { readGuardOutputContract } from '../../form/guard-kind-form';

import type { OperationFlowNodeData } from './operation-flow-node';
import type { FormOperation } from '../../form/operation-profile-form-mapping';

const BASE_NODE_MIN_HEIGHT = 68;
const GUARD_OUTPUT_ROW_HEIGHT = 34;

export type OperationFlowNodeSource = Pick<FormOperation, 'opId' | 'name' | 'description' | 'kind'> & {
	config: {
		enabled: boolean;
		required: boolean;
		params: unknown;
	};
};

export function buildOperationFlowNodeData(operation: OperationFlowNodeSource): OperationFlowNodeData {
	return {
		opId: operation.opId,
		name: operation.name,
		description: operation.description,
		kind: operation.kind,
		isEnabled: Boolean(operation.config.enabled),
		isRequired: Boolean(operation.config.required),
		guardOutputs:
			operation.kind === 'guard'
				? readGuardOutputContract(operation.config.params).map((output) => ({
						key: output.key,
						title: output.title || output.key,
					}))
				: [],
	};
}

export function buildOperationFlowNodeSignature(data: OperationFlowNodeData): string {
	return [
		data.opId,
		data.name,
		data.description ?? '',
		data.kind,
		data.isEnabled ? '1' : '0',
		data.isRequired ? '1' : '0',
		data.guardOutputs.map((output) => `${output.key}:${output.title}`).join('|'),
	].join('::');
}

export function hasDefaultSourceHandle(data: OperationFlowNodeData): boolean {
	return data.kind !== 'guard';
}

export function getOperationFlowNodeMinHeight(data: OperationFlowNodeData): number {
	if (data.kind !== 'guard' || data.guardOutputs.length === 0) return BASE_NODE_MIN_HEIGHT;
	return BASE_NODE_MIN_HEIGHT + data.guardOutputs.length * GUARD_OUTPUT_ROW_HEIGHT;
}
