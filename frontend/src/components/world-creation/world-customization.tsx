import React from 'react';
import { Box, Typography, Divider, Container, Paper, Button } from '@mui/material';
import { CreatedWorldDraft, WorldCustomizationData } from '@shared/types/world-creation';
import { useWorldCreationNavigation } from './navigation/navigation';
import { WorldDraftEditForm } from './forms/world-draft-edit-form';
import { CustomizationAdvancedForm } from './forms/customization-advanced-form';
import { useForm } from 'react-hook-form';
import { $worldCreatePrimerProgress, createWorldFx } from '@model/world-creation';
import { useUnit } from 'effector-react';

export const WorldCustomization: React.FC = () => {
	const { currentBranch, currentStepIndex, updateCurrentStepData, nextStep } = useWorldCreationNavigation();
	const isLoading = useUnit($worldCreatePrimerProgress);

	const previousStep = currentBranch?.steps?.[Math.max(0, currentStepIndex - 1)];
	const selectedWorld = (previousStep?.data?.selectedWorld || null) as CreatedWorldDraft | null;

	const { control, handleSubmit, watch } = useForm<WorldCustomizationData>({
		values: {
			title: selectedWorld?.title || '',
			genre: selectedWorld?.genre || '',
			toneText: (selectedWorld?.tone || []).join(', '),
			unique_feature: selectedWorld?.unique_feature || '',
			synopsis: selectedWorld?.synopsis || '',
			racesEnabled: false,
			racesCount: 3,
			racesDescription: '',
			timelineEnabled: false,
			timelineDescription: '',
			magicEnabled: false,
			magicDescription: '',
			factionsEnabled: false,
			factionsCount: 3,
			factionsDescription: '',
			locationsEnabled: false,
			locationsCount: 3,
			locationsDescription: '',
		},
	});

	const handleCreateWorld = async (data: WorldCustomizationData) => {
		// eslint-disable-next-line no-console
		console.log('Create world (stub submit)', data);
		const world = await createWorldFx(data);
		updateCurrentStepData({ worldPrimer: world });
		nextStep();
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
				<Box textAlign="center" mb={4}>
					<Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
						Редактирование мира
					</Typography>
					<Typography variant="body1" color="text.secondary" sx={{ maxWidth: '600px', mx: 'auto' }}>
						Вы можете отредактировать все текущие данные, полученные на предыдущем шаге.
					</Typography>
				</Box>

				<Paper elevation={2} sx={{ p: 4, mb: 4, borderRadius: 2 }}>
					<Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 500 }}>
						Основные параметры мира
					</Typography>
					<WorldDraftEditForm control={control} />
				</Paper>

				<Divider sx={{ my: 4 }} />

				<Paper elevation={2} sx={{ p: 4, mb: 4, borderRadius: 2 }}>
					<Box textAlign="center" mb={4}>
						<Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
							Дополнительные параметры мира
						</Typography>
						<Typography variant="body2" color="text.secondary" sx={{ maxWidth: '800px', mx: 'auto' }}>
							Укажите опциональные разделы. Каждое поле можно включить чекбоксом. Чем больше выбрано параметров, тем
							глубже будет мир, но тем больше токенов будет потрачено. Некоторые разделы будут дополняться автоматически
							по мере игры.
						</Typography>
					</Box>

					<CustomizationAdvancedForm control={control} watch={watch} />
				</Paper>

				<Divider sx={{ my: 4 }} />

				<Paper elevation={2} sx={{ p: 4, mb: 4, borderRadius: 2 }}>
					<Box display="flex" justifyContent="center" flexDirection="column" alignItems="center">
						<Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
							Нажав на кнопку ниже, начнется процесс создания мира, это может занять некоторое время. <br /> На
							следующем шаге вы сможете просмотреть и отредактировать полученный результат.
						</Typography>
						<Button variant="contained" color="primary" onClick={handleSubmit(handleCreateWorld)} disabled={isLoading}>
							Создать мир
						</Button>
					</Box>
				</Paper>
			</Box>
		</Container>
	);
};
