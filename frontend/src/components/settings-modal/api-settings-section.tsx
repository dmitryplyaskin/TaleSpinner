import React from 'react';
import { Box, Typography, Tooltip, IconButton } from '@mui/material';
import { Info } from '@mui/icons-material';
import { UseFormReturn } from 'react-hook-form';
import { AppSettings, ApiProvider } from '../../../../shared/types/settings';
import { FormInput, FormSelect } from '../../ui/form-components';

interface ApiSettingsSectionProps {
	form: UseFormReturn<AppSettings>;
}

const providerOptions = [{ value: ApiProvider.OPEN_ROUTER, label: 'OpenRouter' }];

export const ApiSettingsSection: React.FC<ApiSettingsSectionProps> = ({ form }) => {
	const { control } = form;

	return (
		<Box display="flex" flexDirection="column" gap={3}>
			<Typography variant="h6" component="h3">
				Настройки API
			</Typography>

			<FormSelect
				form={{
					name: 'api.provider',
					control,
				}}
				options={providerOptions}
				label="Провайдер API"
				disabled
			/>

			<FormInput
				form={{
					name: 'api.token',
					control,
					rules: { required: 'API токен обязателен' },
				}}
				label="API Токен"
				type="password"
				fullWidth
				placeholder="Введите ваш API токен"
			/>

			<Box display="flex" alignItems="center" gap={1}>
				<FormInput
					form={{
						name: 'api.model',
						control,
					}}
					label="Модель"
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
