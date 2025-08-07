import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { FormCheckbox, FormInput, FormTextarea } from '../../ui/form-components';
import { CreatedWorldDraft } from '@shared/types/world-creation';
import { useWorldCreationNavigation } from './navigation/navigation';
import { StepNavigation } from './navigation/step-navigation';

type EditableWorldFormData = {
	id: string;
	title: string;
	genre: string;
	toneText: string; // comma-separated list for editing convenience
	unique_feature: string;
	synopsis: string;
	isFavorite: boolean;
};

export const WorldCustomization: React.FC = () => {
	const { currentBranch, currentStepIndex, updateCurrentStepData } = useWorldCreationNavigation();

	const previousStep = currentBranch?.steps?.[Math.max(0, currentStepIndex - 1)];
	const selectedWorld = (previousStep?.data?.selectedWorld || null) as CreatedWorldDraft | null;

	const { control, handleSubmit } = useForm<EditableWorldFormData>({
		values: selectedWorld
			? {
					id: selectedWorld.id,
					title: selectedWorld.title,
					genre: selectedWorld.genre,
					toneText: (selectedWorld.tone || []).join(', '),
					unique_feature: selectedWorld.unique_feature,
					synopsis: selectedWorld.synopsis,
					isFavorite: Boolean(selectedWorld.isFavorite),
			  }
			: {
					id: '',
					title: '',
					genre: '',
					toneText: '',
					unique_feature: '',
					synopsis: '',
					isFavorite: false,
			  },
	});

	const onSubmit = (data: EditableWorldFormData) => {
		const updated: CreatedWorldDraft = {
			id: data.id,
			title: data.title,
			genre: data.genre,
			tone: data.toneText
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean),
			unique_feature: data.unique_feature,
			synopsis: data.synopsis,
			isFavorite: data.isFavorite,
		};

		// Заглушка сабмита: логируем и кладём в данные текущего шага
		// В реальной реализации здесь будет вызов API сохранения
		// и/или переход к следующему шагу
		// eslint-disable-next-line no-console
		console.log('Updated world draft (stub submit):', updated);
		updateCurrentStepData({ updatedWorld: updated, completed: true });
	};

	if (!selectedWorld) {
		return (
			<Box textAlign="center" py={8}>
				<Typography variant="h6" color="text.secondary">
					Данные выбранного мира не найдены. Вернитесь на предыдущий шаг и выберите мир.
				</Typography>
				<StepNavigation showNext={false} />
			</Box>
		);
	}

	return (
		<Box component="form" onSubmit={handleSubmit(onSubmit)}>
			<Box textAlign="center" py={2} mb={3}>
				<Typography variant="h5" gutterBottom>
					Редактирование мира
				</Typography>
				<Typography variant="body1" color="text.secondary">
					Вы можете отредактировать все текущие данные, полученные на предыдущем шаге.
				</Typography>
			</Box>

			<Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={2}>
				<FormInput form={{ name: 'id', control, rules: { required: 'ID обязателен' } }} label="ID" fullWidth />

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

			<Box mt={2}>
				<FormCheckbox form={{ name: 'isFavorite', control }} label="Добавить в избранное" />
			</Box>

			<Box display="flex" gap={2} mt={3}>
				<Button type="submit" variant="contained" size="large">
					Сохранить изменения
				</Button>
			</Box>

			<Box mt={2}>
				<StepNavigation nextLabel="Завершить" showNext={false} />
			</Box>
		</Box>
	);
};
