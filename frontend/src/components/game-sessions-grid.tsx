import React, { useState } from 'react';
import {
	Box,
	Typography,
	Card,
	CardContent,
	CardActions,
	Button,
	Chip,
	Stack,
	IconButton,
	Tooltip,
} from '@mui/material';
import {
	PlayArrow,
	Schedule,
	Public,
	ExpandMore,
	ExpandLess,
	Delete,
	Star,
	StarBorder,
} from '@mui/icons-material';
import { SavedWorld } from '@shared/types/saved-world';
import { useStore } from 'effector-react';
import { $savedWorlds, deleteWorldFx, toggleFavoriteFx } from '@model/game-sessions';

interface WorldCardProps {
	world: SavedWorld;
	onPlay: (worldId: string) => void;
}

const WorldCard: React.FC<WorldCardProps> = ({ world, onPlay }) => {
	const [expanded, setExpanded] = useState(false);

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

	const handleExpandClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		setExpanded(!expanded);
	};

	// Сокращённое описание для превью
	const shortDescription = world.description.length > 200 
		? world.description.slice(0, 200) + '...' 
		: world.description;

	return (
		<Card
			sx={{
				width: '100%',
				display: 'flex',
				flexDirection: 'column',
				transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
				'&:hover': {
					transform: 'translateY(-2px)',
					boxShadow: (theme) => theme.shadows[8],
				},
			}}
		>
			<CardContent sx={{ pb: 1 }}>
				{/* Заголовок с названием и действиями */}
				<Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
					<Box sx={{ flex: 1, minWidth: 0 }}>
						<Typography
							variant="h5"
							component="h3"
							sx={{
								fontWeight: 600,
								mb: 1,
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap',
							}}
						>
							{world.name}
						</Typography>
						<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
							<Chip
								label={world.genre}
								size="small"
								icon={<Public sx={{ fontSize: '0.875rem' }} />}
								variant="outlined"
								color="primary"
							/>
							<Chip
								label={world.tone}
								size="small"
								variant="outlined"
								color="secondary"
							/>
						</Stack>
					</Box>
					<Box sx={{ display: 'flex', gap: 0.5, ml: 2 }}>
						<Tooltip title={world.is_favorite ? 'Убрать из избранного' : 'В избранное'}>
							<IconButton
								size="small"
								onClick={handleToggleFavorite}
								sx={{
									color: world.is_favorite ? 'warning.main' : 'text.disabled',
									'&:hover': { color: 'warning.main' },
								}}
							>
								{world.is_favorite ? <Star /> : <StarBorder />}
							</IconButton>
						</Tooltip>
						<Tooltip title="Удалить мир">
							<IconButton
								size="small"
								onClick={handleDelete}
								sx={{
									color: 'text.disabled',
									'&:hover': { color: 'error.main' },
								}}
							>
								<Delete />
							</IconButton>
						</Tooltip>
					</Box>
				</Box>

				{/* Описание */}
				<Box sx={{ mb: 2 }}>
					<Typography
						variant="body2"
						color="text.secondary"
						sx={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}
					>
						{expanded ? world.description : shortDescription}
					</Typography>
				</Box>

				{/* Кнопка раскрытия описания */}
				{world.description.length > 200 && (
					<Button
						size="small"
						onClick={handleExpandClick}
						endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
						sx={{ color: 'text.secondary', textTransform: 'none' }}
					>
						{expanded ? 'Свернуть' : 'Читать полностью'}
					</Button>
				)}

				{/* Дата создания */}
				<Box display="flex" alignItems="center" gap={1} sx={{ mt: 2 }}>
					<Schedule fontSize="small" color="disabled" />
					<Typography variant="caption" color="text.secondary">
						Создано: {formatDate(world.created_at)}
					</Typography>
				</Box>
			</CardContent>

			<CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
				<Button
					fullWidth
					variant="contained"
					size="large"
					startIcon={<PlayArrow />}
					onClick={() => onPlay(world.id)}
				>
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
			<Box
				sx={{
					textAlign: 'center',
					py: 6,
					px: 4,
					border: '2px dashed',
					borderColor: 'divider',
					borderRadius: 2,
				}}
			>
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

			<Stack spacing={3}>
				{displayedWorlds.map((world) => (
					<WorldCard key={world.id} world={world} onPlay={onPlaySession} />
				))}
			</Stack>

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
