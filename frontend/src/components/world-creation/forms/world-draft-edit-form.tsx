import React from 'react';
import { Box, Button } from '@mui/material';
import { useForm } from 'react-hook-form';
import { FormInput, FormTextarea } from '../../../ui/form-components';
import { CreatedWorldDraft } from '@shared/types/world-creation';

export interface WorldDraftEditFormProps {
	initialWorld: CreatedWorldDraft;
	onSubmit: (world: CreatedWorldDraft) => void;
}

type EditableWorldFormData = {
	title: string;
	genre: string;
	toneText: string;
	unique_feature: string;
	synopsis: string;
};

export const WorldDraftEditForm: React.FC<WorldDraftEditFormProps> = ({ initialWorld, onSubmit }) => {
	const { control, handleSubmit } = useForm<EditableWorldFormData>({
		values: {
			title: initialWorld.title,
			genre: initialWorld.genre,
			toneText: (initialWorld.tone || []).join(', '),
			unique_feature: initialWorld.unique_feature,
			synopsis: initialWorld.synopsis,
		},
	});

	const handleFormSubmit = (data: EditableWorldFormData) => {
		const updated: CreatedWorldDraft = {
			id: initialWorld.id,
			title: data.title,
			genre: data.genre,
			tone: data.toneText
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean),
			unique_feature: data.unique_feature,
			synopsis: data.synopsis,
			isFavorite: initialWorld.isFavorite,
		};
		onSubmit(updated);
	};

	return (
		<Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
			<Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={2}>
				<FormInput
					form={{ name: 'title', control, rules: { required: 'Название обязательно' } }}
					label="Название мира"
					fullWidth
				/>

				<FormInput form={{ name: 'genre', control, rules: { required: 'Жанр обязателен' } }} label="Жанр" fullWidth />

				<FormInput
					form={{ name: 'toneText', control }}
					label="Тон (через запятую)"
					placeholder="напр., мрачный, героический, эпичный"
					fullWidth
				/>
			</Box>

			<Box mt={2}>
				<FormTextarea
					form={{ name: 'unique_feature', control, rules: { required: 'Уникальная особенность обязательна' } }}
					label="Уникальная особенность"
					rows={3}
					fullWidth
				/>
			</Box>

			<Box mt={2}>
				<FormTextarea
					form={{ name: 'synopsis', control, rules: { required: 'Описание обязательно' } }}
					label="Описание мира"
					rows={6}
					fullWidth
				/>
			</Box>

			<Box display="flex" gap={2} mt={3}>
				<Button type="submit" variant="contained" size="large">
					Сохранить изменения
				</Button>
			</Box>
		</Box>
	);
};
