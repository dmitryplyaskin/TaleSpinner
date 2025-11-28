import React from 'react';
import { Box, Paper, Avatar, Typography, Chip } from '@mui/material';
import { AutoAwesome, Person, SmartToy } from '@mui/icons-material';
import { MessageBubbleProps } from '../types';

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
	const isUser = message.type === 'user';
	const isSystem = message.type === 'system';

	const getAvatarIcon = () => {
		if (isSystem) return <AutoAwesome />;
		if (isUser) return <Person />;
		return <SmartToy />;
	};

	const getAvatarColor = () => {
		if (isSystem) return '#d4af37';
		if (isUser) return '#6496c8';
		return '#d4af37';
	};

	return (
		<Box
			sx={{
				display: 'flex',
				alignItems: 'flex-start',
				gap: 2,
				mb: 3,
				justifyContent: isSystem ? 'center' : 'flex-start',
				px: 2,
			}}
		>
			{!isSystem && <Avatar sx={{ bgcolor: getAvatarColor(), width: 36, height: 36, boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>{getAvatarIcon()}</Avatar>}

			<Box sx={{ maxWidth: isSystem ? '90%' : '75%', width: 'fit-content' }}>
				{!isSystem && (
					<Box sx={{ mb: 0.5, display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
						<Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 600, fontSize: '0.85rem' }}>
							{message.username}
						</Typography>
						<Typography variant="caption" sx={{ color: 'text.secondary', opacity: 0.7 }}>
							{message.timestamp.toLocaleTimeString('ru-RU', {
								hour: '2-digit',
								minute: '2-digit',
							})}
						</Typography>
					</Box>
				)}

				<Paper
					elevation={0}
					className={isSystem ? 'glass-card-light' : 'glass-card'}
					sx={{
						p: 2,
						backgroundColor: isUser ? 'rgba(212, 175, 55, 0.1)' : 'rgba(255, 255, 255, 0.03)',
						border: isUser ? '1px solid rgba(212, 175, 55, 0.2)' : '1px solid rgba(255, 255, 255, 0.1)',
						borderRadius: isUser ? '4px 16px 16px 16px' : '16px 16px 16px 4px',
						position: 'relative',
						...(isSystem && {
							textAlign: 'center',
							background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%)',
							borderRadius: '16px',
						}),
					}}
				>
					{isSystem && (
						<Chip
							label="Системное сообщение"
							size="small"
							sx={{
								position: 'absolute',
								top: -10,
								left: '50%',
								transform: 'translateX(-50%)',
								fontSize: '0.7rem',
								backgroundColor: 'rgba(10, 10, 10, 0.8)',
								border: '1px solid rgba(212, 175, 55, 0.3)',
								color: '#d4af37',
							}}
						/>
					)}

					<Typography
						variant="body1"
						sx={{
							whiteSpace: 'pre-wrap',
							wordBreak: 'break-word',
							lineHeight: 1.6,
							color: 'text.primary',
							...(isSystem && {
								fontStyle: 'italic',
								fontSize: '0.9rem',
								color: 'text.secondary',
							}),
						}}
					>
						{message.content}
					</Typography>
				</Paper>
			</Box>
		</Box>
	);
};
