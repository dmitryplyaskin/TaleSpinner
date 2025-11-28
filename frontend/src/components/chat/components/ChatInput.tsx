import React from 'react';
import { Box, TextField, IconButton, Typography, InputAdornment } from '@mui/material';
import { Send } from '@mui/icons-material';
import { ChatInputProps } from '../types';

export const ChatInput: React.FC<ChatInputProps> = ({
	value,
	onChange,
	onSend,
	disabled = false,
	placeholder = 'Введите ваше сообщение... (Enter для отправки, Shift+Enter для новой строки)',
}) => {
	const handleKeyPress = (event: React.KeyboardEvent) => {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			onSend();
		}
	};

	return (
		<Box>
			<Box 
				sx={{ 
					display: 'flex', 
					gap: 2, 
					alignItems: 'flex-end',
					position: 'relative',
				}}
			>
				<TextField
					fullWidth
					multiline
					maxRows={4}
					placeholder={placeholder}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					onKeyPress={handleKeyPress}
					variant="outlined"
					disabled={disabled}
					InputProps={{
						endAdornment: (
							<InputAdornment position="end">
								<IconButton 
									onClick={onSend} 
									disabled={!value.trim() || disabled} 
									sx={{
										color: value.trim() ? 'primary.main' : 'text.disabled',
										transition: 'all 0.3s ease',
										'&:hover': {
											background: 'rgba(212, 175, 55, 0.1)',
											transform: 'scale(1.1)',
										}
									}}
								>
									<Send />
								</IconButton>
							</InputAdornment>
						),
						sx: {
							borderRadius: '16px',
							backgroundColor: 'rgba(255, 255, 255, 0.03)',
							backdropFilter: 'blur(10px)',
							border: '1px solid rgba(255, 255, 255, 0.1)',
							color: 'text.primary',
							transition: 'all 0.3s ease',
							'&:hover': {
								backgroundColor: 'rgba(255, 255, 255, 0.05)',
								borderColor: 'rgba(212, 175, 55, 0.3)',
							},
							'&.Mui-focused': {
								backgroundColor: 'rgba(255, 255, 255, 0.08)',
								borderColor: 'primary.main',
								boxShadow: '0 0 15px rgba(212, 175, 55, 0.1)',
							}
						}
					}}
					sx={{
						'& .MuiOutlinedInput-root': {
							paddingRight: 1,
						},
						'& .MuiOutlinedInput-notchedOutline': {
							border: 'none',
						}
					}}
				/>
			</Box>

			<Typography variant="caption" color="text.disabled" textAlign="center" sx={{ mt: 1, display: 'block', opacity: 0.6 }}>
				Нажмите Enter для отправки сообщения, Shift+Enter для новой строки
			</Typography>
		</Box>
	);
};
