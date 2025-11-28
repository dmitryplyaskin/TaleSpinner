import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { ChatHeaderProps } from '../types';

export const ChatHeader: React.FC<ChatHeaderProps> = ({
	title = 'Интерактивный Чат',
	subtitle = 'Общайтесь с ИИ-мастером и создавайте увлекательные истории',
	onBack,
}) => {
	return (
		<Box 
			sx={{ 
				position: 'relative', 
				mb: 2, 
				pt: 1,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between'
			}}
		>
			{/* Кнопка "Назад" / "Выход" */}
			<Box>
				{onBack && (
					<Button
						onClick={onBack}
						variant="outlined"
						size="small"
						sx={{
							borderColor: 'rgba(255, 255, 255, 0.2)',
							color: 'text.secondary',
							'&:hover': {
								borderColor: 'primary.main',
								color: 'primary.main',
								background: 'rgba(212, 175, 55, 0.05)',
							},
						}}
					>
						Выйти
					</Button>
				)}
			</Box>

			<Box sx={{ textAlign: 'center', flex: 1 }}>
				<Typography 
					variant="h5" 
					component="h1" 
					sx={{ 
						fontWeight: 600,
						color: 'text.primary',
						textShadow: '0 0 20px rgba(212, 175, 55, 0.2)'
					}}
				>
					{title}
				</Typography>
				{subtitle && (
					<Typography variant="caption" color="text.secondary">
						{subtitle}
					</Typography>
				)}
			</Box>
		</Box>
	);
};
