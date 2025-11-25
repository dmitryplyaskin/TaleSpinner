import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, CardActions, Button, Chip, Stack, IconButton } from '@mui/material';
import { PlayArrow, Schedule, Public, ExpandMore, ExpandLess, Delete, Star, StarBorder } from '@mui/icons-material';
import { SavedWorld } from '@shared/types/saved-world';
import { useStore } from 'effector-react';
import { $savedWorlds, deleteWorldFx, toggleFavoriteFx } from '@model/game-sessions';

interface WorldCardProps {
	world: SavedWorld;
	onPlay: (worldId: string) => void;
}

const WorldCard: React.FC<WorldCardProps> = ({ world, onPlay }) => {
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('ru-RU', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	};

	const handleDelete = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (window.confirm('Вы уверены, что хотите удалить этот мир?')) {
			deleteWorldFx(world.id);
		}
	};

	const handleToggleFavorite = (e: React.MouseEvent) => {
		e.stopPropagation();
		toggleFavoriteFx(world.id);
	};

	return (
		<Card
			sx={{
				width: 320,
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
				<Box display="flex" justifyContent="space-between" alignItems="flex-start">
					<Typography variant="h6" component="h3" gutterBottom noWrap sx={{ flex: 1 }}>
						{world.name}
					</Typography>
					<Box>
						<IconButton size="small" onClick={handleToggleFavorite} color={world.is_favorite ? 'warning' : 'default'}>
							{world.is_favorite ? <Star /> : <StarBorder />}
						</IconButton>
						<IconButton size="small" onClick={handleDelete} color="error">
							<Delete />
						</IconButton>
					</Box>
				</Box>

				<Stack direction="row" spacing={1} sx={{ mb: 2 }}>
					<Chip label={world.genre} size="small" icon={<Public />} variant="outlined" color="primary" />
					<Chip label={world.tone} size="small" variant="outlined" color="secondary" />
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
					{world.description}
				</Typography>

				<Box display="flex" alignItems="center" gap={1} sx={{ mt: 'auto' }}>
					<Schedule fontSize="small" color="disabled" />
					<Typography variant="caption" color="text.secondary">
						Создано: {formatDate(world.created_at)}
					</Typography>
				</Box>
			</CardContent>

			<CardActions sx={{ pt: 0 }}>
				<Button fullWidth variant="contained" startIcon={<PlayArrow />} onClick={() => onPlay(world.id)} size="small">
					Играть
				</Button>
			</CardActions>
		</Card>
	);
};

export interface GameSessionsGridProps {
	onPlaySession?: (worldId: string) => void;
}

export const GameSessionsGrid: React.FC<GameSessionsGridProps> = ({ onPlaySession = () => {} }) => {
	const worlds = useStore($savedWorlds);
	const [showAll, setShowAll] = useState(false);

	if (!worlds || worlds.length === 0) {
		return (
			<Box textAlign="center" py={4}>
				<Typography variant="h6" color="text.secondary" gutterBottom>
					У вас пока нет сохранённых миров
				</Typography>
				<Typography variant="body2" color="text.secondary">
					Создайте новый мир, чтобы начать своё первое приключение
				</Typography>
			</Box>
		);
	}

	const INITIAL_DISPLAY_COUNT = 3;
	// Sort favorites first, then by date
	const sortedWorlds = [...worlds].sort((a, b) => {
		if (a.is_favorite && !b.is_favorite) return -1;
		if (!a.is_favorite && b.is_favorite) return 1;
		return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
	});
	const displayedWorlds = showAll ? sortedWorlds : sortedWorlds.slice(0, INITIAL_DISPLAY_COUNT);
	const hasMoreWorlds = worlds.length > INITIAL_DISPLAY_COUNT;

	return (
		<Box>
			<Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
				Ваши миры ({worlds.length})
			</Typography>

			<Box
				sx={{
					display: 'flex',
					flexWrap: 'wrap',
					gap: 3,
				}}
			>
				{displayedWorlds.map((world) => (
					<WorldCard key={world.id} world={world} onPlay={onPlaySession} />
				))}
			</Box>

			{hasMoreWorlds && (
				<Box display="flex" justifyContent="center" sx={{ mt: 3 }}>
					<Button
						variant="outlined"
						startIcon={showAll ? <ExpandLess /> : <ExpandMore />}
						onClick={() => setShowAll(!showAll)}
						sx={{ px: 4 }}
					>
						{showAll ? 'Скрыть' : `Показать все (${worlds.length - INITIAL_DISPLAY_COUNT} ещё)`}
					</Button>
				</Box>
			)}
		</Box>
	);
};
