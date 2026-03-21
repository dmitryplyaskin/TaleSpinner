import { Stack, Text } from '@mantine/core';
import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormCheckbox, FormInput, FormSelect, FormTextarea } from '@ui/form-components';

import type { KnowledgeOperationKind } from '../../../../form/knowledge-kind-form';
import type { OperationProfileFormValues } from '../../../../form/operation-profile-form-mapping';

type Props = {
	index: number;
	kind: KnowledgeOperationKind;
};

export const KnowledgeKindFields: React.FC<Props> = ({ index, kind }) => {
	const { t } = useTranslation();
	const { control } = useFormContext<OperationProfileFormValues>();
	const sourceMode = useWatch({
		control,
		name: `operations.${index}.config.params.sourceMode`,
	}) as unknown;
	const normalizedSourceMode = sourceMode === 'artifact' ? 'artifact' : 'inline';

	return (
		<Stack gap="xs">
			<Text size="sm" c="dimmed">
				{t(`operationProfiles.kindSection.${kind}.description`)}
			</Text>

			<FormSelect
				name={`operations.${index}.config.params.sourceMode`}
				label={t('operationProfiles.kindSection.knowledge.sourceMode')}
				infoTip={t('operationProfiles.kindSection.knowledge.sourceModeInfo')}
				selectProps={{
					options: [
						{
							value: 'inline',
							label: t('operationProfiles.kindSection.knowledge.sourceModeInline'),
						},
						{
							value: 'artifact',
							label: t('operationProfiles.kindSection.knowledge.sourceModeArtifact'),
						},
					],
					comboboxProps: { withinPortal: false },
				}}
			/>

			{normalizedSourceMode === 'inline' ? (
				<>
					<FormCheckbox
						name={`operations.${index}.config.params.strictVariables`}
						label={t('operationProfiles.kindSection.knowledge.strictVariables')}
						infoTip={t('operationProfiles.kindSection.knowledge.strictVariablesInfo')}
					/>
					<FormTextarea
						name={`operations.${index}.config.params.requestTemplate`}
						label={t(`operationProfiles.kindSection.${kind}.requestTemplate`)}
						infoTip={t('operationProfiles.kindSection.knowledge.requestTemplateInfo')}
						liquidDocsContext="operation_template"
						textareaProps={{ minRows: 8, maxRows: 20, autosize: false }}
					/>
				</>
			) : (
				<FormInput
					name={`operations.${index}.config.params.artifactTag`}
					label={t('operationProfiles.kindSection.knowledge.artifactTag')}
					infoTip={t('operationProfiles.kindSection.knowledge.artifactTagInfo')}
				/>
			)}
		</Stack>
	);
};
