import React from 'react';
import { Box, Typography } from '@mui/material';
import { UseFormReturn } from 'react-hook-form';
import { AppSettings } from '../../../../shared/types/settings';
import { FormCheckbox } from '../../ui/form-components';
import { ModelSelect } from './model-select';

interface SettingsGroupProps {
	title: string;
	settingKey: 'rag' | 'embedding' | 'responseGeneration';
	form: UseFormReturn<AppSettings>;
}

export const SettingsGroup: React.FC<SettingsGroupProps> = ({ title, settingKey, form }) => {
	const { control, watch } = form;

	// Следим за состоянием чекбокса "Включить"
	const isEnabled = watch(`${settingKey}.enabled`);

	return (
		<Box display="flex" flexDirection="column" gap={2}>
			<Typography variant="h6" component="h3">
				{title}
			</Typography>

			<FormCheckbox
				form={{
					name: `${settingKey}.enabled`,
					control,
				}}
				label="Включить"
			/>

			{isEnabled && (
				<ModelSelect
					control={control}
					name={`${settingKey}.model`}
					label="Модель"
					helperText={
						settingKey === 'embedding'
							? 'Выберите модель для эмбеддингов'
							: undefined
					}
				/>
			)}
		</Box>
	);
};
