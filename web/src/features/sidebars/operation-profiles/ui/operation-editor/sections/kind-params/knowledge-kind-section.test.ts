import { MantineProvider } from '@mantine/core';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FormProvider, useForm, type FormProviderProps } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import '../../../../../../../i18n';
import { KnowledgeRevealKindSection } from './knowledge-reveal-kind-section';
import { KnowledgeSearchKindSection } from './knowledge-search-kind-section';

import type { ReactNode } from 'react';

function renderWithForm(children: ReactNode, values: Record<string, unknown>): string {
	function Wrapper() {
		const methods = useForm({
			defaultValues: values,
		});
		const providerProps: FormProviderProps<Record<string, unknown>> = {
			...methods,
			children,
		};
		return React.createElement(
			MantineProvider,
			{},
			React.createElement(FormProvider, providerProps),
		);
	}

	return renderToStaticMarkup(React.createElement(Wrapper));
}

describe('knowledge kind sections', () => {
	it('renders inline fields for search section', () => {
		const markup = renderWithForm(
			React.createElement(KnowledgeSearchKindSection, { index: 0 }),
			{
				operations: [
					{
						config: {
							params: {
								sourceMode: 'inline',
								requestTemplate: '',
								strictVariables: false,
								artifactTag: '',
							},
						},
					},
				],
			},
		);

		expect(markup).toContain('Режим источника');
		expect(markup).toContain('Шаблон search request');
		expect(markup).toContain('Строгие переменные');
	});

	it('renders artifact tag field for reveal section in artifact mode', () => {
		const markup = renderWithForm(
			React.createElement(KnowledgeRevealKindSection, { index: 0 }),
			{
				operations: [
					{
						config: {
							params: {
								sourceMode: 'artifact',
								requestTemplate: '',
								strictVariables: false,
								artifactTag: 'planner_result',
							},
						},
					},
				],
			},
		);

		expect(markup).toContain('Режим источника');
		expect(markup).toContain('Тег артефакта запроса');
		expect(markup).not.toContain('Шаблон reveal request');
	});
});
