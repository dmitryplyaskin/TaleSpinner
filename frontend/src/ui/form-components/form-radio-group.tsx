import React from 'react';
import {
	FormControl,
	FormControlLabel,
	FormHelperText,
	FormLabel,
	Radio,
	RadioGroup,
	RadioGroupProps,
} from '@mui/material';
import { Controller, FieldPath, FieldValues, UseControllerProps } from 'react-hook-form';

export interface RadioOption {
	value: string | number;
	label: string;
}

export interface FormRadioGroupProps<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<RadioGroupProps, 'name' | 'value' | 'onChange'> {
	form: UseControllerProps<TFieldValues, TName>;
	options: RadioOption[];
	label?: string;
}

export function FormRadioGroup<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ form, options, label, ...radioGroupProps }: FormRadioGroupProps<TFieldValues, TName>) {
	return (
		<Controller
			{...form}
			render={({ field, fieldState: { error } }) => (
				<FormControl error={!!error}>
					{label && <FormLabel>{label}</FormLabel>}
					<RadioGroup {...field} {...radioGroupProps}>
						{options.map((option) => (
							<FormControlLabel key={option.value} value={option.value} control={<Radio />} label={option.label} />
						))}
					</RadioGroup>
					{error && <FormHelperText>{error.message}</FormHelperText>}
				</FormControl>
			)}
		/>
	);
}
