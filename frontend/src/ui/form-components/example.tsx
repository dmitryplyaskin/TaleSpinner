import React from 'react';
import { useForm } from 'react-hook-form';
import { Button, Box, Typography } from '@mui/material';
import { FormInput, FormSelect, FormCheckbox, FormTextarea, FormRadioGroup } from './index';

interface ExampleFormData {
	name: string;
	email: string;
	country: string;
	description: string;
	newsletter: boolean;
	gender: string;
}

const countryOptions = [
	{ value: 'ru', label: 'Россия' },
	{ value: 'us', label: 'США' },
	{ value: 'uk', label: 'Великобритания' },
	{ value: 'de', label: 'Германия' },
];

const genderOptions = [
	{ value: 'male', label: 'Мужской' },
	{ value: 'female', label: 'Женский' },
	{ value: 'other', label: 'Другой' },
];

export function FormComponentsExample() {
	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<ExampleFormData>({
		defaultValues: {
			name: '',
			email: '',
			country: '',
			description: '',
			newsletter: false,
			gender: '',
		},
	});

	const onSubmit = (data: ExampleFormData) => {
		console.log('Form data:', data);
	};

	return (
		<Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
			<Typography variant="h4" gutterBottom>
				Примеры форм компонентов
			</Typography>

			<Box sx={{ mb: 2 }}>
				<FormInput
					form={{
						name: 'name',
						control,
						rules: { required: 'Имя обязательно' },
					}}
					label="Имя"
					fullWidth
				/>
			</Box>

			<Box sx={{ mb: 2 }}>
				<FormInput
					form={{
						name: 'email',
						control,
						rules: {
							required: 'Email обязателен',
							pattern: {
								value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
								message: 'Неверный формат email',
							},
						},
					}}
					label="Email"
					type="email"
					fullWidth
				/>
			</Box>

			<Box sx={{ mb: 2 }}>
				<FormSelect
					form={{
						name: 'country',
						control,
						rules: { required: 'Выберите страну' },
					}}
					options={countryOptions}
					label="Страна"
				/>
			</Box>

			<Box sx={{ mb: 2 }}>
				<FormTextarea
					form={{
						name: 'description',
						control,
						rules: { required: 'Описание обязательно' },
					}}
					label="Описание"
					fullWidth
					rows={4}
				/>
			</Box>

			<Box sx={{ mb: 2 }}>
				<FormCheckbox
					form={{
						name: 'newsletter',
						control,
					}}
					label="Подписаться на рассылку"
				/>
			</Box>

			<Box sx={{ mb: 2 }}>
				<FormRadioGroup
					form={{
						name: 'gender',
						control,
						rules: { required: 'Выберите пол' },
					}}
					options={genderOptions}
					label="Пол"
				/>
			</Box>

			<Button type="submit" variant="contained" size="large">
				Отправить
			</Button>
		</Box>
	);
}
