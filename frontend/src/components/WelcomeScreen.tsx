import React from 'react';
import { Container, Typography, Box, IconButton } from '@mui/material';
import { Settings, Add, PlayArrow } from '@mui/icons-material';
import { navigateToScreen, ROUTES } from '../model/navigation';
import { ActionCard } from '../ui';
import { SettingsModal } from './settings_modal';
import { openSettingsModal } from '../model/settings';

export const WelcomeScreen: React.FC = () => {
	const handleCreateNewWorld = () => {
		navigateToScreen(ROUTES.WORLD_SELECTION);
	};

	const handleContinueGame = () => {
		// Пока не работает
		console.log('Продолжить игру');
	};

	const handleSettings = () => {
		openSettingsModal();
	};

	return (
		<Container maxWidth="md" sx={{ py: 4 }}>
			<Box display="flex" flexDirection="column" alignItems="center" gap={4}>
				<Typography variant="h2" component="h1" textAlign="center" gutterBottom>
					TaleSpinner
				</Typography>

				<Typography variant="h5" component="h2" textAlign="center" color="text.secondary" gutterBottom>
					Добро пожаловать в мир приключений
				</Typography>

				<Box display="flex" gap={3} flexWrap="wrap" justifyContent="center" sx={{ mt: 4 }}>
					<ActionCard
						title="Создать новый мир"
						description="Начните новое приключение в уникальном мире"
						icon={<Add color="primary" fontSize="large" />}
						onClick={handleCreateNewWorld}
						buttonText="Создать"
						variant="contained"
					/>

					<ActionCard
						title="Продолжить игру"
						description="Вернитесь к сохранённому приключению"
						icon={<PlayArrow color="primary" fontSize="large" />}
						onClick={handleContinueGame}
						buttonText="Продолжить"
						variant="outlined"
						disabled={true}
					/>
				</Box>

				<Box sx={{ mt: 4 }}>
					<IconButton
						onClick={handleSettings}
						size="large"
						sx={{
							border: '1px solid',
							borderColor: 'divider',
							borderRadius: 2,
							px: 3,
							py: 1,
						}}
					>
						<Settings sx={{ mr: 1 }} />
						<Typography variant="body1">Настройки</Typography>
					</IconButton>
				</Box>
			</Box>

			<SettingsModal />
		</Container>
	);
};
