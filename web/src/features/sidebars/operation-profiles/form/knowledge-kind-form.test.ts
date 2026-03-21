import { describe, expect, it } from 'vitest';

import {
	makeDefaultKnowledgeKindParams,
	requiresJsonArtifactFormat,
} from './knowledge-kind-form';

describe('knowledge kind form', () => {
	it('creates inline defaults for both knowledge operation kinds', () => {
		const search = makeDefaultKnowledgeKindParams('knowledge-search-1', 'knowledge_search');
		const reveal = makeDefaultKnowledgeKindParams('knowledge-reveal-1', 'knowledge_reveal');

		expect(search).toMatchObject({
			sourceMode: 'inline',
			requestTemplate: '',
			strictVariables: false,
			artifactTag: '',
			artifact: expect.objectContaining({
				format: 'json',
			}),
		});
		expect(reveal).toMatchObject({
			sourceMode: 'inline',
			requestTemplate: '',
			strictVariables: false,
			artifactTag: '',
			artifact: expect.objectContaining({
				format: 'json',
			}),
		});
	});

	it('requires json artifact format for guard and knowledge kinds', () => {
		expect(requiresJsonArtifactFormat('guard')).toBe(true);
		expect(requiresJsonArtifactFormat('knowledge_search')).toBe(true);
		expect(requiresJsonArtifactFormat('knowledge_reveal')).toBe(true);
		expect(requiresJsonArtifactFormat('template')).toBe(false);
	});
});
