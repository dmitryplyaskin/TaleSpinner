import React from 'react';
import { Box, Button, Stack, Card, CardContent, Collapse, IconButton, Tooltip, Typography } from '@mui/material';
import { AutoAwesome as GenerateIcon } from '@mui/icons-material';
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

// Типы для JSON конфигурации
export interface FormFieldConfig {
	name: string;
	type: 'input' | 'textarea';
	label: string;
	placeholder?: string;
	inputType?: 'text' | 'number';
	rows?: number;
	fullWidth?: boolean;
	canGenerate?: boolean;
}

export interface FormSectionConfig {
	id: string;
	title: string;
	description?: string;
	enabledFieldName: string;
	fields: FormFieldConfig[];
}

export interface FormConfig {
	sections: FormSectionConfig[];
}

// Интерфейс для обработчиков генерации
export interface GenerateHandlers {
	[fieldName: string]: () => void;
}

export interface CustomizationAdvancedFormProps {
	defaultValues?: Partial<CustomizationAdvancedData>;
	onSubmit: (data: CustomizationAdvancedData) => void;
	generateHandlers?: GenerateHandlers;
	formConfig?: FormConfig;
}

// Компонент поля с кнопкой генерации
interface FieldWithGenerateProps {
	field: FormFieldConfig;
	control: any;
	onGenerate?: () => void;
}

const FieldWithGenerate: React.FC<FieldWithGenerateProps> = ({ field, control, onGenerate }) => {
	const renderField = () => {
		switch (field.type) {
			case 'input':
				return (
					<FormInput
						form={{ name: field.name, control }}
						label={field.label}
						type={field.inputType || 'text'}
						fullWidth={field.fullWidth}
						placeholder={field.placeholder}
					/>
				);
			case 'textarea':
				return (
					<FormTextarea
						form={{ name: field.name, control }}
						label={field.label}
						rows={field.rows || 4}
						fullWidth={field.fullWidth}
						placeholder={field.placeholder}
					/>
				);
			default:
				return null;
		}
	};

	if (!field.canGenerate || !onGenerate) {
		return renderField();
	}

	return (
		<Box display="flex" alignItems="flex-end" gap={1.5} width="100%">
			<Box flex={1}>{renderField()}</Box>
			<Tooltip title="Сгенерировать автоматически">
				<IconButton
					onClick={onGenerate}
					color="primary"
					size="medium"
					sx={{
						mb: 0.5,
						flexShrink: 0,
						'&:hover': {
							backgroundColor: 'primary.main',
							color: 'primary.contrastText',
						},
					}}
				>
					<GenerateIcon />
				</IconButton>
			</Tooltip>
		</Box>
	);
};

// Компонент секции формы
interface FormSectionProps {
	section: FormSectionConfig;
	control: any;
	isExpanded: boolean;
	generateHandlers?: GenerateHandlers;
}

const FormSection: React.FC<FormSectionProps> = ({ section, control, isExpanded, generateHandlers }) => {
	return (
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
			<CardContent sx={{ pb: isExpanded ? 3 : 2 }}>
				{/* Чекбокс для включения/выключения секции */}
				<FormCheckbox form={{ name: section.enabledFieldName, control }} label={section.title} />

				{/* Описание секции */}
				{section.description && (
					<Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 0 }}>
						{section.description}
					</Typography>
				)}

				{/* Поля секции */}
				<Collapse in={isExpanded} timeout="auto" unmountOnExit>
					<Box mt={3}>
						<Stack spacing={3}>
							{section.fields.map((field) => (
								<FieldWithGenerate
									key={field.name}
									field={field}
									control={control}
									onGenerate={generateHandlers?.[field.name]}
								/>
							))}
						</Stack>
					</Box>
				</Collapse>
			</CardContent>
		</Card>
	);
};

