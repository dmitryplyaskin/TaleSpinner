import React from 'react';
import { Box, Typography, Container, Paper, Button } from '@mui/material';
import { Character } from '@shared/types/character';
import { useForm } from 'react-hook-form';
import { useUnit } from 'effector-react';
import { CharacterSimpleForm } from './forms/character-simple-form';
import { useWorldCreationNavigation } from './navigation/navigation';
import { saveCharacterFx, $characterSaveProgress } from '../../model/world-creation';
import { WorldPrimer } from '@shared/types/world-creation';

export const CharacterCreation: React.FC = ({}) => {
	const { nextStep, updateCurrentStepData, currentBranch, currentStepIndex } = useWorldCreationNavigation();
	const isLoading = useUnit($characterSaveProgress);

	const previousStep = currentBranch?.steps?.[Math.max(0, currentStepIndex - 1)];
	const worldPrimer = (previousStep?.data?.worldPrimer || null) as WorldPrimer;

	const currentStep = currentBranch?.steps?.[currentStepIndex];
	const character = currentStep?.data?.worldPrimer?.characters?.userCharacter || null;

	const { control, handleSubmit, reset } = useForm<Character>({
		defaultValues: {
			name: character?.name || '',
			description: character?.description || '',
			appearance: character?.appearance || '',
			personality: character?.personality || '',
			clothing: character?.clothing || '',
			equipment: character?.equipment || '',
		},
	});

	const handleSave = async (data: Character) => {
		try {
			const savedWorld = await saveCharacterFx({
				character: data,
				worldId: worldPrimer?.id || '',
			});

			updateCurrentStepData({
				worldPrimer: savedWorld,
			});

			nextStep();
		} catch (error) {
			console.error('Ошибка сохранения персонажа:', error);
			// Здесь можно добавить уведомление об ошибке
		}
	};

	const handleReset = () => {
		reset();
	};

	return (
		<Container maxWidth="lg">
			<Box py={4}>
				{/* Заголовок секции */}
				<Box textAlign="center" mb={5}>
					<Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
						Создание вашего персонажа
					</Typography>
					<Typography variant="body1" color="text.secondary" sx={{ maxWidth: '500px', mx: 'auto', lineHeight: 1.6 }}>
						Создайте персонажа, за которого вы будете играть. Опишите его внешность, характер и снаряжение.
					</Typography>
				</Box>

				{/* Форма создания персонажа */}
				<Paper elevation={3} sx={{ p: 5, mb: 4, borderRadius: 3, backgroundColor: 'background.paper' }}>
					<CharacterSimpleForm control={control} />
				</Paper>

				{/* Кнопки управления */}
				<Paper elevation={2} sx={{ p: 4, borderRadius: 3, backgroundColor: 'grey.50' }}>
					<Box display="flex" justifyContent="center" gap={3} flexWrap="wrap">
						<Button
							variant="outlined"
							color="secondary"
							onClick={handleReset}
							sx={{
								minWidth: 140,
								py: 1.5,
								borderRadius: 2,
								textTransform: 'none',
								fontSize: '1rem',
							}}
						>
							Очистить форму
						</Button>

						<Button
							variant="contained"
							color="primary"
							onClick={handleSubmit(handleSave)}
							disabled={isLoading}
							sx={{
								minWidth: 140,
								py: 1.5,
								borderRadius: 2,
								textTransform: 'none',
								fontSize: '1rem',
								fontWeight: 600,
							}}
						>
							{isLoading ? 'Сохранение...' : 'Создать персонажа'}
						</Button>
					</Box>
				</Paper>
			</Box>
		</Container>
	);
};
