import React, { useState } from 'react';
import { useUnit } from 'effector-react';
import { Box, Button, Typography, keyframes } from '@mui/material';
import {
	Explore,
	Search,
	TheaterComedy,
	LocalFireDepartment,
	Nightlight,
	Favorite,
} from '@mui/icons-material';
import { useTranslation } from '@hooks/useTranslation';
import { $setting, $isStartingSession, setSetting, startSessionFx } from '../../model';
import { GenreCard } from './genre-card';
import { GenreOption, GenreId } from './types';

const shimmer = keyframes`
	0% { background-position: -200% 0; }
	100% { background-position: 200% 0; }
`;

const genreOptions: GenreOption[] = [
	{
		id: 'adventure',
		icon: <Explore sx={{ fontSize: 40 }} />,
		gradient: 'linear-gradient(145deg, rgba(76, 175, 80, 0.25) 0%, rgba(212, 175, 55, 0.15) 100%)',
		accentColor: '#4caf50',
		iconBg: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
	},
	{
		id: 'mystery',
		icon: <Search sx={{ fontSize: 40 }} />,
		gradient: 'linear-gradient(145deg, rgba(63, 81, 181, 0.25) 0%, rgba(139, 71, 137, 0.15) 100%)',
		accentColor: '#5c6bc0',
		iconBg: 'linear-gradient(135deg, #5c6bc0 0%, #3949ab 100%)',
	},
	{
		id: 'drama',
		icon: <TheaterComedy sx={{ fontSize: 40 }} />,
		gradient: 'linear-gradient(145deg, rgba(156, 39, 176, 0.25) 0%, rgba(233, 30, 99, 0.15) 100%)',
		accentColor: '#ab47bc',
		iconBg: 'linear-gradient(135deg, #ab47bc 0%, #8e24aa 100%)',
	},
	{
		id: 'action',
		icon: <LocalFireDepartment sx={{ fontSize: 40 }} />,
		gradient: 'linear-gradient(145deg, rgba(255, 87, 34, 0.25) 0%, rgba(255, 152, 0, 0.15) 100%)',
		accentColor: '#ff5722',
		iconBg: 'linear-gradient(135deg, #ff5722 0%, #e64a19 100%)',
	},
	{
		id: 'horror',
		icon: <Nightlight sx={{ fontSize: 40 }} />,
		gradient: 'linear-gradient(145deg, rgba(198, 40, 40, 0.2) 0%, rgba(26, 22, 24, 0.4) 100%)',
		accentColor: '#c62828',
		iconBg: 'linear-gradient(135deg, #c62828 0%, #4a0000 100%)',
	},
	{
		id: 'romance',
		icon: <Favorite sx={{ fontSize: 40 }} />,
		gradient: 'linear-gradient(145deg, rgba(233, 30, 99, 0.25) 0%, rgba(244, 143, 177, 0.15) 100%)',
		accentColor: '#ec407a',
		iconBg: 'linear-gradient(135deg, #ec407a 0%, #d81b60 100%)',
	},
];

export const GenreSelection: React.FC = () => {
	const [hoveredCard, setHoveredCard] = useState<GenreId | null>(null);
	const { t } = useTranslation('worldCreation');

	const setting = useUnit($setting);
	const isLoading = useUnit($isStartingSession);
	const handleSetSetting = useUnit(setSetting);
	const handleStartSession = useUnit(startSessionFx);

	const handleNext = () => {
		handleStartSession({ setting });
	};

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, position: 'relative' }}>
			{/* Заголовок */}
			<Box sx={{ textAlign: 'center', mb: 1 }}>
				<Typography
					variant="h4"
					gutterBottom
					sx={{
						fontWeight: 700,
						background: 'linear-gradient(135deg, #f4e8d0 0%, #d4af37 50%, #f4e8d0 100%)',
						backgroundSize: '200% auto',
						backgroundClip: 'text',
						WebkitBackgroundClip: 'text',
						WebkitTextFillColor: 'transparent',
						animation: `${shimmer} 4s linear infinite`,
					}}
				>
					{t('genreSelection.title')}
				</Typography>
				<Typography
					variant="body1"
					sx={{
						color: 'text.secondary',
						maxWidth: 500,
						mx: 'auto',
					}}
				>
					{t('genreSelection.subtitle')}
				</Typography>
			</Box>

			{/* Сетка карточек */}
			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: {
						xs: '1fr',
						sm: 'repeat(2, 1fr)',
						md: 'repeat(3, 1fr)',
					},
					gap: 3,
				}}
			>
				{genreOptions.map((option) => {
					const isSelected = setting === option.id;
					const isHovered = hoveredCard === option.id;

					return (
						<GenreCard
							key={option.id}
							option={option}
							title={t(`genreSelection.genres.${option.id}.title`)}
							description={t(`genreSelection.genres.${option.id}.description`)}
							isSelected={isSelected}
							isHovered={isHovered}
							isDisabled={isLoading}
							onSelect={() => handleSetSetting(option.id)}
							onMouseEnter={() => setHoveredCard(option.id)}
							onMouseLeave={() => setHoveredCard(null)}
						/>
					);
				})}
			</Box>

			{/* Кнопка продолжить */}
			<Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
				<Button
					variant="contained"
					onClick={handleNext}
					size="large"
					disabled={isLoading || !setting}
					sx={{
						minWidth: 220,
						py: 1.75,
						px: 5,
						fontSize: '1rem',
						fontWeight: 600,
						borderRadius: 2,
						textTransform: 'uppercase',
						letterSpacing: '0.1em',
						background: 'linear-gradient(135deg, #d4af37 0%, #b89730 100%)',
						boxShadow: '0 4px 20px rgba(212, 175, 55, 0.3)',
						transition: 'all 0.3s ease',
						'&:hover': {
							background: 'linear-gradient(135deg, #e6c757 0%, #d4af37 100%)',
							boxShadow: '0 6px 28px rgba(212, 175, 55, 0.4)',
							transform: 'translateY(-2px)',
						},
						'&:active': {
							transform: 'translateY(0)',
						},
						'&:disabled': {
							background: 'rgba(212, 175, 55, 0.3)',
							boxShadow: 'none',
						},
					}}
				>
					{isLoading ? t('genreSelection.loading') : t('genreSelection.continue')}
				</Button>
			</Box>
		</Box>
	);
};

