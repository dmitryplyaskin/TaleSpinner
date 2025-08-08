import React from 'react';
import { Box, Button, Stack, Card, CardContent, Collapse } from '@mui/material';
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
			<Stack spacing={3}>
				{/* Секция магии */}
				<Card
					variant="outlined"
					sx={{
						borderRadius: 3,
						border: '1px solid',
						borderColor: 'divider',
						'&:hover': {
							borderColor: 'primary.main',
							boxShadow: 1,
						},
						transition: 'all 0.2s ease-in-out',
					}}
				>
					<CardContent sx={{ pb: magicEnabled ? 3 : 2 }}>
						<FormCheckbox form={{ name: 'magicEnabled', control }} label="Добавить раздел: Как работает магия" />

						<Collapse in={magicEnabled} timeout="auto" unmountOnExit>
							<Box mt={3}>
								<FormTextarea
									form={{ name: 'magicDescription', control }}
									label="Как работает магия"
									rows={4}
									fullWidth
									placeholder="Опишите систему магии в вашем мире..."
								/>
							</Box>
						</Collapse>
					</CardContent>
				</Card>

				{/* Секция фракций */}
				<Card
					variant="outlined"
					sx={{
						borderRadius: 3,
						border: '1px solid',
						borderColor: 'divider',
						'&:hover': {
							borderColor: 'primary.main',
							boxShadow: 1,
						},
						transition: 'all 0.2s ease-in-out',
					}}
				>
					<CardContent sx={{ pb: factionsEnabled ? 3 : 2 }}>
						<FormCheckbox form={{ name: 'factionsEnabled', control }} label="Добавить раздел: Фракции" />

						<Collapse in={factionsEnabled} timeout="auto" unmountOnExit>
							<Box mt={3}>
								<Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '200px 1fr' }} gap={3} alignItems="start">
									<FormInput
										form={{ name: 'factionsCount', control }}
										label="Количество фракций"
										type="number"
										fullWidth
										placeholder="3"
									/>
									<FormTextarea
										form={{ name: 'factionsDescription', control }}
										label="Описание фракций"
										rows={4}
										fullWidth
										placeholder="Опишите основные фракции и их взаимоотношения..."
									/>
								</Box>
							</Box>
						</Collapse>
					</CardContent>
				</Card>

				{/* Секция персонажей */}
				<Card
					variant="outlined"
					sx={{
						borderRadius: 3,
						border: '1px solid',
						borderColor: 'divider',
						'&:hover': {
							borderColor: 'primary.main',
							boxShadow: 1,
						},
						transition: 'all 0.2s ease-in-out',
					}}
				>
					<CardContent sx={{ pb: charactersEnabled ? 3 : 2 }}>
						<FormCheckbox form={{ name: 'charactersEnabled', control }} label="Добавить раздел: Персонажи" />

						<Collapse in={charactersEnabled} timeout="auto" unmountOnExit>
							<Box mt={3}>
								<Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '200px 1fr' }} gap={3} alignItems="start">
									<FormInput
										form={{ name: 'charactersCount', control }}
										label="Количество персонажей"
										type="number"
										fullWidth
										placeholder="5"
									/>
									<FormTextarea
										form={{ name: 'charactersDescription', control }}
										label="Описание персонажей"
										rows={4}
										fullWidth
										placeholder="Опишите ключевых персонажей и их роли..."
									/>
								</Box>
							</Box>
						</Collapse>
					</CardContent>
				</Card>

				{/* Кнопки управления */}
				<Box display="flex" justifyContent="center" pt={4}>
					<Button
						type="submit"
						variant="contained"
						size="large"
						sx={{
							minWidth: '300px',
							borderRadius: 2,
							textTransform: 'none',
							fontSize: '1.1rem',
							py: 1.5,
						}}
					>
						Сохранить дополнительные настройки
					</Button>
				</Box>
			</Stack>
		</Box>
	);
};
