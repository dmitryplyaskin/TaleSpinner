import React from 'react';
import { Box, Typography, Grid, Card, CardContent, CardActions, Button, Chip, Stack } from '@mui/material';
import { PlayArrow, Schedule, Public } from '@mui/icons-material';
import { WorldPrimer } from '@shared/types/world-creation';
import { useStore } from 'effector-react';
import { $gameSessions } from '@model/game-sessions';

interface GameSessionCardProps {
	session: WorldPrimer;
	onPlay: (sessionId: string) => void;
}

const GameSessionCard: React.FC<GameSessionCardProps> = ({ session, onPlay }) => {
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('ru-RU', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	};

	return (
		<Card
			sx={{
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
				'&:hover': {
					transform: 'translateY(-2px)',
					boxShadow: (theme) => theme.shadows[8],
				},
			}}
		>
			<CardContent sx={{ flexGrow: 1, pb: 1 }}>
				<Typography variant="h6" component="h3" gutterBottom noWrap>
					{session.name}
				</Typography>

				<Stack direction="row" spacing={1} sx={{ mb: 2 }}>
					<Chip label={session.genre} size="small" icon={<Public />} variant="outlined" color="primary" />
					<Chip label={session.tone} size="small" variant="outlined" color="secondary" />
				</Stack>

				<Typography
					variant="body2"
					color="text.secondary"
					sx={{
						display: '-webkit-box',
						WebkitLineClamp: 3,
						WebkitBoxOrient: 'vertical',
						overflow: 'hidden',
						minHeight: '3.6em',
						mb: 2,
					}}
				>
					{session.world_primer}
				</Typography>

				<Box display="flex" alignItems="center" gap={1} sx={{ mt: 'auto' }}>
					<Schedule fontSize="small" color="disabled" />
					<Typography variant="caption" color="text.secondary">
						Создано: {formatDate(session.createdAt)}
					</Typography>
				</Box>
			</CardContent>

			<CardActions sx={{ pt: 0 }}>
				<Button fullWidth variant="contained" startIcon={<PlayArrow />} onClick={() => onPlay(session.id)} size="small">
					Играть
				</Button>
			</CardActions>
		</Card>
	);
};

export interface GameSessionsGridProps {
	onPlaySession?: (sessionId: string) => void;
}

export const GameSessionsGrid: React.FC<GameSessionsGridProps> = ({ onPlaySession = () => {} }) => {
	const sessions = useStore($gameSessions);

	if (!sessions || sessions.length === 0) {
		return (
			<Box textAlign="center" py={4}>
				<Typography variant="h6" color="text.secondary" gutterBottom>
					У вас пока нет сохранённых игр
				</Typography>
				<Typography variant="body2" color="text.secondary">
					Создайте новый мир, чтобы начать своё первое приключение
				</Typography>
			</Box>
		);
	}

	return (
		<Box>
			<Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
				Ваши миры ({sessions.length})
			</Typography>

			<Grid container spacing={3}>
				{sessions.map((session) => (
					<Grid item xs={12} sm={6} md={4} key={session.id}>
						<GameSessionCard session={session} onPlay={onPlaySession} />
					</Grid>
				))}
			</Grid>
		</Box>
	);
};
