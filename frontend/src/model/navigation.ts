import { createStore, createEvent, createEffect, sample, combine } from 'effector';

// Типы для навигации
export interface NavigationStep {
	id: string;
	name: string;
	data?: Record<string, any>;
	timestamp: number;
}

export interface NavigationBranch {
	id: string;
	name: string;
	steps: NavigationStep[];
	parentBranchId?: string;
	currentStepIndex: number;
}

export interface NavigationState {
	branches: Record<string, NavigationBranch>;
	currentBranchId: string | null;
	history: Array<{ branchId: string; stepIndex: number }>;
	metadata: Record<string, any>;
}

// Events
export const navigateToStep = createEvent<{
	stepId: string;
	branchId?: string;
	data?: Record<string, any>;
}>('navigateToStep');

export const createBranch = createEvent<{
	id: string;
	name: string;
	steps: Omit<NavigationStep, 'timestamp'>[];
	parentBranchId?: string;
}>('createBranch');

export const goBack = createEvent('goBack');
export const goForward = createEvent('goForward');
export const jumpToStep = createEvent<{ branchId: string; stepIndex: number }>('jumpToStep');
export const resetNavigation = createEvent('resetNavigation');
export const updateStepData = createEvent<{
	stepId: string;
	data: Record<string, any>;
}>('updateStepData');

export const switchBranch = createEvent<{
	branchId: string;
	stepIndex?: number;
}>('switchBranch');

export const deleteBranch = createEvent<string>('deleteBranch');

// Effects
export const saveNavigationState = createEffect<NavigationState, void>();
export const loadNavigationState = createEffect<void, NavigationState | null>();

// Stores
export const $navigationState = createStore<NavigationState>({
	branches: {},
	currentBranchId: null,
	history: [],
	metadata: {},
});

// Derived stores
export const $currentBranch = combine($navigationState, (state): NavigationBranch | null => {
	if (!state.currentBranchId) return null;
	return state.branches[state.currentBranchId] || null;
});

export const $currentStep = combine($currentBranch, (branch): NavigationStep | null => {
	if (!branch || branch.currentStepIndex < 0) return null;
	return branch.steps[branch.currentStepIndex] || null;
});

export const $canGoBack = combine($navigationState, (state): boolean => state.history.length > 1);

export const $canGoForward = combine($currentBranch, (branch): boolean => {
	if (!branch) return false;
	return branch.currentStepIndex < branch.steps.length - 1;
});

export const $availableBranches = combine($navigationState, (state): NavigationBranch[] =>
	Object.values(state.branches),
);

export const $branchHierarchy = combine($navigationState, (state): Record<string, string[]> => {
	const hierarchy: Record<string, string[]> = {};

	Object.values(state.branches).forEach((branch) => {
		if (branch.parentBranchId) {
			if (!hierarchy[branch.parentBranchId]) {
				hierarchy[branch.parentBranchId] = [];
			}
			hierarchy[branch.parentBranchId].push(branch.id);
		}
	});

	return hierarchy;
});

// Handlers
$navigationState.on(createBranch, (state, { id, name, steps, parentBranchId }) => {
	const stepsWithTimestamp = steps.map((step) => ({
		...step,
		timestamp: Date.now(),
	}));

	const newBranch: NavigationBranch = {
		id,
		name,
		steps: stepsWithTimestamp,
		parentBranchId,
		currentStepIndex: 0,
	};

	return {
		...state,
		branches: {
			...state.branches,
			[id]: newBranch,
		},
		currentBranchId: id,
		history: [...state.history, { branchId: id, stepIndex: 0 }],
	};
});

$navigationState.on(navigateToStep, (state, { stepId, branchId, data }) => {
	const targetBranchId = branchId || state.currentBranchId;
	if (!targetBranchId) return state;

	const branch = state.branches[targetBranchId];
	if (!branch) return state;

	const stepIndex = branch.steps.findIndex((step) => step.id === stepId);
	if (stepIndex === -1) return state;

	// Обновляем данные шага если они переданы
	const updatedSteps = data
		? branch.steps.map((step, index) => (index === stepIndex ? { ...step, data: { ...step.data, ...data } } : step))
		: branch.steps;

	return {
		...state,
		branches: {
			...state.branches,
			[targetBranchId]: {
				...branch,
				steps: updatedSteps,
				currentStepIndex: stepIndex,
			},
		},
		currentBranchId: targetBranchId,
		history: [...state.history, { branchId: targetBranchId, stepIndex }],
	};
});

$navigationState.on(goBack, (state) => {
	if (state.history.length <= 1) return state;

	const newHistory = state.history.slice(0, -1);
	const previousStep = newHistory[newHistory.length - 1];

	return {
		...state,
		currentBranchId: previousStep.branchId,
		branches: {
			...state.branches,
			[previousStep.branchId]: {
				...state.branches[previousStep.branchId],
				currentStepIndex: previousStep.stepIndex,
			},
		},
		history: newHistory,
	};
});

