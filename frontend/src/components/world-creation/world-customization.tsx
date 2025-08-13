import React from 'react';
import { Box, Typography, Divider, Container, Paper } from '@mui/material';
import { CreatedWorldDraft } from '@shared/types/world-creation';
import { useWorldCreationNavigation } from './navigation/navigation';
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
			<Container maxWidth="md">
				<Box
					display="flex"
					flexDirection="column"
					alignItems="center"
					justifyContent="center"
					minHeight="50vh"
					textAlign="center"
					px={2}
				>
					<Typography variant="h6" color="text.secondary" gutterBottom>
						Данные выбранного мира не найдены. Вернитесь на предыдущий шаг и выберите мир.
					</Typography>
				</Box>
			</Container>
		);
	}

	return (
		<Container maxWidth="lg">
			<Box py={3}>
				{/* Заголовок секции */}
				<Box textAlign="center" mb={4}>
					<Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
						Редактирование мира
					</Typography>
					<Typography variant="body1" color="text.secondary" sx={{ maxWidth: '600px', mx: 'auto' }}>
						Вы можете отредактировать все текущие данные, полученные на предыдущем шаге.
					</Typography>
				</Box>

				{/* Форма редактирования основных данных мира */}
				<Paper elevation={2} sx={{ p: 4, mb: 4, borderRadius: 2 }}>
					<Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 500 }}>
						Основные параметры мира
					</Typography>
					<WorldDraftEditForm initialWorld={selectedWorld} onSubmit={handleEditWorldSubmit} />
				</Paper>

				<Divider sx={{ my: 4 }} />

				{/* Дополнительные параметры */}
				<Paper elevation={2} sx={{ p: 4, mb: 4, borderRadius: 2 }}>
					<Box textAlign="center" mb={4}>
						<Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
							Дополнительные параметры мира
						</Typography>
						<Typography variant="body2" color="text.secondary" sx={{ maxWidth: '500px', mx: 'auto' }}>
							Укажите опциональные разделы. Каждое поле можно включить чекбоксом.
						</Typography>
					</Box>

					<CustomizationAdvancedForm onSubmit={handleAdvancedSubmit} />
				</Paper>
			</Box>
		</Container>
	);
};
