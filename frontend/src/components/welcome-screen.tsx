import React, { useEffect } from 'react';
import { Container, Typography, Box, IconButton, Tooltip } from '@mui/material';
import { Settings, Add } from '@mui/icons-material';
import { goToWorldCreation, goToChat } from '../model/app-navigation';
import { ActionCard } from '../ui';
import { SettingsModal } from './settings-modal';
import { GameSessionsGrid } from './game-sessions-grid';
import { openSettingsModal } from '../model/settings';
import { loadSavedWorldsFx } from '@model/game-sessions';

export const WelcomeScreen: React.FC = () => {
	useEffect(() => {
		loadSavedWorldsFx();
	}, []);

	const handleCreateNewWorld = () => {
		goToWorldCreation();
	};

	const handlePlaySession = (sessionId: string) => {
		// TODO: Реализовать переход к игровой сессии с конкретным ID
		console.log('Playing session:', sessionId);
		goToChat();
	};

	const handleSettings = () => {
		openSettingsModal();
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

			<Container maxWidth="md" sx={{ py: 6 }}>
				<Box display="flex" flexDirection="column" alignItems="center" gap={4}>
					{/* Логотип и заголовок */}
					<Box textAlign="center" sx={{ mb: 2 }}>
						<Typography
							variant="h2"
							component="h1"
							sx={{
								fontFamily: '"Cinzel", serif',
								fontWeight: 700,
								letterSpacing: '0.05em',
								color: 'primary.main',
								mb: 1,
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
							icon={<Add color="primary" fontSize="large" />}
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

			<SettingsModal />
		</Box>
	);
};
