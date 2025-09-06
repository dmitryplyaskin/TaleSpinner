import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, CardActions, Button, Chip, Stack } from '@mui/material';
import { PlayArrow, Schedule, Public, ExpandMore, ExpandLess } from '@mui/icons-material';
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
	const [showAll, setShowAll] = useState(false);

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

	const INITIAL_DISPLAY_COUNT = 3;
	const displayedSessions = showAll ? sessions : sessions.slice(0, INITIAL_DISPLAY_COUNT);
	const hasMoreSessions = sessions.length > INITIAL_DISPLAY_COUNT;

	return (
		<Box>
			<Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
				Ваши миры ({sessions.length})
			</Typography>

			<Box
				sx={{
					display: 'flex',
					flexWrap: 'wrap',
					gap: 3,
				}}
			>
				{displayedSessions.map((session) => (
					<GameSessionCard key={session.id} session={session} onPlay={onPlaySession} />
				))}
			</Box>

			{hasMoreSessions && (
				<Box display="flex" justifyContent="center" sx={{ mt: 3 }}>
					<Button
						variant="outlined"
						startIcon={showAll ? <ExpandLess /> : <ExpandMore />}
						onClick={() => setShowAll(!showAll)}
						sx={{ px: 4 }}
					>
						{showAll ? 'Скрыть' : `Показать все (${sessions.length - INITIAL_DISPLAY_COUNT} ещё)`}
					</Button>
				</Box>
			)}
		</Box>
	);
};
