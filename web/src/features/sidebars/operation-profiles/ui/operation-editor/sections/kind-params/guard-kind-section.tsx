import { Button, Divider, Group, Paper, Stack, Text } from '@mantine/core';
import React from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormCheckbox, FormInput, FormMultiSelect, FormNumberInput, FormSelect, FormTextarea } from '@ui/form-components';

import { makeDefaultGuardOutputDefinition } from '../../../../form/guard-kind-form';

import { OperationLlmConfigControls } from './shared/operation-llm-config-controls';

import type { OperationProfileFormValues } from '../../../../form/operation-profile-form-mapping';

type Props = {
	index: number;
};

const RETRY_ON_OPTIONS = [
	{ value: 'timeout', labelKey: 'operationProfiles.kindSection.llm.retryOn.timeout' },
	{ value: 'provider_error', labelKey: 'operationProfiles.kindSection.llm.retryOn.providerError' },
	{ value: 'rate_limit', labelKey: 'operationProfiles.kindSection.llm.retryOn.rateLimit' },
] as const;

export const GuardKindSection: React.FC<Props> = ({ index }) => {
	const { t } = useTranslation();
	const { control } = useFormContext<OperationProfileFormValues>();
	const outputContractArray = useFieldArray({
		control,
		name: `operations.${index}.config.params.outputContract`,
		keyName: '_key',
	});
	const enginePath = `operations.${index}.config.params.engine` as const;
	const retryPath = `operations.${index}.config.params.retry.retryOn` as const;
	const engine = useWatch({ control, name: enginePath }) as unknown;
	const resolvedEngine = engine === 'aux_llm' ? 'aux_llm' : 'liquid';

	return (
		<Stack gap="md">
			<Text size="sm" c="dimmed">
				{t('operationProfiles.kindSection.guard.description')}
			</Text>

			<FormSelect
				name={enginePath}
				label={t('operationProfiles.kindSection.guard.engine')}
				infoTip={t('operationProfiles.kindSection.guard.engineInfo')}
				selectProps={{
					options: [
						{ value: 'liquid', label: t('operationProfiles.kindSection.guard.engineLiquid') },
						{ value: 'aux_llm', label: t('operationProfiles.kindSection.guard.engineAuxLlm') },
					],
					comboboxProps: { withinPortal: false },
				}}
			/>

			<Stack gap="xs">
				<Group justify="space-between" align="center">
					<Text fw={600}>{t('operationProfiles.kindSection.guard.outputContract')}</Text>
					<Button
						size="xs"
						variant="light"
						onClick={() => outputContractArray.append(makeDefaultGuardOutputDefinition(outputContractArray.fields.length))}
					>
						{t('common.add')}
					</Button>
				</Group>
				<Text size="xs" c="dimmed">
					{t('operationProfiles.kindSection.guard.outputContractInfo')}
				</Text>

				{outputContractArray.fields.length === 0 ? (
					<Text size="sm" c="dimmed">
						{t('operationProfiles.kindSection.guard.outputContractEmpty')}
					</Text>
				) : (
					outputContractArray.fields.map((field, outputIndex) => (
						<Paper key={field._key} withBorder p="sm">
							<Stack gap="xs">
								<Group justify="space-between" align="center">
									<Text fw={600}>{t('operationProfiles.kindSection.guard.outputLabel', { index: outputIndex + 1 })}</Text>
									<Button size="xs" color="red" variant="subtle" onClick={() => outputContractArray.remove(outputIndex)}>
										{t('common.delete')}
									</Button>
								</Group>
								<Group grow wrap="wrap">
									<FormInput
										name={`operations.${index}.config.params.outputContract.${outputIndex}.key`}
										label={t('operationProfiles.kindSection.guard.outputKey')}
										infoTip={t('operationProfiles.kindSection.guard.outputKeyInfo')}
									/>
									<FormInput
										name={`operations.${index}.config.params.outputContract.${outputIndex}.title`}
										label={t('operationProfiles.kindSection.guard.outputTitle')}
									/>
								</Group>
								<FormInput
									name={`operations.${index}.config.params.outputContract.${outputIndex}.description`}
									label={t('operationProfiles.kindSection.guard.outputDescription')}
								/>
							</Stack>
						</Paper>
					))
				)}
			</Stack>

			<Divider />

			<FormCheckbox
				name={`operations.${index}.config.params.strictVariables`}
				label={t('operationProfiles.kindSection.guard.strictVariables')}
				infoTip={t('operationProfiles.kindSection.guard.strictVariablesInfo')}
			/>

			{resolvedEngine === 'liquid' ? (
				<FormTextarea
					name={`operations.${index}.config.params.template`}
					label={t('operationProfiles.kindSection.guard.template')}
					infoTip={t('operationProfiles.kindSection.guard.templateInfo')}
					liquidDocsContext="operation_template"
					textareaProps={{ minRows: 10, maxRows: 22, autosize: false }}
				/>
			) : (
				<Stack gap="xs">
					<FormTextarea
						name={`operations.${index}.config.params.system`}
						label={t('operationProfiles.kindSection.guard.system')}
						infoTip={t('operationProfiles.kindSection.guard.systemInfo')}
						liquidDocsContext="operation_llm"
						textareaProps={{ minRows: 4, maxRows: 12, autosize: false }}
					/>
					<FormTextarea
						name={`operations.${index}.config.params.prompt`}
						label={t('operationProfiles.kindSection.guard.prompt')}
						infoTip={t('operationProfiles.kindSection.guard.promptInfo')}
						liquidDocsContext="operation_llm"
						textareaProps={{ minRows: 8, maxRows: 20, autosize: false }}
					/>

					<OperationLlmConfigControls index={index} />

					<FormNumberInput
						name={`operations.${index}.config.params.timeoutMs`}
						label={t('operationProfiles.kindSection.guard.timeoutMs')}
						numberInputProps={{ min: 1, step: 1000 }}
					/>
					<Group grow wrap="wrap">
						<FormNumberInput
							name={`operations.${index}.config.params.retry.maxAttempts`}
							label={t('operationProfiles.kindSection.guard.retryMaxAttempts')}
							numberInputProps={{ min: 1, max: 10, step: 1 }}
						/>
						<FormNumberInput
							name={`operations.${index}.config.params.retry.backoffMs`}
							label={t('operationProfiles.kindSection.guard.retryBackoffMs')}
							numberInputProps={{ min: 0, step: 100 }}
						/>
					</Group>
					<FormMultiSelect
						name={retryPath}
						label={t('operationProfiles.kindSection.guard.retryOn')}
						infoTip={t('operationProfiles.kindSection.guard.retryOnInfo')}
						multiSelectProps={{
							options: RETRY_ON_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) })),
							comboboxProps: { withinPortal: false },
						}}
					/>
				</Stack>
			)}
		</Stack>
	);
};
