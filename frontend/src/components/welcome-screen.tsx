import React, { useEffect } from 'react';
import { Container, Typography, Box } from '@mui/material';
import { Add } from '@mui/icons-material';
import { goToWorldCreation, goToWorldPreparation } from '../model/app-navigation';
import { ActionCard } from '../ui';
import { GameSessionsGrid } from './game-sessions-grid';
import { loadSavedWorldsFx } from '@model/game-sessions';
import { MainLayout, Sidebar } from './layout';

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

	return (
		<MainLayout
			sidebar={<Sidebar onSelectWorld={handlePlaySession} />}
			showSidebar={true}
			showRightPanel={false}
		>
			<Box
				sx={{
					height: '100%',
					overflowY: 'auto',
				}}
			>
				<Container 
					maxWidth="md" 
					sx={{ 
						py: 8,
						minHeight: '100%',
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<Box display="flex" flexDirection="column" alignItems="center" gap={5}>
						{/* Логотип и заголовок */}
						<Box textAlign="center" sx={{ mb: 2 }}>
							<Typography
								variant="h1"
								component="h1"
								sx={{
									color: 'primary.main',
									mb: 1,
									fontSize: { xs: '2.5rem', md: '3.5rem' },
									textShadow: '0 0 30px rgba(212, 175, 55, 0.4)',
								}}
							>
								Добро пожаловать
							</Typography>
							<Typography
								variant="h5"
								component="h2"
								color="text.secondary"
								sx={{ fontStyle: 'italic' }}
							>
								в мир приключений TaleSpinner
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
		</MainLayout>
	);
};

