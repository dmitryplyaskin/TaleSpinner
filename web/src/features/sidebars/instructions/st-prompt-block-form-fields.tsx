import { Group, NumberInput, Select, TextInput, Textarea } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import type { PromptBlockFields } from './st-prompt-blocks';

function toNonNegativeInteger(value: string | number | undefined, fallback: number): number {
	if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
		return Math.floor(value);
	}
	return fallback;
}

type StPromptBlockFormFieldsProps = {
	value: PromptBlockFields;
	contentReadOnly?: boolean;
	onChange: (patch: Partial<PromptBlockFields>) => void;
};

export function StPromptBlockFormFields({
	value,
	contentReadOnly = false,
	onChange,
}: StPromptBlockFormFieldsProps) {
	const { t } = useTranslation();

	return (
		<>
			<Group grow align="flex-start">
				<TextInput
					label={t('instructions.fields.promptName')}
					value={value.name}
					onChange={(event) => onChange({ name: event.currentTarget.value })}
					placeholder={t('instructions.placeholders.promptName')}
				/>
				<Select
					label={t('instructions.fields.promptRole')}
					value={value.role}
					onChange={(nextRole) =>
						onChange({
							role: (nextRole as PromptBlockFields['role'] | null) ?? 'system',
						})
					}
					data={[
						{ value: 'system', label: 'system' },
						{ value: 'user', label: 'user' },
						{ value: 'assistant', label: 'assistant' },
					]}
					allowDeselect={false}
				/>
			</Group>

			<Group grow align="flex-start">
				<Select
					label={t('instructions.fields.promptPosition')}
					description={t('instructions.fields.promptPositionDescription')}
					value={String(value.injectionPosition)}
					onChange={(nextPosition) =>
						onChange({
							injectionPosition: (Number(nextPosition) === 1 ? 1 : 0) as PromptBlockFields['injectionPosition'],
						})
					}
					data={[
						{ value: '0', label: t('instructions.fields.promptPositionRelative') },
						{ value: '1', label: t('instructions.fields.promptPositionInChat') },
					]}
					allowDeselect={false}
				/>
				{value.injectionPosition === 1 ? (
					<NumberInput
						label={t('instructions.fields.promptDepth')}
						description={t('instructions.fields.promptDepthDescription')}
						min={0}
						value={value.injectionDepth}
						onChange={(nextValue) => onChange({ injectionDepth: toNonNegativeInteger(nextValue, value.injectionDepth) })}
					/>
				) : null}
			</Group>

			{value.injectionPosition === 1 ? (
				<NumberInput
					label={t('instructions.fields.promptOrder')}
					description={t('instructions.fields.promptOrderDescription')}
					min={0}
					value={value.injectionOrder}
					onChange={(nextValue) => onChange({ injectionOrder: toNonNegativeInteger(nextValue, value.injectionOrder) })}
				/>
			) : null}

			<Textarea
				label={t('instructions.fields.promptContent')}
				value={value.content}
				onChange={(event) => onChange({ content: event.currentTarget.value })}
				placeholder={t('instructions.placeholders.promptBlockContent')}
				minRows={12}
				autosize
				readOnly={contentReadOnly}
				styles={{ input: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' } }}
			/>
		</>
	);
}
