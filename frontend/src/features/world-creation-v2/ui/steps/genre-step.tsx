import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, CircularProgress, Button } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import {
	Explore,
	Search,
	LocalCafe,
	Brightness2,
	Favorite,
	TheaterComedy,
	FlashOn,
	Warning,
	SentimentSatisfied,
	Security,
	AccountBalance,
	Key,
} from '@mui/icons-material';
import { useUnit } from 'effector-react';
import { GlassCard } from '../components';
import { selectGenre, submitGenreStep } from '../../model/events';
import { $genre, $isCreatingSession } from '../../model/stores';
import { fetchGenresFx } from '../../model/effects';
import type { Genre, GenreWithMetadata } from '../../model/types';

// Иконки для жанров
const GENRE_ICONS: Record<string, React.ReactNode> = {
	adventure: <Explore />,
	mystery: <Search />,
	slice_of_life: <LocalCafe />,
	horror: <Brightness2 />,
	romance: <Favorite />,
	drama: <TheaterComedy />,
	action: <FlashOn />,
	thriller: <Warning />,
	comedy: <SentimentSatisfied />,
	survival: <Security />,
	political_intrigue: <AccountBalance />,
	heist: <Key />,
};

/**
 * Шаг 1: Выбор жанра
 */
export const GenreStep: React.FC = () => {
	const [genres, setGenres] = useState<GenreWithMetadata[]>([]);
	const [isLoadingGenres, setIsLoadingGenres] = useState(true);
	const { selectedGenre, isCreating } = useUnit({
		selectedGenre: $genre,
		isCreating: $isCreatingSession,
	});
	const handleSelectGenre = useUnit(selectGenre);
	const handleSubmit = useUnit(submitGenreStep);

	useEffect(() => {
		// Загружаем жанры при монтировании
		fetchGenresFx()
			.then((result) => {
				setGenres(result.genres);
			})
			.catch(console.error)
			.finally(() => setIsLoadingGenres(false));
	}, []);

	if (isLoadingGenres) {
		return (
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					minHeight: 400,
				}}
			>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box>
			<Typography
				variant="h4"
				sx={{
					textAlign: 'center',
					mb: 2,
					fontWeight: 600,
				}}
			>
				Выберите жанр сюжета
			</Typography>

			<Typography
				variant="body1"
				sx={{
					textAlign: 'center',
					mb: 4,
					color: 'text.secondary',
					maxWidth: 600,
					mx: 'auto',
				}}
			>
				Жанр определяет тип истории, а не сеттинг мира. Вы можете создать повседневный сюжет в фэнтези таверне или
				хоррор на космическом корабле.
			</Typography>

			<Grid container spacing={2} sx={{ mb: 4 }}>
				{genres.map((genre) => (
					<Grid size={{ xs: 12, sm: 6, md: 4 }} key={genre.id}>
						<GlassCard
							variant={selectedGenre === genre.id ? 'elevated' : 'default'}
							onClick={() => !isCreating && handleSelectGenre(genre.id as Genre)}
							sx={{
								p: 3,
								height: '100%',
								display: 'flex',
								flexDirection: 'column',
								cursor: isCreating ? 'wait' : 'pointer',
								transition: 'all 0.3s ease',
								border:
									selectedGenre === genre.id
										? '2px solid rgba(233, 69, 96, 0.5)'
										: '1px solid rgba(255, 255, 255, 0.1)',
								'&:hover': {
									transform: 'translateY(-4px)',
									boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)',
								},
								opacity: isCreating ? 0.7 : 1,
								pointerEvents: isCreating ? 'none' : 'auto',
							}}
						>
							<Box
								sx={{
									display: 'flex',
									alignItems: 'center',
									gap: 2,
									mb: 1,
								}}
							>
								<Box
									sx={{
										width: 40,
										height: 40,
										borderRadius: 2,
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										background:
											selectedGenre === genre.id
												? 'linear-gradient(135deg, #e94560 0%, #c23a51 100%)'
												: 'rgba(255, 255, 255, 0.1)',
										color: selectedGenre === genre.id ? '#fff' : 'rgba(255, 255, 255, 0.7)',
										transition: 'all 0.3s ease',
									}}
								>
									{GENRE_ICONS[genre.id] || <Explore />}
								</Box>
								<Typography
									variant="h6"
									sx={{
										fontWeight: 600,
										color: 'text.primary',
									}}
								>
									{genre.label}
								</Typography>
							</Box>

							<Typography
								variant="body2"
								sx={{
									color: 'text.secondary',
									pl: 7,
									flex: 1,
								}}
							>
								{genre.description}
							</Typography>
						</GlassCard>
					</Grid>
				))}
			</Grid>

			<Box
				sx={{
					display: 'flex',
					justifyContent: 'center',
					gap: 2,
					alignItems: 'center',
				}}
			>
				{isCreating && (
					<>
						<CircularProgress size={24} />
						<Typography sx={{ color: 'text.secondary' }}>Создание сессии...</Typography>
					</>
				)}
				{!isCreating && (
					<Button
						variant="contained"
						size="large"
						onClick={handleSubmit}
						disabled={!selectedGenre}
						endIcon={<ArrowForward />}
						sx={{
							background: 'linear-gradient(135deg, #e94560 0%, #c23a51 100%)',
							px: 4,
							py: 1.5,
							'&:hover': {
								background: 'linear-gradient(135deg, #c23a51 0%, #a02040 100%)',
							},
							'&:disabled': {
								background: 'rgba(255, 255, 255, 0.1)',
								color: 'rgba(255, 255, 255, 0.3)',
							},
						}}
					>
						Продолжить
					</Button>
				)}
			</Box>
		</Box>
	);
};
