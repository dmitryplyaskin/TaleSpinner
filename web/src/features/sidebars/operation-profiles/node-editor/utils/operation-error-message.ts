import type { OperationProfileFormValues } from '../../form/operation-profile-form-mapping';

function escapeOperationLabel(value: string): string {
	return value.replace(/"/g, '\\"');
}

function getOperationLabel(operations: OperationProfileFormValues['operations'], index: number): string | null {
	const operation = operations[index - 1];
	if (!operation) return null;
	const label = operation.name.trim() || operation.opId.trim();
	return label ? escapeOperationLabel(label) : null;
}

export function addOperationNamesToErrorMessage(
	message: string,
	operations: OperationProfileFormValues['operations'],
): string {
	return message.replace(/(Операция|Operation)\s+#(\d+)(?!\s*["“])/g, (match, prefix: string, indexRaw: string) => {
		const index = Number(indexRaw);
		if (!Number.isInteger(index) || index < 1) return match;
		const label = getOperationLabel(operations, index);
		return label ? `${prefix} #${index} "${label}"` : match;
	});
}
