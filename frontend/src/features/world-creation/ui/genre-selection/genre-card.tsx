import React from 'react';
import { Box, Typography, alpha } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { GenreOption } from './types';

interface GenreCardProps {
	option: GenreOption;
	title: string;
	description: string;
	isSelected: boolean;
	isHovered: boolean;
	isDisabled: boolean;
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
				p: 3,
				borderRadius: 3,
				cursor: isDisabled ? 'not-allowed' : 'pointer',
				opacity: isDisabled ? 0.6 : 1,
				minHeight: 200,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				textAlign: 'center',
				gap: 2,
				background: isSelected ? option.gradient : 'background.paper',
				border: '2px solid',
				borderColor: isSelected ? option.accentColor : isHovered ? alpha(option.accentColor, 0.5) : 'divider',
				transform: isSelected ? 'scale(1.02)' : 'scale(1)',
				boxShadow: isSelected ? `0 0 24px ${alpha(option.accentColor, 0.3)}` : 'none',
				transition: 'all 0.3s ease',
			}}
		>
			{/* Иконка */}
			<Box
				sx={{
					width: 64,
					height: 64,
					borderRadius: '50%',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					background: isSelected || isHovered ? option.iconBg : alpha(option.accentColor, 0.15),
					color: isSelected || isHovered ? '#fff' : option.accentColor,
					transition: 'all 0.3s ease',
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
				<CheckCircle
					sx={{
						position: 'absolute',
						top: 12,
						right: 12,
						fontSize: 24,
						color: option.accentColor,
					}}
				/>
			)}
		</Box>
	);
};
