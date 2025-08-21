import React from 'react';
import { Box, Stack } from '@mui/material';
import { Control } from 'react-hook-form';
import { FormInput, FormTextarea } from '../../../ui/form-components';

export interface WorldDraftEditFormProps {
	control: Control<any>;
}

export const WorldDraftEditForm: React.FC<WorldDraftEditFormProps> = ({ control }) => {
	return (
		<Box>
			<Stack spacing={3}>
				<Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
					<FormInput form={{ name: 'title', control }} label="Название мира" fullWidth />

					<FormInput form={{ name: 'genre', control }} label="Жанр" fullWidth />

					<Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
						<FormInput
							form={{ name: 'toneText', control }}
							label="Тон (через запятую)"
							placeholder="напр., мрачный, heroический, эпичный"
							fullWidth
						/>
					</Box>
				</Box>

				<FormTextarea form={{ name: 'unique_feature', control }} label="Уникальная особенность" rows={3} fullWidth />

				<FormTextarea form={{ name: 'synopsis', control }} label="Описание мира" rows={6} fullWidth />
			</Stack>
		</Box>
	);
};
