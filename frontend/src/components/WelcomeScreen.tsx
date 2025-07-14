import React from 'react';
import { Container, Typography, Card, CardContent, CardActions, Button, Box, IconButton } from '@mui/material';
import { Settings, Add, PlayArrow } from '@mui/icons-material';
import { navigateToScreen } from '../model/navigation';

export const WelcomeScreen: React.FC = () => {
	const handleCreateNewWorld = () => {
		navigateToScreen('world-selection');
	};

	const handleContinueGame = () => {
		// Пока не работает
		console.log('Продолжить игру');
	};

	const handleSettings = () => {
		// Пока не работает
		console.log('Настройки');
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
					<Card sx={{ minWidth: 300, cursor: 'pointer' }} onClick={handleCreateNewWorld}>
						<CardContent>
							<Box display="flex" alignItems="center" gap={2} mb={2}>
								<Add color="primary" fontSize="large" />
								<Typography variant="h5" component="h3">
									Создать новый мир
								</Typography>
							</Box>
							<Typography variant="body2" color="text.secondary">
								Начните новое приключение в уникальном мире
							</Typography>
						</CardContent>
						<CardActions>
							<Button size="large" fullWidth variant="contained">
								Создать
							</Button>
						</CardActions>
					</Card>

					<Card sx={{ minWidth: 300, cursor: 'pointer' }} onClick={handleContinueGame}>
						<CardContent>
							<Box display="flex" alignItems="center" gap={2} mb={2}>
								<PlayArrow color="primary" fontSize="large" />
								<Typography variant="h5" component="h3">
									Продолжить игру
								</Typography>
							</Box>
							<Typography variant="body2" color="text.secondary">
								Вернитесь к сохранённому приключению
							</Typography>
						</CardContent>
						<CardActions>
							<Button size="large" fullWidth variant="outlined" disabled>
								Продолжить
							</Button>
						</CardActions>
					</Card>
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
		</Container>
	);
};
