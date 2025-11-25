import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { UseFormReturn } from 'react-hook-form';
import { AppSettings, ApiProvider } from '../../../../shared/types/settings';
import { FormSelect } from '../../ui/form-components';
import { TokenManager } from './token-manager';
import { ModelSelect } from './model-select';
import { ProviderOrderSelect } from './provider-order-select';

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

			<Divider />

			{/* Управление токенами */}
			<TokenManager />

			<Divider />

			{/* Выбор основной модели */}
			<ModelSelect
				control={control}
				name="api.model"
				label="Основная модель"
				helperText="Модель, которая будет использоваться по умолчанию"
			/>

			{/* Порядок провайдеров */}
			<ProviderOrderSelect control={control} name="api.providerOrder" />
		</Box>
	);
};
