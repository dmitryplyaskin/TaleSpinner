import { Group, Select, TextInput, Textarea } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import type { PromptBlockFields } from './st-prompt-blocks';

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
