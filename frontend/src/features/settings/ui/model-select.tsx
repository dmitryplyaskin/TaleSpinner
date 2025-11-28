/**
 * Компонент выбора модели OpenRouter
 */

import React, { useEffect } from 'react';
import { Autocomplete, TextField, CircularProgress, Box, Typography, Chip } from '@mui/material';
import { useUnit } from 'effector-react';
import { Controller, Control, FieldPath, FieldValues } from 'react-hook-form';
import { $models, $modelsLoading, $modelsError, $settings, loadModelsFx } from '../model';
import type { OpenRouterModel } from '../model';

interface ModelSelectProps<TFieldValues extends FieldValues = FieldValues> {
	control: Control<TFieldValues>;
	name: FieldPath<TFieldValues>;
	label?: string;
	disabled?: boolean;
}

export function ModelSelect<TFieldValues extends FieldValues = FieldValues>({
	control,
	name,
	label = 'Модель',
	disabled = false,
}: ModelSelectProps<TFieldValues>) {
	const models = useUnit($models);
	const isLoading = useUnit($modelsLoading);
	const error = useUnit($modelsError);
	const settings = useUnit($settings);

	const hasActiveToken = settings.api.activeTokenId !== null;

	useEffect(() => {
		if (hasActiveToken && models.length === 0 && !isLoading) {
			loadModelsFx();
		}
	}, [hasActiveToken, models.length, isLoading]);

	const formatPrice = (price: string): string => {
		const num = parseFloat(price);
		if (num === 0) return 'Free';
		if (num < 0.001) return `$${(num * 1000000).toFixed(2)}/M`;
		return `$${num.toFixed(4)}/1K`;
	};

	const renderOption = (props: React.HTMLAttributes<HTMLLIElement>, option: OpenRouterModel) => (
		<Box
			component="li"
			{...props}
			sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start !important', py: 1 }}
		>
			<Box display="flex" alignItems="center" gap={0.5} width="100%">
				<Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.85rem' }}>
					{option.name}
				</Typography>
				{option.pricing.prompt === '0' && (
					<Chip label="Free" size="small" color="success" sx={{ height: 16, fontSize: '0.65rem' }} />
				)}
			</Box>
			<Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
				{formatPrice(option.pricing.prompt)} · {option.context_length.toLocaleString()} ctx
			</Typography>
		</Box>
	);

	if (!hasActiveToken) {
		return (
			<TextField
				label={label}
				disabled
				fullWidth
				size="small"
				value=""
				placeholder="Добавьте API токен"
				helperText="Для выбора модели необходим токен"
			/>
		);
	}

	return (
		<Controller
			name={name}
			control={control}
			render={({ field, fieldState: { error: fieldError } }) => (
				<Autocomplete
					size="small"
					options={models}
					loading={isLoading}
					disabled={disabled || isLoading}
					value={models.find((m) => m.id === field.value) || null}
					onChange={(_, newValue) => {
						field.onChange(newValue?.id || '');
					}}
					getOptionLabel={(option) => option.name || option.id}
					isOptionEqualToValue={(option, value) => option.id === value.id}
					renderOption={renderOption}
					renderInput={(params) => (
						<TextField
							{...params}
							label={label}
							error={!!fieldError || !!error}
							helperText={fieldError?.message || error}
							InputProps={{
								...params.InputProps,
								endAdornment: (
									<>
										{isLoading ? <CircularProgress color="inherit" size={16} /> : null}
										{params.InputProps.endAdornment}
									</>
								),
							}}
						/>
					)}
					filterOptions={(options, { inputValue }) => {
						const filterValue = inputValue.toLowerCase();
						return options.filter(
							(option) =>
								option.name.toLowerCase().includes(filterValue) ||
								option.id.toLowerCase().includes(filterValue)
						);
					}}
					noOptionsText={error ? 'Ошибка загрузки' : 'Не найдено'}
					loadingText="Загрузка..."
				/>
			)}
		/>
	);
}



