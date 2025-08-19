import React from 'react';
import { Box, Stack } from '@mui/material';
import { Control } from 'react-hook-form';
import { FormInput, FormTextarea } from '../../../ui/form-components';

export interface WorldPrimerBasicFormProps {
	control: Control<any>;
}

export const WorldPrimerBasicForm: React.FC<WorldPrimerBasicFormProps> = ({ control }) => {
	return (
		<Box>
			<Stack spacing={3}>
				<Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr 1fr' }} gap={3}>
					<FormInput form={{ name: 'name', control }} label="Название мира" fullWidth />

					<FormInput form={{ name: 'genre', control }} label="Жанр" fullWidth />

					<FormInput form={{ name: 'tone', control }} label="Тон" fullWidth />
				</Box>

				<FormTextarea
					form={{ name: 'world_primer', control }}
					label="Основное описание мира"
					rows={8}
					fullWidth
					placeholder="Основное описание мира, его атмосферы и особенностей..."
				/>

				<FormTextarea
					form={{ name: 'history', control }}
					label="История мира"
					rows={6}
					fullWidth
					placeholder="Общая история и предыстория мира..."
				/>
			</Stack>
		</Box>
	);
};
