import { beforeEach, describe, expect, it } from 'vitest';

import i18n from '../i18n';

import { getApiErrorMessage } from './api-error';

describe('getApiErrorMessage', () => {
	beforeEach(async () => {
		await i18n.changeLanguage('en');
	});

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

		expect(message).toBe('Operation #1 activation: must include at least one interval');
	});

	it('formats operation validation issues with readable operation fields and keeps all issues', () => {
		const message = getApiErrorMessage(
			{
				error: {
					message: 'Validation error',
					code: 'VALIDATION_ERROR',
					details: {
						issues: [
							{
								path: ['operations', 0, 'config', 'params', 'params', 'credentialRef'],
								message: 'Too small: expected string to have >=1 characters',
							},
							{
								path: ['operations', 0, 'config', 'params', 'params', 'prompt'],
								message: 'Too small: expected string to have >=1 characters',
							},
							{
								path: ['operations', 0, 'config', 'params', 'artifact', 'tag'],
								message: 'tag must match ^[a-z][a-z0-9_]*$',
							},
							{
								path: ['operations', 0, 'config', 'params', 'artifact', 'title'],
								message: 'Too small: expected string to have >=1 characters',
							},
						],
					},
				},
			},
			400,
		);

		expect(message).toBe(
			'Operation #1 LLM token: required; Operation #1 prompt: required; Operation #1 artifact tag: must match ^[a-z][a-z0-9_]*$; Operation #1 artifact title: required',
		);
	});

	it('localizes readable operation validation labels', async () => {
		await i18n.changeLanguage('ru');

		const message = getApiErrorMessage(
			{
				error: {
					message: 'Validation error',
					code: 'VALIDATION_ERROR',
					details: {
						issues: [
							{
								path: ['operations', 1, 'config', 'params', 'params', 'credentialRef'],
								message: 'Too small: expected string to have >=1 characters',
							},
						],
					},
				},
			},
			400,
		);

		expect(message).toBe('Операция #2 LLM токен: обязательное поле');
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

		expect(message).toBe('body.input.name: required');
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
