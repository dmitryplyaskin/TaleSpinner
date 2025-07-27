import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';
import { Controller, FieldPath, FieldValues, UseControllerProps } from 'react-hook-form';

export interface FormInputProps<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<TextFieldProps, 'name' | 'value' | 'onChange' | 'error' | 'helperText'> {
	form: UseControllerProps<TFieldValues, TName>;
}

export function FormInput<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ form, ...textFieldProps }: FormInputProps<TFieldValues, TName>) {
	return (
		<Controller
			{...form}
			render={({ field, fieldState: { error } }) => (
				<TextField {...field} {...textFieldProps} error={!!error} helperText={error?.message} />
			)}
		/>
	);
}
