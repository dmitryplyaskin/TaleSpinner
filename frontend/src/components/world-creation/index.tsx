import React from 'react';
import { goBack } from '@model/navigation_old';
import { ArrowBack } from '@mui/icons-material';
import { Box, Container, IconButton, Typography } from '@mui/material';
import { WorldCreationProvider, useWorldCreationStepper } from './world-creation-context';
import { WorldCreationStepper } from './stepper';
import { StepNavigation } from './step-navigation';
import { StepConfig } from './types';
import { CreateWorld } from './select-world';

// Определяем шаги создания мира
const WORLD_CREATION_STEPS: StepConfig[] = [
	{
		id: 'setup',
		label: 'Настройка',
		description: 'Базовые параметры мира',
	},
	{
		id: 'select-world',
		label: 'Выбор мира',
		description: 'Выберите подходящий мир',
	},
	{
		id: 'customize',
		label: 'Настройка',
		description: 'Дополнительные настройки',
	},
];

const WorldCreationContent: React.FC = () => {
	const { currentStep, steps } = useWorldCreationStepper();

	const handleGoBack = () => {
		goBack();
	};

	const renderStepContent = () => {
		switch (currentStep) {
			case 0:
				return (
					<Box>
						<Box textAlign="center" py={8}>
							<Typography variant="h5" gutterBottom>
								Настройка параметров мира
							</Typography>
							<Typography variant="body1" color="text.secondary">
								Этот шаг будет реализован позже
							</Typography>
						</Box>
						<StepNavigation showPrev={false} />
					</Box>
				);
			case 1:
				return <CreateWorld />;
			case 2:
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
			default:
				return null;
		}
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
	return (
		<WorldCreationProvider initialSteps={WORLD_CREATION_STEPS}>
			<WorldCreationContent />
		</WorldCreationProvider>
	);
};

// Экспорты для использования в других компонентах
export { WorldCreationStepper } from './stepper';
export { WorldCreationProvider, useWorldCreationStepper } from './world-creation-context';
export { StepNavigation } from './step-navigation';
export type { StepConfig } from './types';
