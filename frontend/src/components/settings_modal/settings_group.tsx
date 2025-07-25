import React from 'react';
import { Box, Typography, FormControlLabel, Checkbox, TextField } from '@mui/material';
import { useStore } from 'effector-react';
import {
	$settings,
	toggleRagEnabled,
	updateRagModel,
	toggleEmbeddingEnabled,
	updateEmbeddingModel,
	toggleResponseGenerationEnabled,
	updateResponseGenerationModel,
} from '../../model/settings';

interface SettingsGroupProps {
	title: string;
	settingKey: 'rag' | 'embedding' | 'responseGeneration';
}

export const SettingsGroup: React.FC<SettingsGroupProps> = ({ title, settingKey }) => {
	const settings = useStore($settings);
	const currentSetting = settings[settingKey];

	const handleEnabledChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const enabled = event.target.checked;

		switch (settingKey) {
			case 'rag':
				toggleRagEnabled(enabled);
				break;
			case 'embedding':
				toggleEmbeddingEnabled(enabled);
				break;
			case 'responseGeneration':
				toggleResponseGenerationEnabled(enabled);
				break;
		}
	};

	const handleModelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const model = event.target.value;

		switch (settingKey) {
			case 'rag':
				updateRagModel(model);
				break;
			case 'embedding':
				updateEmbeddingModel(model);
				break;
			case 'responseGeneration':
				updateResponseGenerationModel(model);
				break;
		}
	};

	return (
		<Box display="flex" flexDirection="column" gap={2}>
			<Typography variant="h6" component="h3">
				{title}
			</Typography>

			<FormControlLabel
				control={<Checkbox checked={currentSetting.enabled} onChange={handleEnabledChange} />}
				label="Включить"
			/>

			{currentSetting.enabled && (
				<TextField
					label="Модель"
					value={currentSetting.model}
					onChange={handleModelChange}
					fullWidth
					placeholder="Выберите модель"
					disabled
				/>
			)}
		</Box>
	);
};
