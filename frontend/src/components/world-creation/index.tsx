import React from 'react';
import { goBack } from '@model/navigation';
import { ArrowBack } from '@mui/icons-material';
import { Box, Container, IconButton, Typography } from '@mui/material';
import { useWorldCreationNavigation, WorldCreationStepper, StepConfig } from './navigation';
import { SelectDraftWorld } from './select-draft-world';
import { WorldSetupStep } from './world-setup-step';
import { WorldCustomization } from './world-customization';
import { WorldPrimerEdit } from './world-primer-edit';
import { CharacterCreation } from './character-creation';
import { WorldCompletion } from './world-completion';

const WorldCreationContent: React.FC = () => {
	const { currentBranch, currentStepIndex, isStep } = useWorldCreationNavigation();

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
			case 'world-completion':
				return 'Завершение создания мира';
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

		if (isStep('world-completion')) {
			return <WorldCompletion />;
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
			<WorldCreationStepper steps={steps} activeStep={currentStepIndex} />

			{renderStepContent()}
		</Container>
	);
};

export const WorldCreation: React.FC = () => {
	return <WorldCreationContent />;
};
