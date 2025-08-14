import React from 'react';
import { Box, Stack } from '@mui/material';
import { Control } from 'react-hook-form';
import { FormInput, FormTextarea } from '../../../ui/form-components';

export interface WorldDraftEditFormProps {
	control: Control<any>;
}

type EditableWorldFormData = {
	title: string;
	genre: string;
	toneText: string;
	unique_feature: string;
	synopsis: string;
};

export const WorldDraftEditForm: React.FC<WorldDraftEditFormProps> = ({ control }) => {
	// const { control, handleSubmit } = useForm<EditableWorldFormData>({
	// 	values: {
	// 		title: initialWorld.title,
	// 		genre: initialWorld.genre,
	// 		toneText: (initialWorld.tone || []).join(', '),
	// 		unique_feature: initialWorld.unique_feature,
	// 		synopsis: initialWorld.synopsis,
	// 	},
	// });

	// const handleFormSubmit = (data: EditableWorldFormData) => {
	// 	const updated: CreatedWorldDraft = {
	// 		id: initialWorld.id,
	// 		title: data.title,
	// 		genre: data.genre,
	// 		tone: data.toneText
	// 			.split(',')
	// 			.map((s) => s.trim())
	// 			.filter(Boolean),
	// 		unique_feature: data.unique_feature,
	// 		synopsis: data.synopsis,
	// 		isFavorite: initialWorld.isFavorite,
	// 	};
	// 	onSubmit(updated);
	// };

	return (
		<Box>
			<Stack spacing={3}>
				<Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
					<FormInput
						form={{ name: 'title', control, rules: { required: 'Название обязательно' } }}
						label="Название мира"
						fullWidth
					/>

					<FormInput form={{ name: 'genre', control, rules: { required: 'Жанр обязателен' } }} label="Жанр" fullWidth />

					<Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
						<FormInput
							form={{ name: 'toneText', control }}
							label="Тон (через запятую)"
							placeholder="напр., мрачный, heroический, эпичный"
							fullWidth
						/>
					</Box>
				</Box>

				<FormTextarea
					form={{ name: 'unique_feature', control, rules: { required: 'Уникальная особенность обязательна' } }}
					label="Уникальная особенность"
					rows={3}
					fullWidth
				/>

				<FormTextarea
					form={{ name: 'synopsis', control, rules: { required: 'Описание обязательно' } }}
					label="Описание мира"
					rows={6}
					fullWidth
				/>
			</Stack>
		</Box>
	);
};
