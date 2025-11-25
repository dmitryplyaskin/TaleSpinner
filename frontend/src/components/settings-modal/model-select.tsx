import React, { useEffect } from 'react';
import { Autocomplete, TextField, CircularProgress, Box, Typography, Chip } from '@mui/material';
import { useUnit } from 'effector-react';
import { Controller, Control, FieldPath, FieldValues } from 'react-hook-form';
import { $models, $modelsLoading, $modelsError, $settings, loadModelsFx } from '../../model/settings';
import { OpenRouterModel } from '../../../../shared/types/settings';

interface ModelSelectProps<TFieldValues extends FieldValues = FieldValues> {
	control: Control<TFieldValues>;
	name: FieldPath<TFieldValues>;
	label?: string;
	disabled?: boolean;
	helperText?: string;
}

export function ModelSelect<TFieldValues extends FieldValues = FieldValues>({
	control,
	name,
	label = 'Модель',
	disabled = false,
	helperText,
}: ModelSelectProps<TFieldValues>) {
	const models = useUnit($models);
	const isLoading = useUnit($modelsLoading);
	const error = useUnit($modelsError);
	const settings = useUnit($settings);

	const hasActiveToken = settings.api.activeTokenId !== null;

	useEffect(() => {
		// Загружаем модели только если есть активный токен и модели еще не загружены
		if (hasActiveToken && models.length === 0 && !isLoading) {
			loadModelsFx();
		}
	}, [hasActiveToken, models.length, isLoading]);

	const formatPrice = (price: string): string => {
		const num = parseFloat(price);
		if (num === 0) return 'Бесплатно';
		if (num < 0.001) return `$${(num * 1000000).toFixed(2)}/M`;
		return `$${num.toFixed(4)}/1K`;
	};

	const renderOption = (props: React.HTMLAttributes<HTMLLIElement>, option: OpenRouterModel) => (
		<Box component="li" {...props} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start !important' }}>
			<Box display="flex" alignItems="center" gap={1} width="100%">
				<Typography variant="body2" fontWeight="medium">
					{option.name}
				</Typography>
				{option.pricing.prompt === '0' && (
					<Chip label="Free" size="small" color="success" sx={{ height: 18, fontSize: '0.7rem' }} />
				)}
			</Box>
			<Box display="flex" gap={2}>
				<Typography variant="caption" color="text.secondary">
					{option.id}
				</Typography>
				<Typography variant="caption" color="text.secondary">
					Контекст: {option.context_length.toLocaleString()}
				</Typography>
				<Typography variant="caption" color="text.secondary">
					Цена: {formatPrice(option.pricing.prompt)}
				</Typography>
			</Box>
		</Box>
	);

	if (!hasActiveToken) {
		return (
			<TextField
				label={label}
				disabled
				fullWidth
				value=""
				placeholder="Сначала добавьте API токен"
				helperText="Для выбора модели необходим активный API токен"
			/>
		);
	}

	return (
		<Controller
			name={name}
			control={control}
			render={({ field, fieldState: { error: fieldError } }) => (
				<Autocomplete
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
							helperText={fieldError?.message || error || helperText}
							InputProps={{
								...params.InputProps,
								endAdornment: (
									<>
										{isLoading ? <CircularProgress color="inherit" size={20} /> : null}
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
					noOptionsText={error ? 'Ошибка загрузки моделей' : 'Модели не найдены'}
					loadingText="Загрузка моделей..."
				/>
			)}
		/>
	);
}

