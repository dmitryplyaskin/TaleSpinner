import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { CreatedWorldDraft } from '@shared/types/world-creation';
import { useWorldCreationNavigation } from './navigation/navigation';
import { StepNavigation } from './navigation/step-navigation';
import { WorldDraftEditForm } from './forms/world-draft-edit-form';
import { CustomizationAdvancedForm, CustomizationAdvancedData } from './forms/customization-advanced-form';

export const WorldCustomization: React.FC = () => {
	const { currentBranch, currentStepIndex, updateCurrentStepData } = useWorldCreationNavigation();

	const previousStep = currentBranch?.steps?.[Math.max(0, currentStepIndex - 1)];
	const selectedWorld = (previousStep?.data?.selectedWorld || null) as CreatedWorldDraft | null;

	const handleEditWorldSubmit = (updated: CreatedWorldDraft) => {
		// eslint-disable-next-line no-console
		console.log('Updated world draft (stub submit):', updated);
		updateCurrentStepData({ updatedWorld: updated, completed: true });
	};

	const handleAdvancedSubmit = (data: CustomizationAdvancedData) => {
		// eslint-disable-next-line no-console
		console.log('Advanced customization (stub submit):', data);
		updateCurrentStepData({ advancedCustomization: data });
	};

	if (!selectedWorld) {
		return (
			<Box textAlign="center" py={8}>
				<Typography variant="h6" color="text.secondary">
					Данные выбранного мира не найдены. Вернитесь на предыдущий шаг и выберите мир.
				</Typography>
				<StepNavigation showNext={false} />
			</Box>
		);
	}

	return (
		<Box>
			<Box textAlign="center" py={2} mb={3}>
				<Typography variant="h5" gutterBottom>
					Редактирование мира
				</Typography>
				<Typography variant="body1" color="text.secondary">
					Вы можете отредактировать все текущие данные, полученные на предыдущем шаге.
				</Typography>
			</Box>

			<WorldDraftEditForm initialWorld={selectedWorld} onSubmit={handleEditWorldSubmit} />

			<Divider sx={{ my: 4 }} />

			<Box textAlign="center" mb={2}>
				<Typography variant="h6" gutterBottom>
					Дополнительные параметры мира
				</Typography>
				<Typography variant="body2" color="text.secondary">
					Укажите опциональные разделы. Каждое поле можно включить чекбоксом.
				</Typography>
			</Box>

			<CustomizationAdvancedForm onSubmit={handleAdvancedSubmit} />

			<Box mt={2}>
				<StepNavigation nextLabel="Завершить" showNext={false} />
			</Box>
		</Box>
	);
};
