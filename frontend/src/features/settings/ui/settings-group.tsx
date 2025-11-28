/**
 * Группа настроек модели (RAG, Embedding, Response Generation)
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import { UseFormReturn } from 'react-hook-form';
import type { AppSettings } from '../model';
import { FormCheckbox } from '@ui/form-components';
import { ModelSelect } from './model-select';

interface SettingsGroupProps {
	title: string;
	settingKey: 'rag' | 'embedding' | 'responseGeneration';
	form: UseFormReturn<AppSettings>;
}

export const SettingsGroup: React.FC<SettingsGroupProps> = ({ title, settingKey, form }) => {
	const { control, watch } = form;

	const isEnabled = watch(`${settingKey}.enabled`);

	return (
		<Box>
			<Typography variant="subtitle2" color="text.secondary" gutterBottom>
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
				<Box mt={1.5}>
					<ModelSelect
						control={control}
						name={`${settingKey}.model`}
						label="Модель"
					/>
				</Box>
			)}
		</Box>
	);
};



