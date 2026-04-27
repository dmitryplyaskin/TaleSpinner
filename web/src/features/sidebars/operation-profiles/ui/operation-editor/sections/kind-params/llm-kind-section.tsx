import { Button, Divider, Stack, Text } from '@mantine/core';
import React, { useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Dialog } from '@ui/dialog';
import { FormCheckbox, FormInput, FormMultiSelect, FormNumberInput, FormSelect, FormTextarea } from '@ui/form-components';

import { OperationLlmConfigControls } from './shared/operation-llm-config-controls';

type Props = {
	index: number;
};

const RETRY_ON_OPTIONS = [
	{ value: 'timeout', labelKey: 'operationProfiles.kindSection.llm.retryOn.timeout' },
	{ value: 'provider_error', labelKey: 'operationProfiles.kindSection.llm.retryOn.providerError' },
	{ value: 'rate_limit', labelKey: 'operationProfiles.kindSection.llm.retryOn.rateLimit' },
] as const;

const JSON_SCHEMA_EXAMPLE = `{
  "report_id": "string: Unique report identifier",
  "created_at": "string: ISO timestamp",
  "status": "string: Processing status",
  "confidence?": "number: Optional confidence score from 0 to 1"
}`;

export const LlmKindSection: React.FC<Props> = ({ index }) => {
	const { t } = useTranslation();
	const { control } = useFormContext();
	const [isSchemaHelpOpen, setSchemaHelpOpen] = useState(false);
	const outputModePath = `operations.${index}.config.params.outputMode` as const;
	const jsonParseModePath = `operations.${index}.config.params.jsonParseMode` as const;
	const jsonCustomPatternPath = `operations.${index}.config.params.jsonCustomPattern` as const;
	const jsonCustomFlagsPath = `operations.${index}.config.params.jsonCustomFlags` as const;
	const strictSchemaValidationPath = `operations.${index}.config.params.strictSchemaValidation` as const;
	const jsonSchemaTextPath = `operations.${index}.config.params.jsonSchemaText` as const;
	const retryPath = `operations.${index}.config.params.retry.retryOn` as const;

	const rawOutputMode = useWatch({ control, name: outputModePath }) as unknown;
	const outputMode = rawOutputMode === 'json' ? 'json' : 'text';
	const rawJsonParseMode = useWatch({ control, name: jsonParseModePath }) as unknown;
	const jsonParseMode =
		rawJsonParseMode === 'markdown_code_block' || rawJsonParseMode === 'custom_regex' ? rawJsonParseMode : 'raw';

	const retryOnOptions = RETRY_ON_OPTIONS.map((item) => ({ value: item.value, label: t(item.labelKey) }));
	const parseModeInfoContent = (
		<Stack gap={4}>
			<Text size="xs">{t('operationProfiles.kindSection.llm.jsonParseModeInfo')}</Text>
			<Text size="xs">`raw`: {t('operationProfiles.kindSection.llm.jsonParseModeHintRaw')}</Text>
			<Text size="xs">`markdown_code_block`: {t('operationProfiles.kindSection.llm.jsonParseModeHintMarkdownCodeBlock')}</Text>
			<Text size="xs">`custom_regex`: {t('operationProfiles.kindSection.llm.jsonParseModeHintCustomRegex')}</Text>
		</Stack>
	);

	return (
		<Stack gap="md">
			<Text size="sm" c="dimmed">
				{t('operationProfiles.kindSection.llm.description')}
			</Text>

			<Stack gap="xs">
				<Text fw={600}>{t('operationProfiles.kindSection.llm.blocks.prompt')}</Text>
				<FormCheckbox
					name={`operations.${index}.config.params.strictVariables`}
					label={t('operationProfiles.kindSection.llm.strictVariables')}
					infoTip={t('operationProfiles.kindSection.llm.strictVariablesInfo')}
				/>
				<FormTextarea
					name={`operations.${index}.config.params.system`}
					label={t('operationProfiles.kindSection.llm.system')}
					infoTip={t('operationProfiles.kindSection.llm.systemInfo')}
					liquidDocsContext="operation_llm"
					textareaProps={{ minRows: 4, maxRows: 12, autosize: false }}
				/>
				<FormTextarea
					name={`operations.${index}.config.params.prompt`}
					label={t('operationProfiles.kindSection.llm.prompt')}
					infoTip={t('operationProfiles.kindSection.llm.promptInfo')}
					liquidDocsContext="operation_llm"
					textareaProps={{ minRows: 8, maxRows: 20, autosize: false }}
				/>
			</Stack>

			<Divider />

			<OperationLlmConfigControls index={index} />

			<Divider />

			<Stack gap="xs">
				<Text fw={600}>{t('operationProfiles.kindSection.llm.blocks.reliability')}</Text>
				<FormSelect
					name={outputModePath}
					label={t('operationProfiles.kindSection.llm.outputMode')}
					infoTip={t('operationProfiles.kindSection.llm.outputModeInfo')}
					selectProps={{
						comboboxProps: { withinPortal: false },
						options: [
							{ value: 'text', label: t('operationProfiles.kindSection.llm.outputModeText') },
							{ value: 'json', label: t('operationProfiles.kindSection.llm.outputModeJson') },
						],
					}}
				/>
				{outputMode === 'json' ? (
					<FormSelect
						name={jsonParseModePath}
						label={t('operationProfiles.kindSection.llm.jsonParseMode')}
						infoTip={parseModeInfoContent}
						selectProps={{
							comboboxProps: { withinPortal: false },
							options: [
								{ value: 'raw', label: t('operationProfiles.kindSection.llm.jsonParseModeRaw') },
								{
									value: 'markdown_code_block',
									label: t('operationProfiles.kindSection.llm.jsonParseModeMarkdownCodeBlock'),
								},
								{ value: 'custom_regex', label: t('operationProfiles.kindSection.llm.jsonParseModeCustomRegex') },
							],
						}}
					/>
				) : null}
				{outputMode === 'json' && jsonParseMode === 'custom_regex' ? (
					<>
						<FormInput
							name={jsonCustomPatternPath}
							label={t('operationProfiles.kindSection.llm.jsonCustomPattern')}
							infoTip={t('operationProfiles.kindSection.llm.jsonCustomPatternInfo')}
						/>
						<FormInput
							name={jsonCustomFlagsPath}
							label={t('operationProfiles.kindSection.llm.jsonCustomFlags')}
							infoTip={t('operationProfiles.kindSection.llm.jsonCustomFlagsInfo')}
						/>
					</>
				) : null}
				<FormNumberInput
					name={`operations.${index}.config.params.timeoutMs`}
					label={t('operationProfiles.kindSection.llm.timeoutMs')}
					infoTip={t('operationProfiles.kindSection.llm.timeoutMsInfo')}
					numberInputProps={{ min: 1, step: 1000 }}
				/>
				<FormNumberInput
					name={`operations.${index}.config.params.retry.maxAttempts`}
					label={t('operationProfiles.kindSection.llm.retryMaxAttempts')}
					infoTip={t('operationProfiles.kindSection.llm.retryMaxAttemptsInfo')}
					numberInputProps={{ min: 1, max: 10, step: 1 }}
				/>
				<FormNumberInput
					name={`operations.${index}.config.params.retry.backoffMs`}
					label={t('operationProfiles.kindSection.llm.retryBackoffMs')}
					infoTip={t('operationProfiles.kindSection.llm.retryBackoffMsInfo')}
					numberInputProps={{ min: 0, step: 100 }}
				/>
				<FormMultiSelect
					name={retryPath}
					label={t('operationProfiles.kindSection.llm.retryOn.label')}
					infoTip={t('operationProfiles.kindSection.llm.retryOnInfo')}
					multiSelectProps={{
						options: retryOnOptions,
						comboboxProps: { withinPortal: false },
					}}
				/>
				{outputMode === 'json' ? (
					<>
						<FormCheckbox
							name={strictSchemaValidationPath}
							label={t('operationProfiles.kindSection.llm.strictSchemaValidation')}
							infoTip={t('operationProfiles.kindSection.llm.strictSchemaValidationInfo')}
						/>
						<FormTextarea
							name={jsonSchemaTextPath}
							label={t('operationProfiles.kindSection.llm.jsonSchema')}
							infoTip={t('operationProfiles.kindSection.llm.jsonSchemaInfo')}
							textareaProps={{ minRows: 10, maxRows: 24, autosize: false, placeholder: JSON_SCHEMA_EXAMPLE }}
						/>
						<Button variant="light" size="xs" onClick={() => setSchemaHelpOpen(true)}>
							{t('operationProfiles.kindSection.llm.schemaHelp.open')}
						</Button>
					</>
				) : null}
			</Stack>

			<Dialog
				open={isSchemaHelpOpen}
				onOpenChange={setSchemaHelpOpen}
				title={t('operationProfiles.kindSection.llm.schemaHelp.title')}
				size="lg"
				footer={
					<Button variant="subtle" onClick={() => setSchemaHelpOpen(false)}>
						{t('common.close')}
					</Button>
				}
			>
				<Stack gap="xs">
					<Text size="sm">{t('operationProfiles.kindSection.llm.schemaHelp.description')}</Text>
					<Text size="sm">1. {t('operationProfiles.kindSection.llm.schemaHelp.ruleTypeDescriptor')}</Text>
					<Text size="sm">2. {t('operationProfiles.kindSection.llm.schemaHelp.ruleOptional')}</Text>
					<Text size="sm">3. {t('operationProfiles.kindSection.llm.schemaHelp.ruleArray')}</Text>
					<Text size="sm">4. {t('operationProfiles.kindSection.llm.schemaHelp.ruleLiterals')}</Text>
					<pre
						style={{
							margin: 0,
							padding: 12,
							borderRadius: 8,
							background: 'var(--mantine-color-gray-0)',
							overflowX: 'auto',
							fontSize: 12,
						}}
					>
						{JSON_SCHEMA_EXAMPLE}
					</pre>
				</Stack>
			</Dialog>
		</Stack>
	);
};
