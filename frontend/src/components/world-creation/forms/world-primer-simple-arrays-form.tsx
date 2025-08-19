import React from 'react';
import { Box, Stack, Typography, Card, CardContent, IconButton, Button } from '@mui/material';
import { Control, useFieldArray } from 'react-hook-form';
import { FormInput, FormTextarea } from '../../../ui/form-components';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

export interface WorldPrimerSimpleArraysFormProps {
	control: Control<any>;
}

interface SimpleArraySectionProps {
	control: Control<any>;
	name: 'locations' | 'races' | 'factions';
	title: string;
	itemTitle: string;
	placeholder?: string;
}

const SimpleArraySection: React.FC<SimpleArraySectionProps> = ({ control, name, title, itemTitle, placeholder }) => {
	const { fields, append, remove } = useFieldArray({
		control,
		name,
	});

	const addItem = () => {
		append({ name: '', description: '' });
	};

	return (
		<Box>
			<Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
				<Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 0 }}>
					{title}
				</Typography>
				<Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={addItem}>
					Добавить {itemTitle.toLowerCase()}
				</Button>
			</Box>

			<Stack spacing={2}>
				{fields.map((field, index) => (
					<Card key={field.id} variant="outlined" sx={{ borderRadius: 2 }}>
						<CardContent>
							<Box display="flex" justifyContent="between" alignItems="flex-start" mb={2}>
								<Typography variant="subtitle1" sx={{ fontWeight: 500, flexGrow: 1 }}>
									{itemTitle} #{index + 1}
								</Typography>
								<IconButton size="small" color="error" onClick={() => remove(index)} sx={{ ml: 1 }}>
									<DeleteIcon />
								</IconButton>
							</Box>
							<Stack spacing={2}>
								<FormInput
									form={{ name: `${name}.${index}.name`, control }}
									label={`Название ${itemTitle.toLowerCase()}`}
									fullWidth
								/>
								<FormTextarea
									form={{ name: `${name}.${index}.description`, control }}
									label={`Описание ${itemTitle.toLowerCase()}`}
									rows={3}
									fullWidth
									placeholder={placeholder}
								/>
							</Stack>
						</CardContent>
					</Card>
				))}
			</Stack>

			{fields.length === 0 && (
				<Box
					textAlign="center"
					py={4}
					sx={{
						border: '2px dashed',
						borderColor: 'divider',
						borderRadius: 2,
						backgroundColor: 'grey.50',
					}}
				>
					<Typography variant="body2" color="text.secondary" mb={2}>
						Нет добавленных элементов
					</Typography>
					<Button variant="contained" size="small" startIcon={<AddIcon />} onClick={addItem}>
						Добавить первый {itemTitle.toLowerCase()}
					</Button>
				</Box>
			)}
		</Box>
	);
};

export const WorldPrimerSimpleArraysForm: React.FC<WorldPrimerSimpleArraysFormProps> = ({ control }) => {
	return (
		<Box>
			<Stack spacing={4}>
				<SimpleArraySection
					control={control}
					name="locations"
					title="Локации"
					itemTitle="Локация"
					placeholder="Опишите локацию, её особенности и значение..."
				/>

				<SimpleArraySection
					control={control}
					name="races"
					title="Расы"
					itemTitle="Раса"
					placeholder="Опишите расу, её особенности и культуру..."
				/>

				<SimpleArraySection
					control={control}
					name="factions"
					title="Фракции"
					itemTitle="Фракция"
					placeholder="Опишите фракцию, её цели и методы..."
				/>
			</Stack>
		</Box>
	);
};
