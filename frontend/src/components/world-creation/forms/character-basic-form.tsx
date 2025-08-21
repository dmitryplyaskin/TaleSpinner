import React from 'react';
import { Box, Stack, Typography, Grid } from '@mui/material';
import { Control } from 'react-hook-form';
import { FormInput, FormTextarea, FormSelect, FormRadioGroup } from '../../../ui/form-components';

export interface CharacterBasicFormProps {
	control: Control<any>;
}

export const CharacterBasicForm: React.FC<CharacterBasicFormProps> = ({ control }) => {
	return (
		<Box>
			<Stack spacing={3}>
				{/* Основная информация */}
				<Box>
					<Typography variant="h6" gutterBottom>
						Основная информация
					</Typography>
					<Grid container spacing={2}>
						<Grid item xs={12} md={6}>
							<FormInput
								form={{ name: 'name', control }}
								label="Имя персонажа"
								required
								fullWidth
								placeholder="Введите имя персонажа"
							/>
						</Grid>
						<Grid item xs={12} md={6}>
							<FormInput
								form={{ name: 'race', control }}
								label="Раса"
								required
								fullWidth
								placeholder="Например: человек, эльф, орк"
							/>
						</Grid>
						<Grid item xs={12} md={4}>
							<FormSelect
								form={{ name: 'gender', control }}
								label="Пол"
								options={[
									{ value: 'male', label: 'Мужской' },
									{ value: 'female', label: 'Женский' },
									{ value: 'other', label: 'Другой' },
									{ value: 'non-binary', label: 'Небинарный' },
								]}
								required
								fullWidth
							/>
						</Grid>
						<Grid item xs={12} md={4}>
							<FormInput
								form={{ name: 'age', control }}
								label="Возраст"
								type="number"
								required
								fullWidth
								placeholder="0"
							/>
						</Grid>
						<Grid item xs={12} md={4}>
							<FormInput
								form={{ name: 'occupation', control }}
								label="Профессия"
								fullWidth
								placeholder="Воин, маг, торговец и т.д."
							/>
						</Grid>
					</Grid>
				</Box>

				{/* Внешность */}
				<Box>
					<Typography variant="h6" gutterBottom>
						Внешность
					</Typography>
					<Grid container spacing={2}>
						<Grid item xs={12} md={3}>
							<FormInput form={{ name: 'appearance.height', control }} label="Рост" fullWidth placeholder="170 см" />
						</Grid>
						<Grid item xs={12} md={3}>
							<FormInput form={{ name: 'appearance.weight', control }} label="Вес" fullWidth placeholder="70 кг" />
						</Grid>
						<Grid item xs={12} md={3}>
							<FormInput
								form={{ name: 'appearance.hair_color', control }}
								label="Цвет волос"
								fullWidth
								placeholder="Черные, русые, рыжие"
							/>
						</Grid>
						<Grid item xs={12} md={3}>
							<FormInput
								form={{ name: 'appearance.eye_color', control }}
								label="Цвет глаз"
								fullWidth
								placeholder="Карие, голубые, зеленые"
							/>
						</Grid>
						<Grid item xs={12} md={6}>
							<FormInput
								form={{ name: 'appearance.skin_color', control }}
								label="Цвет кожи"
								fullWidth
								placeholder="Светлая, темная, загорелая"
							/>
						</Grid>
						<Grid item xs={12} md={6}>
							<FormInput
								form={{ name: 'appearance.distinctive_features', control }}
								label="Отличительные черты"
								fullWidth
								placeholder="Шрамы, татуировки, особые приметы"
							/>
						</Grid>
						<Grid item xs={12}>
							<FormTextarea
								form={{ name: 'appearance.description', control }}
								label="Описание внешности"
								rows={3}
								fullWidth
								placeholder="Подробное описание внешнего вида персонажа..."
							/>
						</Grid>
					</Grid>
				</Box>

				{/* Характер и личность */}
				<Box>
					<Typography variant="h6" gutterBottom>
						Характер и личность
					</Typography>
					<Grid container spacing={2}>
						<Grid item xs={12}>
							<FormTextarea
								form={{ name: 'personality.background', control }}
								label="Предыстория"
								rows={4}
								fullWidth
								placeholder="Расскажите о прошлом персонажа, его происхождении..."
							/>
						</Grid>
					</Grid>
				</Box>

				{/* История и связи */}
				<Box>
					<Typography variant="h6" gutterBottom>
						Фон и связи
					</Typography>
					<Grid container spacing={2}>
						<Grid item xs={12}>
							<FormTextarea
								form={{ name: 'background.family', control }}
								label="Семья и происхождение"
								rows={3}
								fullWidth
								placeholder="Расскажите о семье персонажа, его происхождении..."
							/>
						</Grid>
						<Grid item xs={12}>
							<FormTextarea
								form={{ name: 'background.history', control }}
								label="Жизненная история"
								rows={4}
								fullWidth
								placeholder="Подробная история жизни персонажа..."
							/>
						</Grid>
					</Grid>
				</Box>
			</Stack>
		</Box>
	);
};
