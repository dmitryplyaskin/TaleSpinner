import React from 'react';
import { goBack } from '@model/navigation';
import { ArrowBack } from '@mui/icons-material';
import { Box, Container, IconButton, Typography } from '@mui/material';
import { useWorldCreationNavigation } from './world-creation-navigation';
import { WorldCreationStepper } from './stepper';
import { StepNavigation } from './step-navigation';
import { StepConfig } from './types';
import { CreateWorld } from './select-world';
import { WorldSetupStep } from './world-setup-step';

const WorldCreationContent: React.FC = () => {
	const { currentStep, currentBranch, currentStepIndex, isStep } = useWorldCreationNavigation();

	const getStepDescription = (stepId: string): string => {
		switch (stepId) {
			case 'world-type-selection':
				return 'Выберите базовый тип мира';
			case 'world-selection':
				return 'Выберите подходящий мир';
			case 'world-customization':
				return 'Дополнительные настройки';
			default:
				return '';
		}
	};

	// Создаем конфигурацию шагов для степпера на основе данных из навигации
	const steps: StepConfig[] =
		currentBranch?.steps?.map((step: any, index: number) => ({
			id: step.id,
			label: step.name,
			description: getStepDescription(step.id),
			completed: index < currentStepIndex,
		})) || [];

	const handleGoBack = () => {
		goBack();
	};

	const renderStepContent = () => {
		if (isStep('world-type-selection')) {
			return <WorldSetupStep />;
		}

		if (isStep('world-selection')) {
			return <CreateWorld />;
		}

		if (isStep('world-customization')) {
			return (
				<Box>
					<Box textAlign="center" py={8}>
						<Typography variant="h5" gutterBottom>
							Дополнительные настройки
						</Typography>
						<Typography variant="body1" color="text.secondary">
							Этот шаг будет реализован позже
						</Typography>
					</Box>
					<StepNavigation nextLabel="Завершить" showNext={false} />
				</Box>
			);
		}

		return null;
	};

	return (
		<Container maxWidth="lg" sx={{ py: 4 }}>
			<Box display="flex" alignItems="center" gap={2} mb={4}>
				<IconButton onClick={handleGoBack} size="large">
					<ArrowBack />
				</IconButton>
				<Typography variant="h4" component="h1">
					Создание мира
				</Typography>
			</Box>
			<WorldCreationStepper steps={steps} activeStep={currentStep} alternativeLabel />

			{renderStepContent()}
		</Container>
	);
};

export const WorldCreation: React.FC = () => {
	return <WorldCreationContent />;
};

// Экспорты для использования в других компонентах
export { WorldCreationStepper } from './stepper';
export { WorldCreationNavigationProvider, useWorldCreationNavigation } from './world-creation-navigation';
export { StepNavigation } from './step-navigation';
export { WorldSetupStep } from './world-setup-step';
export type { StepConfig } from './types';
