import React, { useState } from 'react';
import { useUnit } from 'effector-react';
import { Box, Button, Typography, Chip, alpha, keyframes } from '@mui/material';
import {
	AutoAwesome,
	Castle,
	RocketLaunch,
	Nightlight,
	Settings as GearIcon,
	Public,
	CheckCircle,
} from '@mui/icons-material';
import { $setting, $isStartingSession, setSetting, startSessionFx } from '../../../../model/agent-wizard';

// Анимации
const shimmer = keyframes`
	0% { background-position: -200% 0; }
	100% { background-position: 200% 0; }
`;

const float = keyframes`
	0%, 100% { transform: translateY(0px); }
	50% { transform: translateY(-8px); }
`;

const pulse = keyframes`
	0%, 100% { opacity: 0.4; transform: scale(1); }
	50% { opacity: 0.7; transform: scale(1.05); }
`;

const glow = keyframes`
	0%, 100% { box-shadow: 0 0 20px rgba(212, 175, 55, 0.3); }
	50% { box-shadow: 0 0 40px rgba(212, 175, 55, 0.5); }
`;

interface SettingOption {
	id: string;
	title: string;
	description: string;
	icon: React.ReactNode;
	tags: string[];
	gradient: string;
	accentColor: string;
	bgPattern: string;
	iconBg: string;
}

const settingOptions: SettingOption[] = [
	{
		id: 'fantasy',
		title: 'Фэнтези',
		description: 'Магия, драконы и средневековые приключения в мирах полных чудес',
		icon: <Castle sx={{ fontSize: 40 }} />,
		tags: ['Магия', 'Эпос', 'Приключения'],
		gradient: 'linear-gradient(145deg, rgba(139, 71, 137, 0.25) 0%, rgba(212, 175, 55, 0.15) 100%)',
		accentColor: '#d4af37',
		bgPattern:
			'radial-gradient(circle at 20% 80%, rgba(139, 71, 137, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(212, 175, 55, 0.1) 0%, transparent 40%)',
		iconBg: 'linear-gradient(135deg, #d4af37 0%, #8b4789 100%)',
	},
	{
		id: 'sci-fi',
		title: 'Научная фантастика',
		description: 'Космические путешествия, высокие технологии и исследование галактик',
		icon: <RocketLaunch sx={{ fontSize: 40 }} />,
		tags: ['Космос', 'Технологии', 'Будущее'],
		gradient: 'linear-gradient(145deg, rgba(74, 144, 164, 0.25) 0%, rgba(139, 71, 137, 0.15) 100%)',
		accentColor: '#4a90a4',
		bgPattern:
			'radial-gradient(circle at 70% 30%, rgba(74, 144, 164, 0.15) 0%, transparent 50%), radial-gradient(circle at 30% 70%, rgba(139, 71, 137, 0.1) 0%, transparent 40%)',
		iconBg: 'linear-gradient(135deg, #4a90a4 0%, #8b4789 100%)',
	},
	{
		id: 'horror',
		title: 'Хоррор',
		description: 'Тёмные тайны, сверхъестественные угрозы и борьба за выживание',
		icon: <Nightlight sx={{ fontSize: 40 }} />,
		tags: ['Ужасы', 'Тайны', 'Выживание'],
		gradient: 'linear-gradient(145deg, rgba(198, 40, 40, 0.2) 0%, rgba(26, 22, 24, 0.4) 100%)',
		accentColor: '#c62828',
		bgPattern:
			'radial-gradient(circle at 50% 50%, rgba(198, 40, 40, 0.1) 0%, transparent 60%), radial-gradient(circle at 90% 90%, rgba(0, 0, 0, 0.3) 0%, transparent 40%)',
		iconBg: 'linear-gradient(135deg, #c62828 0%, #4a0000 100%)',
	},
	{
		id: 'steampunk',
		title: 'Стимпанк',
		description: 'Паровые машины, викторианская эстетика и альтернативная история',
		icon: <GearIcon sx={{ fontSize: 40 }} />,
		tags: ['Пар', 'Механизмы', 'Викториана'],
		gradient: 'linear-gradient(145deg, rgba(212, 175, 55, 0.25) 0%, rgba(184, 151, 48, 0.15) 100%)',
		accentColor: '#b89730',
		bgPattern:
			'radial-gradient(circle at 25% 25%, rgba(212, 175, 55, 0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(139, 90, 43, 0.1) 0%, transparent 40%)',
		iconBg: 'linear-gradient(135deg, #d4af37 0%, #8b5a2b 100%)',
	},
	{
		id: 'post-apocalyptic',
		title: 'Постапокалипсис',
		description: 'Выживание в разрушенном мире после глобальной катастрофы',
		icon: <Public sx={{ fontSize: 40 }} />,
		tags: ['Выживание', 'Руины', 'Новый мир'],
		gradient: 'linear-gradient(145deg, rgba(74, 124, 89, 0.2) 0%, rgba(122, 111, 96, 0.2) 100%)',
		accentColor: '#4a7c59',
		bgPattern:
			'radial-gradient(circle at 60% 40%, rgba(74, 124, 89, 0.12) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(122, 111, 96, 0.1) 0%, transparent 40%)',
		iconBg: 'linear-gradient(135deg, #4a7c59 0%, #5c5346 100%)',
	},
	{
		id: 'custom',
		title: 'Своя вселенная',
		description: 'Создайте уникальный мир по собственным правилам и идеям',
		icon: <AutoAwesome sx={{ fontSize: 40 }} />,
		tags: ['Свобода', 'Уникальность', 'Творчество'],
		gradient:
			'linear-gradient(145deg, rgba(212, 175, 55, 0.15) 0%, rgba(139, 71, 137, 0.15) 50%, rgba(74, 144, 164, 0.15) 100%)',
		accentColor: '#d4af37',
		bgPattern:
			'radial-gradient(circle at 30% 30%, rgba(212, 175, 55, 0.1) 0%, transparent 40%), radial-gradient(circle at 70% 70%, rgba(139, 71, 137, 0.1) 0%, transparent 40%), radial-gradient(circle at 50% 50%, rgba(74, 144, 164, 0.08) 0%, transparent 50%)',
		iconBg: 'linear-gradient(135deg, #d4af37 0%, #8b4789 50%, #4a90a4 100%)',
	},
];

