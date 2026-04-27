export type VariantNavigationAction =
	| { kind: 'none' }
	| { kind: 'load' }
	| { kind: 'regenerate' }
	| { kind: 'select'; variantId: string };

type VariantSummary = {
	variantId: string;
};

type BaseVariantNavigationParams = {
	variants: VariantSummary[];
	activeVariantId: string;
	hasActiveOutsideList: boolean;
};

type NextVariantNavigationParams = BaseVariantNavigationParams & {
	isImportedFirstMessage: boolean;
	isLoading: boolean;
};

export function pickActiveVariantIndex(variants: VariantSummary[], activeVariantId: string): number {
	if (variants.length === 0) return -1;
	const idx = variants.findIndex((variant) => variant.variantId === activeVariantId);
	return idx >= 0 ? idx : variants.length - 1;
}

export function resolvePreviousVariantAction(params: BaseVariantNavigationParams): VariantNavigationAction {
	const total = params.variants.length;
	if (total === 0) return { kind: 'none' };

	if (params.hasActiveOutsideList) {
		const previous = params.variants[total - 1];
		return previous ? { kind: 'select', variantId: previous.variantId } : { kind: 'none' };
	}

	const currentIndex = pickActiveVariantIndex(params.variants, params.activeVariantId);
	if (currentIndex <= 0) return { kind: 'none' };

	const previous = params.variants[currentIndex - 1];
	return previous ? { kind: 'select', variantId: previous.variantId } : { kind: 'none' };
}

export function resolveNextVariantAction(params: NextVariantNavigationParams): VariantNavigationAction {
	const total = params.variants.length;
	if (total === 0) {
		return params.isLoading ? { kind: 'none' } : { kind: 'load' };
	}

	if (params.hasActiveOutsideList) {
		return params.isImportedFirstMessage ? { kind: 'none' } : { kind: 'regenerate' };
	}

	const currentIndex = pickActiveVariantIndex(params.variants, params.activeVariantId);
	if (currentIndex < total - 1) {
		const next = params.variants[currentIndex + 1];
		return next ? { kind: 'select', variantId: next.variantId } : { kind: 'none' };
	}

	return params.isImportedFirstMessage ? { kind: 'none' } : { kind: 'regenerate' };
}
