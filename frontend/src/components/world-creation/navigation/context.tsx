import React, { createContext, useContext, useState, ReactNode } from 'react';
import { StepConfig } from './types';

interface WorldCreationContextType {
	currentStep: number;
	steps: StepConfig[];
	goToStep: (stepIndex: number) => void;
	nextStep: () => void;
	prevStep: () => void;
	updateStep: (stepId: string, updates: Partial<StepConfig>) => void;
	canGoNext: boolean;
	canGoPrev: boolean;
}

const WorldCreationContext = createContext<WorldCreationContextType | undefined>(undefined);

export const useWorldCreationStepper = () => {
	const context = useContext(WorldCreationContext);
	if (!context) {
		throw new Error('useWorldCreationStepper must be used within WorldCreationProvider');
	}
	return context;
};

interface WorldCreationProviderProps {
	children: ReactNode;
	initialSteps: StepConfig[];
}

export const WorldCreationProvider: React.FC<WorldCreationProviderProps> = ({ children, initialSteps }) => {
	const [currentStep, setCurrentStep] = useState(0);
	const [steps, setSteps] = useState(initialSteps);

	const goToStep = (stepIndex: number) => {
		if (stepIndex >= 0 && stepIndex < steps.length) {
			setCurrentStep(stepIndex);
		}
	};

	const nextStep = () => {
		if (currentStep < steps.length - 1) {
			setCurrentStep(currentStep + 1);
		}
	};

	const prevStep = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	};

	const updateStep = (stepId: string, updates: Partial<StepConfig>) => {
		setSteps((prevSteps) => prevSteps.map((step) => (step.id === stepId ? { ...step, ...updates } : step)));
	};

	const canGoNext = currentStep < steps.length - 1;
	const canGoPrev = currentStep > 0;

	const value: WorldCreationContextType = {
		currentStep,
		steps,
		goToStep,
		nextStep,
		prevStep,
		updateStep,
		canGoNext,
		canGoPrev,
	};

	return <WorldCreationContext.Provider value={value}>{children}</WorldCreationContext.Provider>;
};
