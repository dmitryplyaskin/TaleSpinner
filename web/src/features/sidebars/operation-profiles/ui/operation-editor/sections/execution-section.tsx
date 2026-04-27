import { Button, Group, Paper, Stack, Text } from '@mantine/core';
import React, { useMemo } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormMultiSelect, FormNumberInput, FormSelect } from '@ui/form-components';

import { readGuardOutputContract } from '../../../form/guard-kind-form';

import type { OperationProfileFormValues } from '../../../form/operation-profile-form-mapping';

const hookOptions = [
	{ value: 'before_main_llm', label: 'before_main_llm' },
	{ value: 'after_main_llm', label: 'after_main_llm' },
];

const triggerOptions = [
	{ value: 'generate', label: 'generate' },
	{ value: 'regenerate', label: 'regenerate' },
];

type Props = {
	index: number;
};

export const ExecutionSection: React.FC<Props> = ({ index }) => {
	const { t } = useTranslation();
	const { control } = useFormContext<OperationProfileFormValues>();
	const { fields } = useFieldArray({
		control,
		name: 'operations',
		keyName: '_key',
	});
	const runConditionsArray = useFieldArray({
		control,
		name: `operations.${index}.config.runConditions`,
		keyName: '_key',
	});

	const operationMetaPaths = useMemo(
		() =>
			fields.flatMap((_, idx) => [
				`operations.${idx}.name`,
				`operations.${idx}.kind`,
				`operations.${idx}.opId`,
				`operations.${idx}.config.params.outputContract`,
			]),
		[fields],
	);
	const watchedOperationMeta = useWatch({ control, name: operationMetaPaths as any }) as unknown[] | undefined;
	const runConditionSourcePaths = useMemo(
		() => runConditionsArray.fields.map((_, conditionIndex) => `operations.${index}.config.runConditions.${conditionIndex}.sourceOpId`),
		[index, runConditionsArray.fields],
	);
	const watchedRunConditionSources = useWatch({ control, name: runConditionSourcePaths as any }) as unknown[] | undefined;

	const depOptions = useMemo(() => {
		return fields
			.map((_field, idx) => {
				const opId = typeof watchedOperationMeta?.[idx * 4 + 2] === 'string' ? watchedOperationMeta[idx * 4 + 2] : '';
				if (!opId) return null;
				const nameValue = watchedOperationMeta?.[idx * 4];
				const name = typeof nameValue === 'string' ? nameValue : '';
				return { value: opId, label: name.trim() ? `${name} — ${opId}` : opId };
			})
			.filter((option): option is { value: string; label: string } => option !== null);
	}, [fields, watchedOperationMeta]);

	const selfId = typeof watchedOperationMeta?.[index * 4 + 2] === 'string' ? watchedOperationMeta[index * 4 + 2] : '';
	const guardOptions = useMemo(() => {
		return fields
			.map((_, operationIndex) => {
				const nameValue = watchedOperationMeta?.[operationIndex * 4];
				const kindValue = watchedOperationMeta?.[operationIndex * 4 + 1];
				const opIdValue = watchedOperationMeta?.[operationIndex * 4 + 2];
				const opId = typeof opIdValue === 'string' ? opIdValue : '';
				if (!opId || opId === selfId || kindValue !== 'guard') return null;
				const name = typeof nameValue === 'string' ? nameValue : '';
				return {
					value: opId,
					label: name.trim() ? `${name} — ${opId}` : opId,
				};
			})
			.filter((option): option is { value: string; label: string } => option !== null);
	}, [fields, selfId, watchedOperationMeta]);

	return (
		<Stack gap="xs">
			<Group grow wrap="wrap">
				<FormSelect
					name={`operations.${index}.config.hooks.0`}
					label={t('operationProfiles.sectionsLabels.hook')}
					infoTip={t('operationProfiles.tooltips.hook')}
					selectProps={{
						options: hookOptions,
						comboboxProps: { withinPortal: false },
					}}
				/>
				<FormMultiSelect
					name={`operations.${index}.config.triggers`}
					label={t('operationProfiles.sectionsLabels.triggers')}
					infoTip={t('operationProfiles.tooltips.triggers')}
					multiSelectProps={{
						options: triggerOptions,
						comboboxProps: { withinPortal: false },
					}}
				/>
			</Group>

			<Group grow wrap="wrap">
				<FormNumberInput
					name={`operations.${index}.config.order`}
					label={t('operationProfiles.sectionsLabels.order')}
					infoTip={t('operationProfiles.tooltips.order')}
					numberInputProps={{ min: 0 }}
				/>
				<FormMultiSelect
					name={`operations.${index}.config.dependsOn`}
					label={t('operationProfiles.sectionsLabels.dependsOn')}
					infoTip={t('operationProfiles.tooltips.dependsOn')}
					multiSelectProps={{
						options: depOptions.filter((o) => o.value !== selfId),
						comboboxProps: { withinPortal: false },
						placeholder: t('operationProfiles.placeholders.none'),
						searchable: true,
					}}
				/>
			</Group>

			<Group grow wrap="wrap">
				<FormNumberInput
					name={`operations.${index}.config.activation.everyNTurns`}
					label={t('operationProfiles.sectionsLabels.activationEveryNTurns')}
					infoTip={t('operationProfiles.tooltips.activationEveryNTurns')}
					numberInputProps={{ min: 0 }}
				/>
				<FormNumberInput
					name={`operations.${index}.config.activation.everyNContextTokens`}
					label={t('operationProfiles.sectionsLabels.activationEveryNContextTokens')}
					infoTip={t('operationProfiles.tooltips.activationEveryNContextTokens')}
					numberInputProps={{ min: 0, step: 100 }}
				/>
			</Group>

			<Text size="xs" c="dimmed">
				{t('operationProfiles.execution.activationRule')}
			</Text>

			<Paper withBorder p="sm">
				<Stack gap="xs">
					<Group justify="space-between" align="center">
						<Text fw={600}>{t('operationProfiles.execution.runConditions')}</Text>
						<Button
							size="xs"
							variant="light"
							onClick={() =>
								runConditionsArray.append({
									type: 'guard_output',
									sourceOpId: '',
									outputKey: '',
									operator: 'is_true',
								})
							}
						>
							{t('common.add')}
						</Button>
					</Group>

					<Text size="xs" c="dimmed">
						{t('operationProfiles.execution.runConditionsInfo')}
					</Text>

					{runConditionsArray.fields.length === 0 ? (
						<Text size="sm" c="dimmed">
							{t('operationProfiles.execution.runConditionsEmpty')}
						</Text>
					) : (
						runConditionsArray.fields.map((conditionField, conditionIndex) => {
							const selectedSourceId =
								typeof watchedRunConditionSources?.[conditionIndex] === 'string'
									? watchedRunConditionSources[conditionIndex]
									: '';
							const sourceIndex = fields.findIndex((operationField, operationIndex) => {
								const opIdValue = watchedOperationMeta?.[operationIndex * 4 + 2];
								return typeof opIdValue === 'string' && opIdValue === selectedSourceId && operationField.opId;
							});
							const outputOptions = readGuardOutputContract({
								outputContract: sourceIndex >= 0 ? watchedOperationMeta?.[sourceIndex * 4 + 3] : [],
							}).map((output) => ({
								value: output.key,
								label: output.title || output.key,
							}));

							return (
								<Paper key={conditionField._key} withBorder p="sm">
									<Stack gap="xs">
										<Group justify="space-between" align="center">
											<Text fw={600}>{t('operationProfiles.execution.runConditionLabel', { index: conditionIndex + 1 })}</Text>
											<Button
												size="xs"
												color="red"
												variant="subtle"
												onClick={() => runConditionsArray.remove(conditionIndex)}
											>
												{t('common.delete')}
											</Button>
										</Group>

										<Group grow wrap="wrap">
											<FormSelect
												name={`operations.${index}.config.runConditions.${conditionIndex}.sourceOpId`}
												label={t('operationProfiles.execution.conditionSource')}
												selectProps={{
													options: guardOptions,
													comboboxProps: { withinPortal: false },
													searchable: true,
												}}
											/>
											<FormSelect
												name={`operations.${index}.config.runConditions.${conditionIndex}.outputKey`}
												label={t('operationProfiles.execution.conditionOutput')}
												selectProps={{
													options: outputOptions,
													comboboxProps: { withinPortal: false },
												}}
											/>
											<FormSelect
												name={`operations.${index}.config.runConditions.${conditionIndex}.operator`}
												label={t('operationProfiles.execution.conditionOperator')}
												selectProps={{
													options: [
														{ value: 'is_true', label: t('operationProfiles.execution.operatorIsTrue') },
														{ value: 'is_false', label: t('operationProfiles.execution.operatorIsFalse') },
													],
													comboboxProps: { withinPortal: false },
												}}
											/>
										</Group>
									</Stack>
								</Paper>
							);
						})
					)}
				</Stack>
			</Paper>
		</Stack>
	);
};

