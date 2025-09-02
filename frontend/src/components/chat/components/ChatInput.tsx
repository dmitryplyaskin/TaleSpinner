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
			<Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
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
								<IconButton color="primary" onClick={onSend} disabled={!value.trim() || disabled} size="large">
									<Send />
								</IconButton>
							</InputAdornment>
						),
					}}
					sx={{
						'& .MuiOutlinedInput-root': {
							paddingRight: 1,
						},
					}}
				/>
			</Box>

			<Typography variant="caption" color="text.disabled" textAlign="center" sx={{ mt: 1, display: 'block' }}>
				Нажмите Enter для отправки сообщения, Shift+Enter для новой строки
			</Typography>
		</Box>
	);
};
