import { isOperationKind } from '../utils/operation-kind';

import type { FormRunCondition } from '../form/operation-profile-form-mapping';
import type { OperationKind } from '@shared/types/operation-profiles';

const GRAPH_OPERATION_FIELD_COUNT = 8;

export type OperationGraphFormField = {
	opId?: string;
};

export type OperationGraphFormState = {
	opId: string;
	name: string;
	description: string;
	kind: OperationKind;
	config: {
		enabled: boolean;
		required: boolean;
		dependsOn: string[];
		runConditions: FormRunCondition[];
		params: { outputContract?: unknown[] };
	};
};

export function buildGraphWatchPaths(operationCount: number): string[] {
	return Array.from({ length: operationCount }, (_, index) => [
		`operations.${index}.name`,
		`operations.${index}.description`,
		`operations.${index}.kind`,
		`operations.${index}.config.enabled`,
		`operations.${index}.config.required`,
		`operations.${index}.config.dependsOn`,
		`operations.${index}.config.runConditions`,
		`operations.${index}.config.params.outputContract`,
	]).flat();
}

export function buildGraphOperations(
	fields: OperationGraphFormField[],
	watchedValues?: unknown[],
): OperationGraphFormState[] {
	return fields.map((field, index) => {
		const base = index * GRAPH_OPERATION_FIELD_COUNT;
		const kindValue = watchedValues?.[base + 2];
		const kind = isOperationKind(kindValue) ? kindValue : 'template';
		const outputContract = watchedValues?.[base + 7];

		return {
			opId: typeof field.opId === 'string' ? field.opId : '',
			name: readString(watchedValues?.[base]),
			description: readString(watchedValues?.[base + 1]),
			kind,
			config: {
				enabled: Boolean(watchedValues?.[base + 3]),
				required: Boolean(watchedValues?.[base + 4]),
				dependsOn: readStringArray(watchedValues?.[base + 5]),
				runConditions: readRunConditions(watchedValues?.[base + 6]),
				params: kind === 'guard' ? { outputContract: Array.isArray(outputContract) ? outputContract : [] } : {},
			},
		};
	});
}

function readString(value: unknown): string {
	return typeof value === 'string' ? value : '';
}

function readStringArray(value: unknown): string[] {
	return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function readRunConditions(value: unknown): FormRunCondition[] {
	return Array.isArray(value)
		? value.filter(
				(item): item is FormRunCondition =>
					Boolean(item) &&
					typeof item === 'object' &&
					(item as Record<string, unknown>).type === 'guard_output' &&
					typeof (item as Record<string, unknown>).sourceOpId === 'string' &&
					typeof (item as Record<string, unknown>).outputKey === 'string' &&
					((item as Record<string, unknown>).operator === 'is_true' ||
						(item as Record<string, unknown>).operator === 'is_false'),
		  )
		: [];
}
