import React from 'react';
import { Box, Button, Grid } from '@mui/material';
import { useForm } from 'react-hook-form';
import { FormCheckbox, FormInput, FormTextarea } from '../../../ui/form-components';

export interface CustomizationAdvancedData {
	magicEnabled: boolean;
	magicDescription?: string;

	factionsEnabled: boolean;
	factionsCount?: number | string;
	factionsDescription?: string;

	charactersEnabled: boolean;
	charactersCount?: number | string;
	charactersDescription?: string;
}

export interface CustomizationAdvancedFormProps {
	defaultValues?: Partial<CustomizationAdvancedData>;
	onSubmit: (data: CustomizationAdvancedData) => void;
}

export const CustomizationAdvancedForm: React.FC<CustomizationAdvancedFormProps> = ({ defaultValues, onSubmit }) => {
	const { control, handleSubmit, watch } = useForm<CustomizationAdvancedData>({
		defaultValues: {
			magicEnabled: false,
			factionsEnabled: false,
			charactersEnabled: false,
			...defaultValues,
		},
	});

	const magicEnabled = watch('magicEnabled');
	const factionsEnabled = watch('factionsEnabled');
	const charactersEnabled = watch('charactersEnabled');

	const submit = (data: CustomizationAdvancedData) => {
		onSubmit(data);
	};

	return (
		<Box component="form" onSubmit={handleSubmit(submit)}>
			<Grid container spacing={2}>
				<Grid item xs={12}>
					<FormCheckbox form={{ name: 'magicEnabled', control }} label="Добавить раздел: Как работает магия" />
				</Grid>
				{magicEnabled && (
					<Grid item xs={12}>
						<FormTextarea form={{ name: 'magicDescription', control }} label="Как работает магия" rows={4} fullWidth />
					</Grid>
				)}

				<Grid item xs={12}>
					<FormCheckbox form={{ name: 'factionsEnabled', control }} label="Добавить раздел: Фракции" />
				</Grid>
				{factionsEnabled && (
					<>
						<Grid item xs={12} md={4}>
							<FormInput form={{ name: 'factionsCount', control }} label="Количество фракций" type="number" fullWidth />
						</Grid>
						<Grid item xs={12} md={8}>
							<FormTextarea
								form={{ name: 'factionsDescription', control }}
								label="Описание фракций"
								rows={4}
								fullWidth
							/>
						</Grid>
					</>
				)}

				<Grid item xs={12}>
					<FormCheckbox form={{ name: 'charactersEnabled', control }} label="Добавить раздел: Персонажи" />
				</Grid>
				{charactersEnabled && (
					<>
						<Grid item xs={12} md={4}>
							<FormInput
								form={{ name: 'charactersCount', control }}
								label="Количество персонажей"
								type="number"
								fullWidth
							/>
						</Grid>
						<Grid item xs={12} md={8}>
							<FormTextarea
								form={{ name: 'charactersDescription', control }}
								label="Описание персонажей"
								rows={4}
								fullWidth
							/>
						</Grid>
					</>
				)}

				<Grid item xs={12}>
					<Box display="flex" gap={2} mt={1}>
						<Button type="submit" variant="outlined">
							Сохранить дополнительные настройки
						</Button>
					</Box>
				</Grid>
			</Grid>
		</Box>
	);
};
