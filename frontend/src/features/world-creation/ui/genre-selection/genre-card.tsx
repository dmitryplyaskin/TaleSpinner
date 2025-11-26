import React from 'react';
import { Box, Typography, alpha, keyframes } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { GenreOption } from './types';

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

interface GenreCardProps {
	option: GenreOption;
	title: string;
	description: string;
	isSelected: boolean;
	isHovered: boolean;
	isDisabled: boolean;
	index: number;
	onSelect: () => void;
	onMouseEnter: () => void;
	onMouseLeave: () => void;
}

export const GenreCard: React.FC<GenreCardProps> = ({
	option,
	title,
	description,
	isSelected,
	isHovered,
	isDisabled,
	index,
	onSelect,
	onMouseEnter,
	onMouseLeave,
}) => {
	return (
		<Box
			onClick={() => !isDisabled && onSelect()}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
			sx={{
				position: 'relative',
				borderRadius: 3,
				cursor: isDisabled ? 'not-allowed' : 'pointer',
				overflow: 'hidden',
				opacity: isDisabled ? 0.6 : 1,
				transform: isSelected ? 'scale(1.02)' : isHovered ? 'scale(1.01)' : 'scale(1)',
				transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
				animation: isSelected ? `${glow} 2s ease-in-out infinite` : 'none',
				animationDelay: `${index * 0.1}s`,

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
					background: `linear-gradient(135deg, ${option.accentColor} 0%, ${alpha(option.accentColor, 0.6)} 100%)`,
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
					minHeight: 200,
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
					{title}
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
					{description}
				</Typography>

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
};

