import React from 'react';
import { Box, Paper, Avatar, Typography } from '@mui/material';
import { SmartToy } from '@mui/icons-material';
import { TypingIndicatorProps } from '../types';

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ username = 'ИИ Мастер', avatar }) => {
	return (
		<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
			<Avatar sx={{ bgcolor: '#d4af37', width: 40, height: 40 }}>{avatar || <SmartToy />}</Avatar>
			<Box>
				<Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
					{username} печатает...
				</Typography>
				<Paper
					elevation={1}
					sx={{
						p: 2,
						backgroundColor: 'rgba(212, 175, 55, 0.08)',
						border: '1px solid rgba(212, 175, 55, 0.1)',
						borderRadius: 2,
					}}
				>
					<Typography variant="body1" color="text.secondary">
						●●●
					</Typography>
				</Paper>
			</Box>
		</Box>
	);
};