export const SettingSelection: React.FC = () => {
	const [hoveredCard, setHoveredCard] = useState<string | null>(null);

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
					Выберите сеттинг мира
				</Typography>
				<Typography
					variant="body1"
					sx={{
						color: 'text.secondary',
						maxWidth: 500,
						mx: 'auto',
					}}
				>
					Выберите базовый жанр для вашего мира. Это определит стиль и атмосферу приключений.
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
				{settingOptions.map((option, index) => {
					const isSelected = setting === option.id;
					const isHovered = hoveredCard === option.id;

					return (
						<Box
							key={option.id}
							onClick={() => !isLoading && handleSetSetting(option.id)}
							onMouseEnter={() => setHoveredCard(option.id)}
							onMouseLeave={() => setHoveredCard(null)}
							sx={{
								position: 'relative',
								borderRadius: 3,
								cursor: isLoading ? 'not-allowed' : 'pointer',
								overflow: 'hidden',
								opacity: isLoading ? 0.6 : 1,
								transform: isSelected ? 'scale(1.02)' : isHovered ? 'scale(1.01)' : 'scale(1)',
								transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
								animation: isSelected ? `${glow} 2s ease-in-out infinite` : 'none',
								animationDelay: `${index * 0.1}s`,

								// Основной контейнер
								'&::before': {
									content: '""',
									position: 'absolute',
									inset: 0,
									borderRadius: 'inherit',
									padding: isSelected ? '2px' : '1px',
									background: isSelected
										? `linear-gradient(135deg, ${option.accentColor} 0%, ${alpha(option.accentColor, 0.5)} 100%)`
										: `linear-gradient(135deg, ${alpha(option.accentColor, 0.3)} 0%, transparent 50%)`,
									WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
									WebkitMaskComposite: 'xor',
									maskComposite: 'exclude',
									transition: 'all 0.3s ease',
								},

								'&:hover::before': {
									padding: '2px',
									background: `linear-gradient(135deg, ${option.accentColor} 0%, ${alpha(
										option.accentColor,
										0.6
									)} 100%)`,
								},
							}}
						>
							{/* Фоновый паттерн */}
							<Box
								sx={{
									position: 'absolute',
									inset: 0,
									background: option.bgPattern,
									opacity: isSelected ? 1 : isHovered ? 0.8 : 0.5,
									transition: 'opacity 0.4s ease',
									animation: isSelected ? `${pulse} 3s ease-in-out infinite` : 'none',
								}}
							/>

							{/* Контент карточки */}
							<Box
								sx={{
									position: 'relative',
									p: 3,
									background: isSelected ? option.gradient : alpha('#1a1618', 0.95),
									borderRadius: 3,
									minHeight: 220,
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									textAlign: 'center',
									gap: 2,
									transition: 'background 0.4s ease',
								}}
							>
								{/* Иконка */}
								<Box
									sx={{
										width: 72,
										height: 72,
										borderRadius: '50%',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										background: isSelected || isHovered ? option.iconBg : alpha(option.accentColor, 0.15),
										color: isSelected || isHovered ? '#fff' : option.accentColor,
										transition: 'all 0.4s ease',
										animation: isSelected ? `${float} 3s ease-in-out infinite` : 'none',
										boxShadow: isSelected
											? `0 8px 32px ${alpha(option.accentColor, 0.4)}`
											: isHovered
												? `0 4px 16px ${alpha(option.accentColor, 0.3)}`
												: 'none',
									}}
								>
									{option.icon}
								</Box>

								{/* Заголовок */}
								<Typography
									variant="h6"
									sx={{
										fontWeight: 700,
										color: isSelected ? option.accentColor : 'text.primary',
										transition: 'color 0.3s ease',
										letterSpacing: '0.02em',
									}}
								>
									{option.title}
								</Typography>

								{/* Описание */}
								<Typography
									variant="body2"
									sx={{
										color: 'text.secondary',
										lineHeight: 1.6,
										flex: 1,
									}}
								>
									{option.description}
								</Typography>

								{/* Теги */}
								<Box
									sx={{
										display: 'flex',
										gap: 0.75,
										flexWrap: 'wrap',
										justifyContent: 'center',
									}}
								>
									{option.tags.map((tag) => (
										<Chip
											key={tag}
											label={tag}
											size="small"
											sx={{
												fontSize: '0.7rem',
												height: 24,
												fontWeight: 500,
												border: '1px solid',
												borderColor: isSelected ? alpha(option.accentColor, 0.5) : 'divider',
												bgcolor: isSelected ? alpha(option.accentColor, 0.15) : 'transparent',
												color: isSelected ? option.accentColor : 'text.secondary',
												transition: 'all 0.3s ease',
												'&:hover': {
													bgcolor: alpha(option.accentColor, 0.1),
												},
											}}
										/>
									))}
								</Box>

								{/* Индикатор выбора */}
								{isSelected && (
									<Box
										sx={{
											position: 'absolute',
											top: 12,
											right: 12,
											animation: `${float} 2s ease-in-out infinite`,
										}}
									>
										<CheckCircle
											sx={{
												fontSize: 28,
												color: option.accentColor,
												filter: `drop-shadow(0 2px 8px ${alpha(option.accentColor, 0.5)})`,
											}}
										/>
									</Box>
								)}
							</Box>
						</Box>
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
					{isLoading ? 'Загрузка...' : 'Продолжить'}
				</Button>
			</Box>
		</Box>
	);
};
