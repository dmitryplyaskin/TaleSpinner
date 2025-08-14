import React, { useState } from 'react';
import { Typography, Button, Box, TextField, Collapse } from '@mui/material';
import { Castle, Add, Computer } from '@mui/icons-material';
import { ActionCard } from '../../ui';
import { $worldCreateProgress, createWorldFx } from '@model/world-creation';
import { WorldType } from '@shared/types/world';
import { useUnit } from 'effector-react';
import { useWorldCreationNavigation } from './navigation/navigation';
import { StepNavigation } from './navigation/step-navigation';

export const WorldSetupStep: React.FC = () => {
	// const { isLoading, steps, currentStep, executeWithProgress, cancel } = useProgressLoader();
	const [selectedWorldType, setSelectedWorldType] = useState<WorldType | null>(null);
	const [additionalInfo, setAdditionalInfo] = useState('');
	const isLoading = useUnit($worldCreateProgress);
	const { nextStep, updateCurrentStepData } = useWorldCreationNavigation();

	const handleWorldCardClick = (worldType: WorldType) => {
		setSelectedWorldType(worldType);
		setAdditionalInfo(''); // Сбрасываем дополнительную информацию при смене мира
	};

	const handleCreateSelectedWorld = async () => {
		if (!selectedWorldType) return;

		try {
			await createWorldFx({ worldType: selectedWorldType as WorldType, userPrompt: additionalInfo });
			// Сохраняем данные текущего шага
			updateCurrentStepData({
				worldType: selectedWorldType,
				additionalInfo,
				completed: true,
			});
			// Переходим к следующему шагу
			nextStep();
		} catch (error) {
			console.error('Ошибка создания мира:', error);
		}
	};

	const handleCustomWorld = async () => {};

	return (
		<Box>
			<Typography variant="h5" component="h2" gutterBottom sx={{ mb: 4 }}>
				Готовые миры
			</Typography>

			<Box display="flex" gap={3} flexWrap="wrap" justifyContent="center" sx={{ mb: 6 }}>
				<ActionCard
					title="Фэнтези"
					description="Мир магии, драконов и средневековых приключений"
					icon={<Castle color="primary" fontSize="large" />}
					onClick={() => handleWorldCardClick('fantasy')}
					buttonText={selectedWorldType === 'fantasy' ? 'Выбрано' : 'Выбрать'}
					width={280}
					disabled={isLoading}
				/>

				<ActionCard
					title="Киберпанк"
					description="Футуристический мир высоких технологий и корпораций"
					icon={<Computer color="primary" fontSize="large" />}
					onClick={() => handleWorldCardClick('cyberpunk')}
					buttonText={selectedWorldType === 'cyberpunk' ? 'Выбрано' : 'Выбрать'}
					width={280}
					disabled
				/>

				{/* <ActionCard
					title="Повседневный"
					description="Современный мир обычной жизни с необычными событиями"
					icon={<Home color="primary" fontSize="large" />}
					onClick={() => handleWorldCardClick('everyday')}
					buttonText={selectedWorldType === 'everyday' ? 'Выбрано' : 'Выбрать'}
					width={280}
					disabled={isLoading}
				/> */}
			</Box>

			{/* Секция с дополнительной информацией */}
			<Collapse in={!!selectedWorldType && selectedWorldType !== 'custom'}>
				<Box sx={{ mb: 4 }}>
					<Typography variant="h6" gutterBottom>
						Дополнительная информация о мире (опционально)
					</Typography>
					<TextField
						fullWidth
						multiline
						rows={4}
						placeholder="Опишите дополнительные детали, особенности или ограничения вашего мира..."
						value={additionalInfo}
						onChange={(e) => setAdditionalInfo(e.target.value)}
						variant="outlined"
						disabled={isLoading}
					/>
					<Box display="flex" justifyContent="center" mt={3}>
						<Button
							variant="contained"
							size="large"
							onClick={handleCreateSelectedWorld}
							sx={{ px: 4, py: 2 }}
							disabled={isLoading}
						>
							Создать выбранный мир
						</Button>
					</Box>
				</Box>
			</Collapse>

			<Box display="flex" justifyContent="center" sx={{ mb: 4 }}>
				<Button
					variant="outlined"
					size="large"
					startIcon={<Add />}
					onClick={handleCustomWorld}
					sx={{ px: 4, py: 2 }}
					disabled
				>
					Создать свой мир
				</Button>
			</Box>
		</Box>
	);
};
