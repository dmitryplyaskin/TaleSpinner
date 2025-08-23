import React from 'react';
import { Box, Typography, Container, Paper, Button } from '@mui/material';
import { Character } from '@shared/types/character';
import { useForm } from 'react-hook-form';
import { CharacterSimpleForm } from './forms/character-simple-form';
import { useWorldCreationNavigation } from './navigation/navigation';

export interface CharacterCreationProps {
	onSave?: (character: Character) => void;
	onCancel?: () => void;
}

export const CharacterCreation: React.FC<CharacterCreationProps> = ({ onSave, onCancel }) => {
	const { nextStep, updateCurrentStepData } = useWorldCreationNavigation();

	const { control, handleSubmit, reset } = useForm<Character>({
		defaultValues: {
			name: '',
			description: '',
			appearance: '',
			personality: '',
			clothing: '',
			equipment: '',
		},
	});

	const handleSave = (data: Character) => {
		const character: Character = {
			...data,
			id: `character_${Date.now()}`,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		// Сохраняем данные персонажа в текущем шаге
		updateCurrentStepData({
			character,
			completed: true,
		});

		if (onSave) {
			onSave(character);
		}

		// Переходим к следующему шагу
		nextStep();
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

						{onCancel && (
							<Button
								variant="outlined"
								onClick={onCancel}
								sx={{
									minWidth: 140,
									py: 1.5,
									borderRadius: 2,
									textTransform: 'none',
									fontSize: '1rem',
								}}
							>
								Отменить
							</Button>
						)}

						<Button
							variant="contained"
							color="primary"
							onClick={handleSubmit(handleSave)}
							sx={{
								minWidth: 140,
								py: 1.5,
								borderRadius: 2,
								textTransform: 'none',
								fontSize: '1rem',
								fontWeight: 600,
							}}
						>
							Создать персонажа
						</Button>
					</Box>
				</Paper>
			</Box>
		</Container>
	);
};
