import React from 'react';
import { Box, Paper, Avatar, Typography, Chip } from '@mui/material';
import { AutoAwesome, Person, SmartToy } from '@mui/icons-material';
import { MessageBubbleProps } from '../types';

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
	const isUser = message.type === 'user';
	const isSystem = message.type === 'system';

	const getMessageColor = () => {
		if (isSystem) return 'rgba(212, 175, 55, 0.1)';
		if (isUser) return 'rgba(100, 150, 200, 0.15)';
		return 'rgba(212, 175, 55, 0.08)';
	};

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
			}}
		>
			{!isSystem && <Avatar sx={{ bgcolor: getAvatarColor(), width: 40, height: 40 }}>{getAvatarIcon()}</Avatar>}

			<Box sx={{ maxWidth: isSystem ? '90%' : '70%', width: 'fit-content' }}>
				{!isSystem && (
					<Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
						<Typography variant="subtitle2" color="text.secondary">
							{message.username}
						</Typography>
						<Typography variant="caption" color="text.disabled">
							{message.timestamp.toLocaleTimeString('ru-RU', {
								hour: '2-digit',
								minute: '2-digit',
							})}
						</Typography>
					</Box>
				)}

				<Paper
					elevation={1}
					sx={{
						p: 2,
						backgroundColor: getMessageColor(),
						border: `1px solid ${isSystem ? 'rgba(212, 175, 55, 0.3)' : 'rgba(212, 175, 55, 0.1)'}`,
						borderRadius: 2,
						position: 'relative',
						...(isSystem && {
							textAlign: 'center',
							background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%)',
						}),
					}}
				>
					{isSystem && (
						<Chip
							label="Системное сообщение"
							size="small"
							sx={{
								position: 'absolute',
								top: -8,
								left: '50%',
								transform: 'translateX(-50%)',
								fontSize: '0.7rem',
							}}
						/>
					)}

					<Typography
						variant="body1"
						sx={{
							whiteSpace: 'pre-wrap',
							wordBreak: 'break-word',
							...(isSystem && {
								fontStyle: 'italic',
								fontSize: '0.9rem',
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
