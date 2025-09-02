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
		<Box display="flex" alignItems="center" mb={3}>
			{onBack && (
				<Button startIcon={<ArrowBack />} onClick={onBack} variant="outlined" sx={{ mr: 3 }}>
					Назад
				</Button>
			)}
			<Box textAlign="center" flexGrow={1}>
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
