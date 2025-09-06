import React, { useEffect } from 'react';
import { Container, Typography, Box, IconButton } from '@mui/material';
import { Settings, Add, Chat } from '@mui/icons-material';
import { goToWorldCreation, goToChat } from '../model/app-navigation';
import { ActionCard } from '../ui';
import { SettingsModal } from './settings-modal';
import { GameSessionsGrid } from './game-sessions-grid';
import { openSettingsModal } from '../model/settings';
import { loadGameSessionsFx } from '@model/game-sessions';

export const WelcomeScreen: React.FC = () => {
	useEffect(() => {
		loadGameSessionsFx();
	}, []);

	const handleCreateNewWorld = () => {
		goToWorldCreation();
	};

	const handleGoToChat = () => {
		goToChat();
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
						title="Интерактивный чат"
						description="Общайтесь с ИИ-мастером и создавайте истории"
						icon={<Chat color="primary" fontSize="large" />}
						onClick={handleGoToChat}
						buttonText="Открыть чат"
						variant="outlined"
					/>
				</Box>

				{/* Секция с сохранёнными игровыми сессиями */}
				<Box sx={{ mt: 6, width: '100%' }}>
					<GameSessionsGrid onPlaySession={handlePlaySession} />
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
