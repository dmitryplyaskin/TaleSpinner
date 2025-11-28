import React, { useEffect } from 'react';
import { Container, Typography, Box, IconButton, Tooltip } from '@mui/material';
import { Settings, Add } from '@mui/icons-material';
import { goToWorldCreation, goToWorldPreparation } from '../model/app-navigation';
import { ActionCard } from '../ui';
import { GameSessionsGrid } from './game-sessions-grid';
import { openSettings } from '../features/settings';
import { loadSavedWorldsFx } from '@model/game-sessions';

export const WelcomeScreen: React.FC = () => {
	useEffect(() => {
		loadSavedWorldsFx();
	}, []);

	const handleCreateNewWorld = () => {
		goToWorldCreation();
	};

	const handlePlaySession = (worldId: string) => {
		goToWorldPreparation(worldId);
	};

	const handleSettings = () => {
		openSettings();
	};

	return (
		<Box sx={{ minHeight: '100vh', position: 'relative' }}>
			{/* Кнопка настроек в правом верхнем углу */}
			<Tooltip title="Настройки" placement="left">
				<IconButton
					onClick={handleSettings}
					sx={{
						position: 'fixed',
						top: 16,
						right: 16,
						color: 'text.secondary',
						backgroundColor: 'background.paper',
						border: '1px solid',
						borderColor: 'divider',
						'&:hover': {
							color: 'primary.main',
							borderColor: 'primary.main',
							backgroundColor: 'action.hover',
						},
					}}
				>
					<Settings />
				</IconButton>
			</Tooltip>

			<Container maxWidth="md" sx={{ py: 8 }}>
				<Box display="flex" flexDirection="column" alignItems="center" gap={5}>
					{/* Логотип и заголовок */}
					<Box textAlign="center" sx={{ mb: 2 }}>
						<Typography
							variant="h1"
							component="h1"
							sx={{
								color: 'primary.main',
								mb: 1,
								textShadow: '0 0 30px rgba(212, 175, 55, 0.4)',
							}}
						>
							TaleSpinner
						</Typography>
						<Typography
							variant="h5"
							component="h2"
							color="text.secondary"
							sx={{ fontStyle: 'italic' }}
						>
							Добро пожаловать в мир приключений
						</Typography>
					</Box>

					{/* Карточка создания нового мира */}
					<Box sx={{ width: '100%', maxWidth: 400 }}>
						<ActionCard
							title="Создать новый мир"
							description="Начните новое приключение в уникальном мире"
							icon={<Add fontSize="large" />}
							onClick={handleCreateNewWorld}
							buttonText="Создать"
							variant="contained"
							width={400}
						/>
					</Box>

					{/* Секция с сохранёнными мирами */}
					<Box sx={{ mt: 4, width: '100%' }}>
						<GameSessionsGrid onPlaySession={handlePlaySession} />
					</Box>
				</Box>
			</Container>

		</Box>
	);
};
