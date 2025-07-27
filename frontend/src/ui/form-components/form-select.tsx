import React from 'react';
import { FormControl, FormHelperText, InputLabel, MenuItem, Select, SelectProps } from '@mui/material';
import { Controller, FieldPath, FieldValues, UseControllerProps } from 'react-hook-form';

export interface SelectOption {
	value: string | number;
	label: string;
}

export interface FormSelectProps<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<SelectProps, 'name' | 'value' | 'onChange' | 'error'> {
	form: UseControllerProps<TFieldValues, TName>;
	options: SelectOption[];
	label?: string;
}

export function FormSelect<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ form, options, label, ...selectProps }: FormSelectProps<TFieldValues, TName>) {
	return (
		<Controller
			{...form}
			render={({ field, fieldState: { error } }) => (
				<FormControl fullWidth error={!!error}>
					{label && <InputLabel>{label}</InputLabel>}
					<Select {...field} {...selectProps} label={label}>
						{options.map((option) => (
							<MenuItem key={option.value} value={option.value}>
								{option.label}
							</MenuItem>
						))}
					</Select>
					{error && <FormHelperText>{error.message}</FormHelperText>}
				</FormControl>
			)}
		/>
	);
}
