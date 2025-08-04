import React, { createContext, useContext, ReactNode } from 'react';
import { useUnit } from 'effector-react';
import { $currentStep, $currentBranch, goForward, goBack, updateStepData, navigateToStep } from '@model/navigation';

interface WorldCreationNavigationContextType {
	currentStep: any;
	currentBranch: any;
	currentStepIndex: number;
	totalSteps: number;
	canGoNext: boolean;
	canGoPrev: boolean;
	nextStep: () => void;
	prevStep: () => void;
	goToStep: (stepId: string) => void;
	updateCurrentStepData: (data: Record<string, any>) => void;
	isStep: (stepId: string) => boolean;
}

const WorldCreationNavigationContext = createContext<WorldCreationNavigationContextType | undefined>(undefined);

export const useWorldCreationNavigation = () => {
	const context = useContext(WorldCreationNavigationContext);
	if (!context) {
		throw new Error('useWorldCreationNavigation must be used within WorldCreationNavigationProvider');
	}
	return context;
};

interface WorldCreationNavigationProviderProps {
	children: ReactNode;
}

export const WorldCreationNavigationProvider: React.FC<WorldCreationNavigationProviderProps> = ({ children }) => {
	const currentStep = useUnit($currentStep);
	const currentBranch = useUnit($currentBranch);

	const currentStepIndex = currentBranch?.currentStepIndex ?? 0;
	const totalSteps = currentBranch?.steps?.length ?? 0;
	const canGoNext = currentStepIndex < totalSteps - 1;
	const canGoPrev = currentStepIndex > 0;

	const nextStep = () => {
		if (canGoNext) {
			goForward();
		}
	};

	const prevStep = () => {
		if (canGoPrev) {
			goBack();
		}
	};

	const goToStep = (stepId: string) => {
		navigateToStep({ stepId, branchId: currentBranch?.id });
	};

	const updateCurrentStepData = (data: Record<string, any>) => {
		if (currentStep?.id) {
			updateStepData({ stepId: currentStep.id, data });
		}
	};

	const isStep = (stepId: string): boolean => {
		return currentStep?.id === stepId;
	};

	const value: WorldCreationNavigationContextType = {
		currentStep,
		currentBranch,
		currentStepIndex,
		totalSteps,
		canGoNext,
		canGoPrev,
		nextStep,
		prevStep,
		goToStep,
		updateCurrentStepData,
		isStep,
	};

	return <WorldCreationNavigationContext.Provider value={value}>{children}</WorldCreationNavigationContext.Provider>;
};
