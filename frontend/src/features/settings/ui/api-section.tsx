/**
 * Секция настроек API
 */

import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { UseFormReturn } from 'react-hook-form';
import type { AppSettings } from '../model';
import { TokenList } from './token-list';
import { ModelSelect } from './model-select';
import { ProviderOrderSelect } from './provider-order-select';
import { SettingsGroup } from './settings-group';

interface ApiSectionProps {
	form: UseFormReturn<AppSettings>;
}

export const ApiSection: React.FC<ApiSectionProps> = ({ form }) => {
	const { control } = form;

	return (
		<Box display="flex" flexDirection="column" gap={2.5}>
			{/* Токены */}
			<TokenList />

			<Divider />

			{/* Основная модель */}
			<Box>
				<Typography variant="subtitle2" color="text.secondary" gutterBottom>
					Основная модель
				</Typography>
				<ModelSelect control={control} name="api.model" label="Модель" />
			</Box>

			{/* Порядок провайдеров */}
			<ProviderOrderSelect control={control} name="api.providerOrder" />

			<Divider />

			{/* Модели для разных задач */}
			<SettingsGroup title="Модель для RAG" settingKey="rag" form={form} />

			<SettingsGroup title="Модель для эмбеддингов" settingKey="embedding" form={form} />

			<SettingsGroup title="Модель для генерации ответов" settingKey="responseGeneration" form={form} />
		</Box>
	);
};
