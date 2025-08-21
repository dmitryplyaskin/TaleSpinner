import React from 'react';
import { goBack } from '@model/navigation';
import { ArrowBack } from '@mui/icons-material';
import { Box, Container, IconButton, Typography } from '@mui/material';
import { useWorldCreationNavigation } from './navigation/navigation';
import { WorldCreationStepper } from './navigation/stepper';
// import { StepNavigation } from './navigation/step-navigation';
import { StepConfig } from './navigation/types';
import { SelectDraftWorld } from './select-draft-world';
import { WorldSetupStep } from './world-setup-step';
import { WorldCustomization } from './world-customization';
import { WorldPrimerEdit } from './world-primer-edit';
import { CharacterCreation } from './character-creation';

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
			case 'world-primer-edit':
				return 'Редактирование мира';
			case 'character-creation':
				return 'Создание персонажа';
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
			return <SelectDraftWorld />;
		}

		if (isStep('world-customization')) {
			return <WorldCustomization />;
		}

		if (isStep('world-primer-edit')) {
			return <WorldPrimerEdit />;
		}

		if (isStep('character-creation')) {
			return <CharacterCreation />;
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
export { WorldCreationStepper } from './navigation/stepper';
export { WorldCreationNavigationProvider, useWorldCreationNavigation } from './navigation/navigation';
export { StepNavigation } from './navigation/step-navigation';
export { WorldSetupStep } from './world-setup-step';
export { WorldPrimerEdit } from './world-primer-edit';
export type { StepConfig } from './navigation/types';
