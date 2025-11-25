import React from 'react';
import { Box, Typography } from '@mui/material';
import { UseFormReturn } from 'react-hook-form';
import { AppSettings } from '../../../../shared/types/settings';
import { FormSelect } from '../../ui/form-components';

interface InterfaceSettingsSectionProps {
	form: UseFormReturn<AppSettings>;
}

const llmLanguageOptions = [
	{ value: 'ru', label: 'Русский' },
	{ value: 'en', label: 'English' },
];

export const InterfaceSettingsSection: React.FC<InterfaceSettingsSectionProps> = ({ form }) => {
	const { control } = form;

	return (
		<Box display="flex" flexDirection="column" gap={3}>
			<Typography variant="h6" component="h3">
				Язык генерации контента
			</Typography>

			<Typography variant="body2" color="text.secondary">
				Выберите язык, на котором LLM будет генерировать контент для вас (описания миров, персонажей, диалоги и
				т.д.)
			</Typography>

			<FormSelect
				form={{
					name: 'llmOutputLanguage',
					control,
				}}
				options={llmLanguageOptions}
				label="Язык вывода LLM"
			/>
		</Box>
	);
};




