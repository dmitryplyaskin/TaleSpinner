import React from 'react';
import { Container, Typography, Button, Box, IconButton } from '@mui/material';
import { ArrowBack, Castle, Computer, Home, Add } from '@mui/icons-material';
import { navigateToScreen, selectWorld, goBack, ROUTES } from '../model/navigation';
import type { WorldType } from '../model/navigation';
import { ActionCard, ProgressLoader } from '../ui';
import { useProgressLoader } from '../hooks/useProgressLoader';
import { getWorldSetupTasks } from '../utils/mockRequests';

export const WorldSelectionScreen: React.FC = () => {
	const { isLoading, steps, currentStep, executeWithProgress, cancel } = useProgressLoader();

	const handleWorldSelect = async (worldType: WorldType) => {
		try {
			const tasks = getWorldSetupTasks(worldType);
			const worldTitles: Record<WorldType, string> = {
				fantasy: 'Создание фэнтезийного мира',
				cyberpunk: 'Создание киберпанк мира',
				everyday: 'Создание повседневного мира',
				custom: 'Создание пользовательского мира',
			};

			await executeWithProgress(tasks, worldTitles[worldType]);

			// Если все прошло успешно, выбираем мир и переходим дальше
			selectWorld(worldType);
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
					onClick={() => handleWorldSelect('fantasy')}
					buttonText="Выбрать"
					width={280}
					disabled={isLoading}
				/>

				<ActionCard
					title="Киберпанк"
					description="Футуристический мир высоких технологий и корпораций"
					icon={<Computer color="primary" fontSize="large" />}
					onClick={() => handleWorldSelect('cyberpunk')}
					buttonText="Выбрать"
					width={280}
					disabled={isLoading}
				/>

				<ActionCard
					title="Повседневный"
					description="Современный мир обычной жизни с необычными событиями"
					icon={<Home color="primary" fontSize="large" />}
					onClick={() => handleWorldSelect('everyday')}
					buttonText="Выбрать"
					width={280}
					disabled={isLoading}
				/>
			</Box>

			<Box display="flex" justifyContent="center">
				<Button
					variant="outlined"
					size="large"
					startIcon={<Add />}
					onClick={handleCustomWorld}
					sx={{ px: 4, py: 2 }}
					disabled={isLoading}
				>
					Создать свой мир
				</Button>
			</Box>

			<ProgressLoader open={isLoading} steps={steps} currentStep={currentStep} onCancel={cancel} />
		</Container>
	);
};
