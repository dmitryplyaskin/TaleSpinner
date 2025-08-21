import React from 'react';
import { Box, Typography, Divider, Container, Paper, Button, Tab, Tabs } from '@mui/material';
import { Character } from '@shared/types/character';
import { useForm } from 'react-hook-form';
import { CharacterBasicForm } from './forms/character-basic-form';
import { CharacterDetailedForm } from './forms/character-detailed-form';
import { useWorldCreationNavigation } from './navigation/navigation';

export interface CharacterCreationProps {
	onSave?: (character: Character) => void;
	onCancel?: () => void;
}

export const CharacterCreation: React.FC<CharacterCreationProps> = ({ onSave, onCancel }) => {
	const [activeTab, setActiveTab] = React.useState(0);
	const { currentBranch, currentStepIndex, nextStep, updateCurrentStepData } = useWorldCreationNavigation();

	const previousStep = currentBranch?.steps?.[Math.max(0, currentStepIndex - 1)];
	const worldPrimer = previousStep?.data?.worldPrimer;

	const { control, handleSubmit, reset } = useForm<Character>({
		defaultValues: {
			name: '',
			race: '',
			gender: '',
			age: 18,
			occupation: '',
			appearance: {
				height: '',
				weight: '',
				hair_color: '',
				eye_color: '',
				skin_color: '',
				distinctive_features: '',
				description: '',
			},
			personality: {
				traits: [''],
				background: '',
				motivations: [''],
				fears: [''],
				strengths: [''],
				weaknesses: [''],
			},
			skills: {
				combat_skills: [''],
				social_skills: [''],
				knowledge_skills: [''],
				magical_skills: [],
				special_abilities: [''],
			},
			equipment: {
				weapons: [''],
				armor: '',
				items: [''],
				clothing: '',
			},
			background: {
				family: '',
				occupation: '',
				history: '',
				relationships: [{ name: '', relation: '', description: '' }],
			},
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

	const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
		setActiveTab(newValue);
	};

	return (
		<Container maxWidth="lg">
			<Box py={3}>
				{/* Заголовок секции */}
				<Box textAlign="center" mb={4}>
					<Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
						Создание персонажа
					</Typography>
					<Typography variant="body1" color="text.secondary" sx={{ maxWidth: '600px', mx: 'auto' }}>
						Создайте уникального персонажа для вашего мира. Заполните основную информацию и добавьте детали для более
						глубокой проработки.
					</Typography>
				</Box>

				{/* Навигационные вкладки */}
				<Paper elevation={1} sx={{ mb: 4, borderRadius: 2 }}>
					<Tabs
						value={activeTab}
						onChange={handleTabChange}
						variant="fullWidth"
						sx={{
							'& .MuiTabs-indicator': {
								height: 3,
							},
						}}
					>
						<Tab label="Основная информация" />
						<Tab label="Детальные характеристики" />
					</Tabs>
				</Paper>

				{/* Содержимое вкладок */}
				<Box>
					{/* Основная информация */}
					{activeTab === 0 && (
						<Paper elevation={2} sx={{ p: 4, mb: 4, borderRadius: 2 }}>
							<Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 500 }}>
								Основная информация о персонаже
							</Typography>
							<CharacterBasicForm control={control} />
						</Paper>
					)}

					{/* Детальные характеристики */}
					{activeTab === 1 && (
						<Paper elevation={2} sx={{ p: 4, mb: 4, borderRadius: 2 }}>
							<Box textAlign="center" mb={4}>
								<Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
									Детальные характеристики персонажа
								</Typography>
								<Typography variant="body2" color="text.secondary" sx={{ maxWidth: '800px', mx: 'auto' }}>
									Добавьте подробные черты характера, навыки, экипировку и связи. Эти детали сделают вашего персонажа
									более живым и интересным.
								</Typography>
							</Box>
							<CharacterDetailedForm control={control} />
						</Paper>
					)}
				</Box>

				<Divider sx={{ my: 4 }} />

				{/* Кнопки управления */}
				<Paper elevation={2} sx={{ p: 4, mb: 4, borderRadius: 2 }}>
					<Box display="flex" justifyContent="center" gap={2} flexWrap="wrap">
						<Button variant="outlined" color="secondary" onClick={handleReset} sx={{ minWidth: 120 }}>
							Очистить форму
						</Button>

						{onCancel && (
							<Button variant="outlined" onClick={onCancel} sx={{ minWidth: 120 }}>
								Отменить
							</Button>
						)}

						<Button variant="contained" color="primary" onClick={handleSubmit(handleSave)} sx={{ minWidth: 120 }}>
							Создать персонажа
						</Button>
					</Box>
				</Paper>
			</Box>
		</Container>
	);
};
