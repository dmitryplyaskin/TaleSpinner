import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { ChatHeaderProps } from '../types';

export const ChatHeader: React.FC<ChatHeaderProps> = ({
	title = 'Интерактивный Чат',
	subtitle = 'Общайтесь с ИИ-мастером и создавайте увлекательные истории',
	onBack,
}) => {
	return (
		<Box sx={{ position: 'relative', mb: 3, pt: 2 }}>
			{/* Кнопка "Назад" в левом верхнем углу */}
			{onBack && (
				<Button
					startIcon={<ArrowBack />}
					onClick={onBack}
					variant="outlined"
					sx={{
						position: 'absolute',
						top: 0,
						left: 0,
						zIndex: 10,
					}}
				>
					Назад
				</Button>
			)}

			{/* Центрированный заголовок */}
			<Box textAlign="center">
				<Typography variant="h4" component="h1" gutterBottom>
					{title}
				</Typography>
				{subtitle && (
					<Typography variant="body1" color="text.secondary">
						{subtitle}
					</Typography>
				)}
			</Box>
		</Box>
	);
};
