import {
	buildOperationArtifactId,
	makeDefaultOperationArtifactConfig,
	normalizeOperationArtifactConfig,
	type OperationArtifactConfig,
	type OperationInProfile,
	type OperationKind,
	type OperationOtherKindParams,
} from '@shared/types/operation-profiles';

import type {
	KnowledgeRequestSource,
	KnowledgeRevealOperationParams,
	KnowledgeSearchOperationParams,
} from '@shared/types/chat-knowledge';

export type KnowledgeOperationKind = 'knowledge_search' | 'knowledge_reveal';

export type FormKnowledgeKindParams = {
	sourceMode: KnowledgeRequestSource['mode'];
	requestTemplate: string;
	strictVariables: boolean;
	artifactTag: string;
	artifact: OperationArtifactConfig;
};

type KnowledgeOperationInProfile = Extract<
	OperationInProfile,
	{ kind: 'knowledge_search' | 'knowledge_reveal' }
>;

type KnowledgeOperationParams =
	| OperationOtherKindParams<KnowledgeSearchOperationParams>
	| OperationOtherKindParams<KnowledgeRevealOperationParams>;

export function isKnowledgeOperationKind(value: unknown): value is KnowledgeOperationKind {
	return value === 'knowledge_search' || value === 'knowledge_reveal';
}

export function requiresJsonArtifactFormat(kind: OperationKind): boolean {
	return kind === 'guard' || isKnowledgeOperationKind(kind);
}

function forceJsonArtifactFormat(artifact: OperationArtifactConfig): OperationArtifactConfig {
	return {
		...artifact,
		artifactId: artifact.artifactId || buildOperationArtifactId('temp-op'),
		format: 'json',
	};
}

export function makeDefaultKnowledgeKindParams(
	opId: string,
	kind: KnowledgeOperationKind,
	artifact: OperationArtifactConfig = makeDefaultOperationArtifactConfig({
		opId,
		kind,
		title: 'Artifact',
	}),
): FormKnowledgeKindParams {
	return {
		sourceMode: 'inline',
		requestTemplate: '',
		strictVariables: false,
		artifactTag: '',
		artifact: forceJsonArtifactFormat(artifact),
	};
}

export function normalizeKnowledgeKindParams(op: KnowledgeOperationInProfile): FormKnowledgeKindParams {
	const params = op.config.params as Record<string, unknown>;
	const rawParams =
		params.params && typeof params.params === 'object' && !Array.isArray(params.params)
			? (params.params as Record<string, unknown>)
			: {};
	const rawSource =
		rawParams.source && typeof rawParams.source === 'object' && !Array.isArray(rawParams.source)
			? (rawParams.source as Record<string, unknown>)
			: {};
	const sourceMode = rawSource.mode === 'artifact' ? 'artifact' : 'inline';

	return {
		sourceMode,
		requestTemplate:
			sourceMode === 'inline' && typeof rawSource.requestTemplate === 'string' ? rawSource.requestTemplate : '',
		strictVariables: sourceMode === 'inline' ? rawSource.strictVariables === true : false,
		artifactTag:
			sourceMode === 'artifact' && typeof rawSource.artifactTag === 'string' ? rawSource.artifactTag : '',
		artifact: forceJsonArtifactFormat(
			normalizeOperationArtifactConfig({
				opId: op.opId,
				kind: op.kind,
				title: op.name,
				rawParams: params,
			}),
		),
	};
}

function buildKnowledgeRequestSource(params: FormKnowledgeKindParams): KnowledgeRequestSource {
	if (params.sourceMode === 'artifact') {
		return {
			mode: 'artifact',
			artifactTag: params.artifactTag.trim(),
		};
	}

	return {
		mode: 'inline',
		requestTemplate: params.requestTemplate,
		strictVariables: params.strictVariables ? true : undefined,
	};
}

export function serializeKnowledgeKindParams(params: FormKnowledgeKindParams, opId: string): KnowledgeOperationParams {
	return {
		params: {
			source: buildKnowledgeRequestSource(params),
		},
		artifact: forceJsonArtifactFormat({
			...params.artifact,
			artifactId: params.artifact.artifactId || buildOperationArtifactId(opId),
		}),
	};
}
