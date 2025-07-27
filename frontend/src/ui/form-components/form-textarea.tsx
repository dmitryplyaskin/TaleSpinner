import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';
import { Controller, FieldPath, FieldValues, UseControllerProps } from 'react-hook-form';

export interface FormTextareaProps<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<TextFieldProps, 'name' | 'value' | 'onChange' | 'error' | 'helperText' | 'multiline'> {
	form: UseControllerProps<TFieldValues, TName>;
}

export function FormTextarea<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ form, rows = 4, ...textFieldProps }: FormTextareaProps<TFieldValues, TName>) {
	return (
		<Controller
			{...form}
			render={({ field, fieldState: { error } }) => (
				<TextField {...field} {...textFieldProps} multiline rows={rows} error={!!error} helperText={error?.message} />
			)}
		/>
	);
}
