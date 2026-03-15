import type { LlmOperationRetryOn, LlmOperationSamplers } from '@shared/types/operation-profiles';

export function pickNumericSamplers(raw: unknown): LlmOperationSamplers {
	if (!raw || typeof raw !== 'object') return {};
	const r = raw as Record<string, unknown>;
	const out: LlmOperationSamplers = {};
	if (typeof r.temperature === 'number' && Number.isFinite(r.temperature)) out.temperature = r.temperature;
	if (typeof r.topP === 'number' && Number.isFinite(r.topP)) out.topP = r.topP;
	if (typeof r.topK === 'number' && Number.isFinite(r.topK)) out.topK = r.topK;
	if (typeof r.minP === 'number' && Number.isFinite(r.minP)) out.minP = r.minP;
	if (typeof r.topA === 'number' && Number.isFinite(r.topA)) out.topA = r.topA;
	if (typeof r.frequencyPenalty === 'number' && Number.isFinite(r.frequencyPenalty)) out.frequencyPenalty = r.frequencyPenalty;
	if (typeof r.presencePenalty === 'number' && Number.isFinite(r.presencePenalty)) out.presencePenalty = r.presencePenalty;
	if (typeof r.repetitionPenalty === 'number' && Number.isFinite(r.repetitionPenalty)) out.repetitionPenalty = r.repetitionPenalty;
	if (typeof r.seed === 'number' && Number.isFinite(r.seed)) out.seed = r.seed;
	if (typeof r.maxTokens === 'number' && Number.isFinite(r.maxTokens)) out.maxTokens = r.maxTokens;
	if (r.reasoning && typeof r.reasoning === 'object' && !Array.isArray(r.reasoning)) {
		const rr = r.reasoning as Record<string, unknown>;
		const reasoning: NonNullable<LlmOperationSamplers['reasoning']> = {};
		if (typeof rr.enabled === 'boolean') reasoning.enabled = rr.enabled;
		if (rr.effort === 'low' || rr.effort === 'medium' || rr.effort === 'high') reasoning.effort = rr.effort;
		if (typeof rr.maxTokens === 'number' && Number.isFinite(rr.maxTokens)) reasoning.maxTokens = rr.maxTokens;
		if (typeof rr.exclude === 'boolean') reasoning.exclude = rr.exclude;
		if (Object.keys(reasoning).length > 0) out.reasoning = reasoning;
	}
	return out;
}

export function normalizeRetryOn(value: unknown): LlmOperationRetryOn[] {
	if (!Array.isArray(value)) return ['timeout', 'provider_error', 'rate_limit'];
	const filtered = value.filter(
		(item): item is LlmOperationRetryOn => item === 'timeout' || item === 'provider_error' || item === 'rate_limit',
	);
	const unique = Array.from(new Set(filtered));
	return unique.length > 0 ? unique : ['timeout', 'provider_error', 'rate_limit'];
}
