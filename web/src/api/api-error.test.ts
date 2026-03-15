import { describe, expect, it } from 'vitest';

import { getApiErrorMessage } from './api-error';

describe('getApiErrorMessage', () => {
	it('formats flat zod issues into a readable message', () => {
		const message = getApiErrorMessage(
			{
				error: {
					message: 'Validation error',
					code: 'VALIDATION_ERROR',
					details: {
						issues: [
							{
								path: ['operations', 0, 'config', 'activation'],
								message: 'activation must include at least one interval',
							},
						],
					},
				},
			},
			400,
		);

		expect(message).toBe('operations[0].config.activation: activation must include at least one interval');
	});

	it('formats request validation issues grouped by source', () => {
		const message = getApiErrorMessage(
			{
				error: {
					message: 'Validation error',
					code: 'VALIDATION_ERROR',
					details: {
						issues: [
							{
								source: 'body',
								issues: [
									{
										path: ['input', 'name'],
										message: 'Too small: expected string to have >=1 characters',
									},
								],
							},
						],
					},
				},
			},
			400,
		);

		expect(message).toBe('body.input.name: Too small: expected string to have >=1 characters');
	});

	it('keeps specific non-validation messages', () => {
		const message = getApiErrorMessage(
			{
				error: {
					message: 'Unknown blockId in profile',
					code: 'VALIDATION_ERROR',
					details: {
						blockId: 'missing-block',
					},
				},
			},
			400,
		);

		expect(message).toBe('Unknown blockId in profile');
	});
});