// Конфигурация формы по умолчанию
const DEFAULT_FORM_CONFIG: FormConfig = {
	sections: [
		{
			id: 'races',
			title: 'Добавить раздел: Расы',
			description: 'Определите основные расы, вы можете описать подробно, либо оставить на усмотрение генератора',
			enabledFieldName: 'racesEnabled',
			fields: [
				{
					name: 'racesCount',
					type: 'input',
					label: 'Количество рас',
					inputType: 'number',
					fullWidth: true,
				},
				{
					name: 'racesDescription',
					type: 'textarea',
					label: 'Описание рас',
					rows: 4,
					fullWidth: true,
				},
			],
		},
		{
			id: 'timeline',
			title: 'Добавить раздел: Предыстория мира',
			description:
				'Опишите события, которые произошли до начала игры, вы можете описать подробно, либо оставить на усмотрение генератора',
			enabledFieldName: 'timelineEnabled',
			fields: [
				{
					name: 'timelineDescription',
					type: 'textarea',
					label: 'Описание истории мира',
					rows: 4,
					fullWidth: true,
					placeholder: 'Опишите основные события и развитие мира...',
					canGenerate: true,
				},
			],
		},
		// {
		// 	id: 'magic',
		// 	title: 'Добавить раздел: Как работает магия',
		// 	description:
		// 		'Опишите систему магии в вашем мире, её правила и ограничения, вы можете описать подробно, либо оставить на усмотрение генератора',
		// 	enabledFieldName: 'magicEnabled',
		// 	fields: [
		// 		{
		// 			name: 'magicDescription',
		// 			type: 'textarea',
		// 			label: 'Как работает магия',
		// 			rows: 4,
		// 			fullWidth: true,
		// 			placeholder: 'Опишите систему магии в вашем мире...',
		// 			canGenerate: true,
		// 		},
		// 	],
		// },
		{
			id: 'factions',
			title: 'Добавить раздел: Фракции',
			description:
				'Определите основные группировки и их взаимоотношения в мире, вы можете описать подробно, либо оставить на усмотрение генератора',
			enabledFieldName: 'factionsEnabled',
			fields: [
				{
					name: 'factionsCount',
					type: 'input',
					label: 'Количество фракций',
					inputType: 'number',
					fullWidth: true,
					placeholder: '3',
					canGenerate: true,
				},
				{
					name: 'factionsDescription',
					type: 'textarea',
					label: 'Описание фракций',
					rows: 4,
					fullWidth: true,
					placeholder: 'Опишите основные фракции и их взаимоотношения...',
					canGenerate: true,
				},
			],
		},
		{
			id: 'locations',
			title: 'Добавить раздел: Локации',
			description:
				'Определите основные локации, точки интереса, города, страны, вы можете описать подробно, либо оставить на усмотрение генератора',
			enabledFieldName: 'locationsEnabled',
			fields: [
				{
					name: 'locationsCount',
					type: 'input',
					label: 'Количество локаций',
					inputType: 'number',
					fullWidth: true,
					placeholder: '3',
				},
				{
					name: 'locationsDescription',
					type: 'textarea',
					label: 'Описание локаций',
					rows: 4,
					fullWidth: true,
					placeholder: 'Опишите основные локации, точки интереса, города, страны...',
					canGenerate: true,
				},
			],
		},
	],
};

export const CustomizationAdvancedForm: React.FC<CustomizationAdvancedFormProps> = ({
	defaultValues,
	onSubmit,
	generateHandlers,
	formConfig = DEFAULT_FORM_CONFIG,
}) => {
	const { control, handleSubmit, watch } = useForm<CustomizationAdvancedData>({
		defaultValues: {
			magicEnabled: false,
			factionsEnabled: false,
			charactersEnabled: false,
			...defaultValues,
		},
	});

	// Динамически создаем watch для всех enabled полей
	const watchedValues = formConfig.sections.reduce((acc, section) => {
		acc[section.enabledFieldName] = watch(section.enabledFieldName as keyof CustomizationAdvancedData) as boolean;
		return acc;
	}, {} as Record<string, boolean>);

	const submit = (data: CustomizationAdvancedData) => {
		onSubmit(data);
	};

	return (
		<Box component="form" onSubmit={handleSubmit(submit)}>
			<Stack spacing={3}>
				{/* Динамически генерируем секции на основе конфигурации */}
				{formConfig.sections.map((section) => (
					<FormSection
						key={section.id}
						section={section}
						control={control}
						isExpanded={watchedValues[section.enabledFieldName] || false}
						generateHandlers={generateHandlers}
					/>
				))}
			</Stack>
		</Box>
	);
};
