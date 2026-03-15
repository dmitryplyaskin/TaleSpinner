import { Button, Group, Paper, Select, Stack, Text } from '@mantine/core';
import React, { useEffect } from 'react';
import { Controller, useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormCheckbox, FormInput, FormNumberInput, FormSelect } from '@ui/form-components';

import type { ArtifactExposure } from '@shared/types/operation-profiles';

const formatOptions = ['text', 'markdown', 'json'] as const;

const persistenceOptions = ['persisted', 'run_only'] as const;

const writeModeOptions = ['replace', 'append'] as const;

const promptPartModeOptions = ['prepend', 'append', 'replace'] as const;

const exposureTypeOptions = [
	{ value: 'prompt_part', label: 'operationProfiles.exposureType.promptPart' },
	{ value: 'prompt_message', label: 'operationProfiles.exposureType.promptMessage' },
	{ value: 'turn_rewrite', label: 'operationProfiles.exposureType.turnRewrite' },
	{ value: 'ui_inline', label: 'operationProfiles.exposureType.uiInline' },
];

const roleOptions = ['system', 'user', 'assistant'] as const;

const anchorOptions = [
	{ value: 'after_last_user', key: 'operationProfiles.anchor.afterLastUser' },
	{ value: 'depth_from_end', key: 'operationProfiles.anchor.depthFromEnd' },
];

const targetOptions = [
	{ value: 'current_user_main', key: 'operationProfiles.rewriteTarget.currentUserMain' },
	{ value: 'assistant_output_main', key: 'operationProfiles.rewriteTarget.assistantOutputMain' },
];

function makeDefaultExposure(type: ArtifactExposure['type']): ArtifactExposure {
	if (type === 'prompt_part') {
		return { type, target: 'system', mode: 'append' };
	}
	if (type === 'prompt_message') {
		return { type, role: 'system', anchor: 'after_last_user' };
	}
	if (type === 'turn_rewrite') {
		return { type, target: 'current_user_main', mode: 'replace' };
	}
	return { type: 'ui_inline', role: 'assistant', anchor: 'after_last_user' };
}

function getExposureCardTitle(t: (key: string) => string, exposure: ArtifactExposure): string {
	if (exposure.type === 'prompt_part') return t('operationProfiles.exposureType.promptPart');
	if (exposure.type === 'prompt_message') return t('operationProfiles.exposureType.promptMessage');
	if (exposure.type === 'turn_rewrite') return t('operationProfiles.exposureType.turnRewrite');
	return t('operationProfiles.exposureType.uiInline');
}

type Props = {
	index: number;
};

