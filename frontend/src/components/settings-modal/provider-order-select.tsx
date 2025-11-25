import React from 'react';
import { Autocomplete, TextField, Chip, Box, Typography, Tooltip } from '@mui/material';
import { Controller, Control, FieldPath, FieldValues } from 'react-hook-form';
import { Info } from '@mui/icons-material';
import { OPENROUTER_PROVIDERS } from '../../../../shared/types/settings';

interface ProviderOrderSelectProps<TFieldValues extends FieldValues = FieldValues> {
	control: Control<TFieldValues>;
	name: FieldPath<TFieldValues>;
	disabled?: boolean;
}

const providerOptions = OPENROUTER_PROVIDERS.map((provider) => ({
	value: provider,
	label: provider,
}));

export function ProviderOrderSelect<TFieldValues extends FieldValues = FieldValues>({
	control,
	name,
	disabled = false,
}: ProviderOrderSelectProps<TFieldValues>) {
	return (
		<Box>
			<Box display="flex" alignItems="center" gap={1} mb={1}>
				<Typography variant="subtitle2">Порядок провайдеров</Typography>
				<Tooltip
					title="Выберите провайдеров в порядке предпочтения. OpenRouter будет использовать их в указанном порядке при выполнении запросов. Если не выбрано ни одного, будет использоваться провайдер по умолчанию."
					arrow
				>
					<Info fontSize="small" color="action" sx={{ cursor: 'help' }} />
				</Tooltip>
			</Box>

			<Controller
				name={name}
				control={control}
				render={({ field, fieldState: { error } }) => (
					<Autocomplete
						multiple
						options={providerOptions}
						disabled={disabled}
						value={providerOptions.filter((opt) => ((field.value as string[]) || []).includes(opt.value))}
						onChange={(_, newValue) => {
							field.onChange(newValue.map((v) => v.value));
						}}
						getOptionLabel={(option) => option.label}
						isOptionEqualToValue={(option, value) => option.value === value.value}
						renderTags={(value, getTagProps) =>
							value.map((option, index) => {
								const tagProps = getTagProps({ index });
								return <Chip {...tagProps} key={option.value} label={option.label} size="small" />;
							})
						}
						renderInput={(params) => (
							<TextField
								{...params}
								placeholder={field.value?.length ? '' : 'Выберите провайдеров...'}
								error={!!error}
								helperText={error?.message || 'Порядок выбора определяет приоритет провайдеров'}
							/>
						)}
						renderOption={(props, option) => (
							<Box component="li" {...props}>
								<Typography variant="body2">{option.label}</Typography>
							</Box>
						)}
						noOptionsText="Провайдеры не найдены"
					/>
				)}
			/>
		</Box>
	);
}
