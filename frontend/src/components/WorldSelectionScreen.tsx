import React, { useState } from 'react';
import { Container, Typography, Button, Box, IconButton, TextField, Collapse } from '@mui/material';
import { ArrowBack, Castle, Computer, Home, Add } from '@mui/icons-material';
import { navigateToScreen, selectWorld, goBack, ROUTES } from '../model/navigation';
import type { WorldType } from '../model/navigation';
import { ActionCard, ProgressLoader } from '../ui';
import { useProgressLoader } from '../hooks/useProgressLoader';
import { getWorldSetupTasks } from '../utils/mockRequests';

export const WorldSelectionScreen: React.FC = () => {
	const { isLoading, steps, currentStep, executeWithProgress, cancel } = useProgressLoader();
	const [selectedWorldType, setSelectedWorldType] = useState<WorldType | null>(null);
	const [additionalInfo, setAdditionalInfo] = useState('');

	const handleWorldCardClick = (worldType: WorldType) => {
		setSelectedWorldType(worldType);
		setAdditionalInfo(''); // Сбрасываем дополнительную информацию при смене мира
	};

	const handleCreateSelectedWorld = async () => {
		if (!selectedWorldType) return;

		try {
			const tasks = getWorldSetupTasks(selectedWorldType);
			const worldTitles: Record<WorldType, string> = {
				fantasy: 'Создание фэнтезийного мира',
				cyberpunk: 'Создание киберпанк мира',
				everyday: 'Создание повседневного мира',
				custom: 'Создание пользовательского мира',
			};

			await executeWithProgress(tasks, worldTitles[selectedWorldType]);

			// Если все прошло успешно, выбираем мир и переходим дальше
			// Здесь можно использовать additionalInfo для передачи дополнительной информации
			selectWorld(selectedWorldType);
			navigateToScreen(ROUTES.CHARACTER_CREATION);
		} catch (error) {
			// Ошибка или отмена - ничего не делаем, просто остаемся на текущем экране
			console.log('Создание мира прервано:', error);
		}
	};

	const handleCustomWorld = async () => {
		try {
			const tasks = getWorldSetupTasks('custom');
			await executeWithProgress(tasks, 'Создание пользовательского мира');

			selectWorld('custom');
			// Здесь будет переход к созданию кастомного мира
			console.log('Создание кастомного мира завершено');
		} catch (error) {
			console.log('Создание кастомного мира прервано:', error);
		}
	};

	const handleGoBack = () => {
		goBack();
	};

	return (
		<Container maxWidth="lg" sx={{ py: 4 }}>
			<Box display="flex" alignItems="center" gap={2} mb={4}>
				<IconButton onClick={handleGoBack} size="large">
					<ArrowBack />
				</IconButton>
				<Typography variant="h4" component="h1">
					Выбор мира
				</Typography>
			</Box>

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
					disabled={isLoading}
				/>

				<ActionCard
					title="Повседневный"
					description="Современный мир обычной жизни с необычными событиями"
					icon={<Home color="primary" fontSize="large" />}
					onClick={() => handleWorldCardClick('everyday')}
					buttonText={selectedWorldType === 'everyday' ? 'Выбрано' : 'Выбрать'}
					width={280}
					disabled={isLoading}
				/>
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

			<Box display="flex" justifyContent="center">
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

			<ProgressLoader open={isLoading} steps={steps} currentStep={currentStep} onCancel={cancel} />
		</Container>
	);
};
