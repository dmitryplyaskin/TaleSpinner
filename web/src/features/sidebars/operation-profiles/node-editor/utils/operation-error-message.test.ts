import { describe, expect, it } from 'vitest';

import { makeDefaultOperation, type OperationProfileFormValues } from '../../form/operation-profile-form-mapping';

import { addOperationNamesToErrorMessage } from './operation-error-message';

function makeValues(): OperationProfileFormValues {
	return {
		name: 'Block',
		description: '',
		enabled: true,
		executionMode: 'concurrent',
		operationProfileSessionId: 'session',
		operations: [
			{ ...makeDefaultOperation(), opId: 'first', name: 'First node' },
			{ ...makeDefaultOperation(), opId: 'second', name: 'Second node' },
			{ ...makeDefaultOperation(), opId: 'third', name: 'Third node' },
			{ ...makeDefaultOperation(), opId: 'fourth', name: 'Fourth node' },
			{ ...makeDefaultOperation(), opId: 'fifth', name: 'New operation' },
		],
	};
}

describe('operation error message formatting', () => {
	it('adds operation names to Russian indexed validation errors', () => {
		const message = addOperationNamesToErrorMessage(
			'Операция #5 LLM токен: обязательное поле; Операция #5 промпт: обязательное поле',
			makeValues().operations,
		);

		expect(message).toBe(
			'Операция #5 "New operation" LLM токен: обязательное поле; Операция #5 "New operation" промпт: обязательное поле',
		);
	});

	it('adds operation names to English indexed validation errors', () => {
		const message = addOperationNamesToErrorMessage('Operation #2 prompt: required field', makeValues().operations);

		expect(message).toBe('Operation #2 "Second node" prompt: required field');
	});

	it('leaves messages unchanged when the operation index is unknown', () => {
		const message = addOperationNamesToErrorMessage('Операция #9 prompt: required field', makeValues().operations);

		expect(message).toBe('Операция #9 prompt: required field');
	});
});
