import React from 'react';
import { Checkbox, CheckboxProps, FormControl, FormControlLabel, FormHelperText } from '@mui/material';
import { Controller, FieldPath, FieldValues, UseControllerProps } from 'react-hook-form';

export interface FormCheckboxProps<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
	form: UseControllerProps<TFieldValues, TName>;
	label?: string;
	checkboxProps?: Omit<CheckboxProps, 'name' | 'checked' | 'onChange'>;
}

export function FormCheckbox<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ form, label, checkboxProps }: FormCheckboxProps<TFieldValues, TName>) {
	return (
		<Controller
			{...form}
			render={({ field, fieldState: { error } }) => (
				<FormControl error={!!error}>
					<FormControlLabel
						control={<Checkbox {...field} {...checkboxProps} checked={field.value || false} />}
						label={label}
					/>
					{error && <FormHelperText>{error.message}</FormHelperText>}
				</FormControl>
			)}
		/>
	);
}