$navigationState.on(goForward, (state) => {
	if (!state.currentBranchId) return state;

	const currentBranch = state.branches[state.currentBranchId];
	if (!currentBranch || currentBranch.currentStepIndex >= currentBranch.steps.length - 1) {
		return state;
	}

	const newStepIndex = currentBranch.currentStepIndex + 1;

	return {
		...state,
		branches: {
			...state.branches,
			[state.currentBranchId]: {
				...currentBranch,
				currentStepIndex: newStepIndex,
			},
		},
		history: [...state.history, { branchId: state.currentBranchId, stepIndex: newStepIndex }],
	};
});

$navigationState.on(jumpToStep, (state, { branchId, stepIndex }) => {
	const branch = state.branches[branchId];
	if (!branch || stepIndex < 0 || stepIndex >= branch.steps.length) {
		return state;
	}

	return {
		...state,
		currentBranchId: branchId,
		branches: {
			...state.branches,
			[branchId]: {
				...branch,
				currentStepIndex: stepIndex,
			},
		},
		history: [...state.history, { branchId, stepIndex }],
	};
});

$navigationState.on(switchBranch, (state, { branchId, stepIndex = 0 }) => {
	const branch = state.branches[branchId];
	if (!branch) return state;

	const targetStepIndex = Math.min(stepIndex, branch.steps.length - 1);

	return {
		...state,
		currentBranchId: branchId,
		branches: {
			...state.branches,
			[branchId]: {
				...branch,
				currentStepIndex: targetStepIndex,
			},
		},
		history: [...state.history, { branchId, stepIndex: targetStepIndex }],
	};
});

$navigationState.on(updateStepData, (state, { stepId, data }) => {
	const newBranches = { ...state.branches };

	Object.keys(newBranches).forEach((branchId) => {
		const branch = newBranches[branchId];
		const stepIndex = branch.steps.findIndex((step) => step.id === stepId);

		if (stepIndex !== -1) {
			newBranches[branchId] = {
				...branch,
				steps: branch.steps.map((step, index) =>
					index === stepIndex ? { ...step, data: { ...step.data, ...data } } : step,
				),
			};
		}
	});

	return {
		...state,
		branches: newBranches,
	};
});

$navigationState.on(deleteBranch, (state, branchId) => {
	const { [branchId]: deletedBranch, ...remainingBranches } = state.branches;

	// Удаляем также все дочерние ветки
	const branchesToDelete = new Set([branchId]);
	let hasChanges = true;

	while (hasChanges) {
		hasChanges = false;
		Object.values(remainingBranches).forEach((branch) => {
			if (branch.parentBranchId && branchesToDelete.has(branch.parentBranchId)) {
				branchesToDelete.add(branch.id);
				delete remainingBranches[branch.id];
				hasChanges = true;
			}
		});
	}

	const newCurrentBranchId =
		state.currentBranchId === branchId ? Object.keys(remainingBranches)[0] || null : state.currentBranchId;

	return {
		...state,
		branches: remainingBranches,
		currentBranchId: newCurrentBranchId,
		history: state.history.filter((item) => !branchesToDelete.has(item.branchId)),
	};
});

$navigationState.on(resetNavigation, () => ({
	branches: {},
	currentBranchId: null,
	history: [],
	metadata: {},
}));

// Восстановление состояния
sample({
	clock: loadNavigationState.doneData,
	filter: (state) => state !== null,
	target: $navigationState,
});

// Автосохранение состояния
sample({
	clock: $navigationState,
	target: saveNavigationState,
});

// Утилиты
export const NavigationUtils = {
	// Получить путь от корневой ветки до текущей
	getBranchPath: (state: NavigationState, branchId: string): string[] => {
		const path: string[] = [];
		let currentBranchId: string | undefined = branchId;

		while (currentBranchId) {
			path.unshift(currentBranchId);
			const branch = state.branches[currentBranchId] as NavigationBranch;
			currentBranchId = branch?.parentBranchId;
		}

		return path;
	},

	// Получить все шаги в порядке прохождения
	getCompletedSteps: (state: NavigationState): NavigationStep[] => {
		return state.history
			.map(({ branchId, stepIndex }) => {
				const branch = state.branches[branchId];
				return branch?.steps[stepIndex];
			})
			.filter(Boolean) as NavigationStep[];
	},

	// Проверить, можно ли перейти к определенному шагу
	canNavigateToStep: (state: NavigationState, branchId: string, stepIndex: number): boolean => {
		const branch = state.branches[branchId];
		return !!(branch && stepIndex >= 0 && stepIndex < branch.steps.length);
	},

	// Получить процент прогресса по ветке
	getBranchProgress: (branch: NavigationBranch): number => {
		if (branch.steps.length === 0) return 0;
		return ((branch.currentStepIndex + 1) / branch.steps.length) * 100;
	},
};
