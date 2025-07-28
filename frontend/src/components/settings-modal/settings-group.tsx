import React from 'react';
import { Box, Typography } from '@mui/material';
import { UseFormReturn } from 'react-hook-form';
import { AppSettings } from '../../../../shared/types/settings';
import { FormCheckbox, FormInput } from '../../ui/form-components';

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
				<FormInput
					form={{
						name: `${settingKey}.model`,
						control,
					}}
					label="Модель"
					fullWidth
					placeholder="Выберите модель"
					disabled
				/>
			)}
		</Box>
	);
};