export const OutputSection: React.FC<Props> = ({ index }) => {
	const { t } = useTranslation();
	const { control, setValue } = useFormContext();
	const translatedAnchorOptions = anchorOptions.map((option) => ({ value: option.value, label: t(option.key) }));
	const translatedTargetOptions = targetOptions.map((option) => ({ value: option.value, label: t(option.key) }));
	const artifact = useWatch({ control, name: `operations.${index}.config.params.artifact` }) as
		| {
				artifactId?: string;
				exposures?: ArtifactExposure[];
				format?: 'text' | 'markdown' | 'json';
		  }
		| undefined;
	const kindValue = useWatch({ control, name: `operations.${index}.kind` }) as unknown;
	const isGuardKind = kindValue === 'guard';

	const exposuresArray = useFieldArray({
		control,
		name: `operations.${index}.config.params.artifact.exposures`,
	});

	useEffect(() => {
		if (!isGuardKind || artifact?.format === 'json') return;
		setValue(`operations.${index}.config.params.artifact.format`, 'json', { shouldDirty: true });
	}, [artifact?.format, index, isGuardKind, setValue]);

	return (
		<Stack gap="md">
			<Stack gap="xs">
				<Text size="sm" c="dimmed">
					{t('operationProfiles.outputNotes.artifactModel')}
				</Text>
				<Text size="sm" c="dimmed">
					{t('operationProfiles.outputNotes.referenceByTag')}
				</Text>
				<Text size="xs" c="dimmed">
					{t('operationProfiles.sectionsLabels.artifactId')}: {artifact?.artifactId ?? '-'}
				</Text>
			</Stack>

			<Group grow wrap="wrap">
				<FormInput
					name={`operations.${index}.config.params.artifact.tag`}
					label={t('operationProfiles.sectionsLabels.tag')}
					infoTip={t('operationProfiles.tooltips.tag')}
				/>
				<FormInput
					name={`operations.${index}.config.params.artifact.title`}
					label={t('operationProfiles.sectionsLabels.artifactTitle')}
					infoTip={t('operationProfiles.tooltips.artifactTitle')}
				/>
				<FormSelect
					name={`operations.${index}.config.params.artifact.format`}
					label={t('operationProfiles.sectionsLabels.format')}
					infoTip={t('operationProfiles.tooltips.format')}
					selectProps={{
						options: (isGuardKind ? ['json'] : formatOptions).map((value) => ({
							value,
							label: t(`operationProfiles.valueLabel.${value}`),
						})),
						comboboxProps: { withinPortal: false },
						disabled: isGuardKind,
					}}
				/>
			</Group>

			<Group grow wrap="wrap">
				<FormSelect
					name={`operations.${index}.config.params.artifact.persistence`}
					label={t('operationProfiles.sectionsLabels.persistence')}
					infoTip={t('operationProfiles.tooltips.persistence')}
					selectProps={{ options: persistenceOptions.map((value) => ({ value, label: t(`operationProfiles.valueLabel.${value}`) })), comboboxProps: { withinPortal: false } }}
				/>
				<FormSelect
					name={`operations.${index}.config.params.artifact.writeMode`}
					label={t('operationProfiles.sectionsLabels.writeMode')}
					infoTip={t('operationProfiles.tooltips.writeMode')}
					selectProps={{ options: writeModeOptions.map((value) => ({ value, label: t(`operationProfiles.valueLabel.${value}`) })), comboboxProps: { withinPortal: false } }}
				/>
			</Group>

			<Group grow wrap="wrap">
				<FormInput
					name={`operations.${index}.config.params.artifact.semantics`}
					label={t('operationProfiles.sectionsLabels.semantics')}
					infoTip={t('operationProfiles.tooltips.semantics')}
				/>
				<FormNumberInput
					name={`operations.${index}.config.params.artifact.history.maxItems`}
					label={t('operationProfiles.sectionsLabels.historyMaxItems')}
					infoTip={t('operationProfiles.tooltips.historyMaxItems')}
					numberInputProps={{ min: 1, step: 1 }}
				/>
			</Group>

			<FormCheckbox
				name={`operations.${index}.config.params.artifact.history.enabled`}
				label={t('operationProfiles.sectionsLabels.historyEnabled')}
			/>

			<FormInput
				name={`operations.${index}.config.params.artifact.description`}
				label={t('operationProfiles.sectionsLabels.artifactDescription')}
				infoTip={t('operationProfiles.tooltips.artifactDescription')}
			/>

			<Stack gap="xs">
				<Group justify="space-between" align="center">
					<Text fw={600}>{t('operationProfiles.sectionsLabels.exposures')}</Text>
					<Group gap="xs">
						{exposureTypeOptions.map((option) => (
							<Button
								key={option.value}
								size="xs"
								variant="light"
								onClick={() => exposuresArray.append(makeDefaultExposure(option.value as ArtifactExposure['type']))}
							>
								{t(option.label)}
							</Button>
						))}
					</Group>
				</Group>

				{exposuresArray.fields.length === 0 && (
					<Text size="sm" c="dimmed">
						{t('operationProfiles.outputNotes.noExposures')}
					</Text>
				)}

				{exposuresArray.fields.map((field, exposureIndex) => {
					const exposure = (artifact?.exposures?.[exposureIndex] ?? field) as ArtifactExposure;
					return (
						<Paper key={field.id} withBorder p="sm">
							<Stack gap="xs">
								<Group justify="space-between" align="center">
									<Text fw={600}>{getExposureCardTitle(t, exposure)}</Text>
									<Button size="xs" color="red" variant="subtle" onClick={() => exposuresArray.remove(exposureIndex)}>
										{t('common.delete')}
									</Button>
								</Group>
								<Controller
									control={control}
									name={`operations.${index}.config.params.artifact.exposures.${exposureIndex}.type`}
									render={({ field: typeField }) => (
										<Select
											label={t('operationProfiles.sectionsLabels.exposureType')}
											data={exposureTypeOptions.map((option) => ({
												value: option.value,
												label: t(option.label),
											}))}
											value={typeof typeField.value === 'string' ? typeField.value : exposure.type}
											onChange={(next) => {
												if (!next) return;
												setValue(
													`operations.${index}.config.params.artifact.exposures.${exposureIndex}`,
													makeDefaultExposure(next as ArtifactExposure['type']),
													{ shouldDirty: true },
												);
											}}
											comboboxProps={{ withinPortal: false }}
										/>
									)}
								/>

								{exposure.type === 'prompt_part' && (
									<Group grow wrap="wrap">
										<FormSelect
											name={`operations.${index}.config.params.artifact.exposures.${exposureIndex}.mode`}
											label={t('operationProfiles.sectionsLabels.mode')}
											selectProps={{
												options: promptPartModeOptions.map((value) => ({ value, label: t(`operationProfiles.valueLabel.${value}`) })),
												comboboxProps: { withinPortal: false },
											}}
										/>
									</Group>
								)}

								{(exposure.type === 'prompt_message' || exposure.type === 'ui_inline') && (
									<>
										<Group grow wrap="wrap">
											<FormSelect
												name={`operations.${index}.config.params.artifact.exposures.${exposureIndex}.role`}
												label={t('operationProfiles.sectionsLabels.role')}
												selectProps={{ options: roleOptions.map((value) => ({ value, label: t(`operationProfiles.valueLabel.${value}`) })), comboboxProps: { withinPortal: false } }}
											/>
											<FormSelect
												name={`operations.${index}.config.params.artifact.exposures.${exposureIndex}.anchor`}
												label={t('operationProfiles.sectionsLabels.anchor')}
												selectProps={{ options: translatedAnchorOptions, comboboxProps: { withinPortal: false } }}
											/>
										</Group>
										<Group grow wrap="wrap">
										<FormInput
											name={`operations.${index}.config.params.artifact.exposures.${exposureIndex}.source`}
											label={t('operationProfiles.sectionsLabels.sourceOptional')}
										/>
											{exposure.anchor === 'depth_from_end' && (
												<FormNumberInput
													name={`operations.${index}.config.params.artifact.exposures.${exposureIndex}.depthFromEnd`}
													label={t('operationProfiles.sectionsLabels.depthFromEnd')}
													numberInputProps={{ min: 0, step: 1 }}
												/>
											)}
										</Group>
									</>
								)}

								{exposure.type === 'turn_rewrite' && (
									<Group grow wrap="wrap">
										<FormSelect
											name={`operations.${index}.config.params.artifact.exposures.${exposureIndex}.target`}
											label={t('operationProfiles.sectionsLabels.target')}
											selectProps={{ options: translatedTargetOptions, comboboxProps: { withinPortal: false } }}
										/>
										<FormSelect
											name={`operations.${index}.config.params.artifact.exposures.${exposureIndex}.mode`}
											label={t('operationProfiles.sectionsLabels.mode')}
											selectProps={{
												options: [{ value: 'replace', label: t('operationProfiles.valueLabel.replace') }],
												disabled: true,
												comboboxProps: { withinPortal: false },
											}}
										/>
									</Group>
								)}
							</Stack>
						</Paper>
					);
				})}
			</Stack>
		</Stack>
	);
};


