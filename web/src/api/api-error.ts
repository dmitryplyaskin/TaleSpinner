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
const MAX_ISSUES_IN_MESSAGE = 3;

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

	const visibleIssues = formattedIssues.slice(0, MAX_ISSUES_IN_MESSAGE);
	const remainingCount = formattedIssues.length - visibleIssues.length;

	return remainingCount > 0 ? `${visibleIssues.join('; ')}; +${remainingCount} more` : visibleIssues.join('; ');
}

function formatIssue(issue: ApiIssue, source?: string): string | null {
	const message = typeof issue.message === 'string' ? issue.message.trim() : '';
	if (!message) {
		return null;
	}

	const path = formatIssuePath(issue.path, source);
	return path ? `${path}: ${message}` : message;
}

function formatIssuePath(path: unknown[] | undefined, source?: string): string | null {
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

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isIssue(value: unknown): value is ApiIssue {
	return isRecord(value);
}

function isIssueGroup(value: unknown): value is ApiIssueGroup {
	return isRecord(value) && Array.isArray(value.issues);
}
