import React from 'react';
import {
	Box,
	Typography,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	TextField,
	IconButton,
	Tooltip,
} from '@mui/material';
import { Info } from '@mui/icons-material';
import { useStore } from 'effector-react';
import { $settings, updateApiToken, updateApiModel } from '../../model/settings';
import { ApiProvider } from '../../../../shared/types/settings';

export const ApiSettingsSection: React.FC = () => {
	const settings = useStore($settings);

	const handleTokenChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		updateApiToken(event.target.value);
	};

	const handleModelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		updateApiModel(event.target.value);
	};

	return (
		<Box display="flex" flexDirection="column" gap={2}>
			<Typography variant="h6" component="h3">
				Настройки API
			</Typography>

			<FormControl fullWidth>
				<InputLabel>Провайдер API</InputLabel>
				<Select value={settings.api.provider} label="Провайдер API" disabled>
					<MenuItem value={ApiProvider.OPEN_ROUTER}>OpenRouter</MenuItem>
				</Select>
			</FormControl>

			<TextField
				label="API Токен"
				type="password"
				value={settings.api.token}
				onChange={handleTokenChange}
				fullWidth
				placeholder="Введите ваш API токен"
			/>

			<Box display="flex" alignItems="center" gap={1}>
				<TextField
					label="Модель"
					value={settings.api.model}
					onChange={handleModelChange}
					fullWidth
					placeholder="Пока не выбрано"
					disabled
				/>
				<Tooltip title="Здесь будет информация о выборе модели">
					<IconButton>
						<Info />
					</IconButton>
				</Tooltip>
			</Box>
		</Box>
	);
};
