import i18n from '../i18n';

type ApiErrorEnvelope = {
	error?: {
		message?: string;
		code?: string;
		details?: unknown;
	};
};

type ApiIssue = {
	path?: unknown[];
	message?: string;
};

type ApiIssueGroup = {
	source?: string;
	issues?: ApiIssue[];
};

const GENERIC_VALIDATION_MESSAGE = 'validation error';
const REQUIRED_STRING_MESSAGE = 'Too small: expected string to have >=1 characters';

export function getApiErrorMessage(body: ApiErrorEnvelope | undefined, status: number): string {
	const fallbackMessage = body?.error?.message ?? `HTTP error ${status}`;
	const validationDetails = formatValidationDetails(body?.error?.details);

	if (!validationDetails) {
		return fallbackMessage;
	}

	const serverMessage = body?.error?.message?.trim();
	if (!serverMessage || serverMessage.toLowerCase() === GENERIC_VALIDATION_MESSAGE) {
		return validationDetails;
	}

	if (serverMessage.includes(validationDetails)) {
		return serverMessage;
	}

	return `${serverMessage}: ${validationDetails}`;
}

function formatValidationDetails(details: unknown): string | null {
	if (!isRecord(details) || !Array.isArray(details.issues) || details.issues.length === 0) {
		return null;
	}

	const formattedIssues = details.issues
		.flatMap((issue) => {
			if (isIssueGroup(issue)) {
				return (issue.issues ?? []).map((nestedIssue) => formatIssue(nestedIssue, issue.source));
			}

			if (isIssue(issue)) {
				return [formatIssue(issue)];
			}

			return [];
		})
		.filter((issue): issue is string => typeof issue === 'string' && issue.length > 0);

	if (formattedIssues.length === 0) {
		return null;
	}

	return formattedIssues.join('; ');
}

function formatIssue(issue: ApiIssue, source?: string): string | null {
	const message = formatIssueMessage(issue);
	if (!message) {
		return null;
	}

	const path = formatIssuePath(issue.path, source);
	return path ? `${path}: ${message}` : message;
}

function formatIssuePath(path: unknown[] | undefined, source?: string): string | null {
	const operationPath = formatOperationIssuePath(path);
	if (operationPath) return operationPath;

	let result = typeof source === 'string' && source.length > 0 ? source : '';

	for (const segment of path ?? []) {
		if (typeof segment === 'number' && Number.isInteger(segment)) {
			result += `[${segment}]`;
			continue;
		}

		if (typeof segment === 'string' && segment.length > 0) {
			result += result ? `.${segment}` : segment;
		}
	}

	return result || null;
}

function formatOperationIssuePath(path: unknown[] | undefined): string | null {
	if (!Array.isArray(path)) return null;
	const operationsIndex = path.findIndex((segment) => segment === 'operations');
	const operationNumber = path[operationsIndex + 1];
	if (operationsIndex < 0 || typeof operationNumber !== 'number' || !Number.isInteger(operationNumber)) {
		return null;
	}

	const fieldPath = path.slice(operationsIndex + 2);
	const fieldLabel = formatOperationFieldPath(fieldPath);
	const operationLabel = t('operation', 'Operation #{{number}}', { number: operationNumber + 1 });
	return fieldLabel ? `${operationLabel} ${fieldLabel}` : operationLabel;
}

function formatOperationFieldPath(path: unknown[]): string {
	const normalized = normalizeOperationFieldPath(path);
	const key = normalized.join('.');
	const label = OPERATION_FIELD_LABELS[key];
	if (label) return t(`fields.${label.key}`, label.fallback);
	return normalized.map(formatFieldSegment).join(' ');
}

function normalizeOperationFieldPath(path: unknown[]): string[] {
	const result: string[] = [];
	for (let index = 0; index < path.length; index += 1) {
		const segment = path[index];
		if (typeof segment === 'number' && Number.isInteger(segment)) {
			result.push(`#${segment + 1}`);
			continue;
		}
		if (typeof segment !== 'string' || segment.length === 0) continue;
		if (segment === 'config') continue;
		if (segment === 'params') continue;
		result.push(segment);
	}
	return result;
}

function formatFieldSegment(segment: string): string {
	if (segment.startsWith('#')) return segment;
	return segment
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.replace(/_/g, ' ')
		.toLowerCase();
}

function formatIssueMessage(issue: ApiIssue): string {
	const raw = typeof issue.message === 'string' ? issue.message.trim() : '';
	if (!raw) return '';
	if (raw === REQUIRED_STRING_MESSAGE) return t('required', 'required');

	const leaf = Array.isArray(issue.path) ? issue.path[issue.path.length - 1] : undefined;
	if (typeof leaf === 'string' && raw.toLowerCase().startsWith(`${formatFieldSegment(leaf)} must `)) {
		return raw.slice(formatFieldSegment(leaf).length + 1);
	}
	return raw;
}

function t(key: string, fallback: string, options?: Record<string, unknown>): string {
	return i18n.t(`operationProfiles.validation.${key}`, {
		defaultValue: fallback,
		...(options ?? {}),
	});
}

const OPERATION_FIELD_LABELS: Record<string, { key: string; fallback: string }> = {
	activation: { key: 'activation', fallback: 'activation' },
	dependsOn: { key: 'dependsOn', fallback: 'dependencies' },
	hooks: { key: 'hooks', fallback: 'hooks' },
	name: { key: 'name', fallback: 'name' },
	order: { key: 'order', fallback: 'order' },
	required: { key: 'required', fallback: 'required flag' },
	runConditions: { key: 'runConditions', fallback: 'run conditions' },
	triggers: { key: 'triggers', fallback: 'triggers' },
	credentialRef: { key: 'credentialRef', fallback: 'LLM token' },
	model: { key: 'model', fallback: 'model' },
	prompt: { key: 'prompt', fallback: 'prompt' },
	system: { key: 'system', fallback: 'system prompt' },
	jsonSchema: { key: 'jsonSchema', fallback: 'JSON schema' },
	jsonCustomPattern: { key: 'jsonCustomPattern', fallback: 'JSON regex pattern' },
	jsonCustomFlags: { key: 'jsonCustomFlags', fallback: 'JSON regex flags' },
	'artifact.artifactId': { key: 'artifactId', fallback: 'artifact id' },
	'artifact.description': { key: 'artifactDescription', fallback: 'artifact description' },
	'artifact.exposures': { key: 'artifactExposures', fallback: 'artifact exposures' },
	'artifact.format': { key: 'artifactFormat', fallback: 'artifact format' },
	'artifact.history.enabled': { key: 'artifactHistoryEnabled', fallback: 'artifact history enabled' },
	'artifact.history.maxItems': { key: 'artifactHistoryMaxItems', fallback: 'artifact history limit' },
	'artifact.persistence': { key: 'artifactPersistence', fallback: 'artifact persistence' },
	'artifact.semantics': { key: 'artifactSemantics', fallback: 'artifact semantics' },
	'artifact.tag': { key: 'artifactTag', fallback: 'artifact tag' },
	'artifact.title': { key: 'artifactTitle', fallback: 'artifact title' },
	'artifact.writeMode': { key: 'artifactWriteMode', fallback: 'artifact write mode' },
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isIssue(value: unknown): value is ApiIssue {
	return isRecord(value);
}

function isIssueGroup(value: unknown): value is ApiIssueGroup {
	return isRecord(value) && Array.isArray(value.issues);
}
