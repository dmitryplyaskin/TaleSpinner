import { Accordion, Alert, Badge, Button, Collapse, Group, NumberInput, Select, Stack, Switch, Text, TextInput, Textarea } from '@mantine/core';
import { useUnit } from 'effector-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LuArrowDown, LuArrowUp, LuChevronDown, LuChevronRight, LuPlus, LuTrash2 } from 'react-icons/lu';

import { $currentBranchId, $currentChat, $currentEntityProfile } from '@model/chat-core';
import {
	$selectedInstruction,
	instructionEditorDraftChanged,
} from '@model/instructions';
import {
	createTsInstructionMeta,
	getStPromptDefinition,
	getStPromptSourceLabel,
	getTsInstructionMeta,
	isSystemMarkerPrompt,
	resolvePreferredPromptOrder,
} from '@model/instructions/st-preset';
import { LiquidDocsButton } from '@ui/liquid-template-docs';

import { prerenderInstruction } from '../../../api/instructions';

import type { StAdvancedConfig, StPrompt } from '@shared/types/instructions';

type FormValues = {
	name: string;
	templateText: string;
};

const KNOWN_PROMPT_IDENTIFIERS = [
	'main',
	'nsfw',
	'jailbreak',
	'worldInfoBefore',
	'worldInfoAfter',
	'charDescription',
	'charPersonality',
	'scenario',
	'personaDescription',
	'dialogueExamples',
	'chatHistory',
	'enhanceDefinitions',
];

function createDefaultAdvancedConfig(templateText: string): StAdvancedConfig {
	return {
		rawPreset: {},
		prompts: [
			{
				identifier: 'main',
				name: 'Main Prompt',
				role: 'system',
				system_prompt: true,
				content: templateText.trim().length > 0 ? templateText : '{{char.name}}',
			},
		],
		promptOrder: [
			{
				character_id: 100001,
				order: [
					{ identifier: 'main', enabled: true },
					{ identifier: 'chatHistory', enabled: true },
				],
			},
		],
		responseConfig: {},
		importInfo: {
			source: 'sillytavern',
			fileName: 'manual',
			importedAt: new Date().toISOString(),
		},
	};
}

function normalizePromptForEdit(prompt: StPrompt | undefined, identifier: string): StPrompt {
	if (prompt) return { ...prompt };
	const definition = getStPromptDefinition(identifier);
	if (definition) return { ...definition };
	return {
		identifier,
		name: identifier,
		role: 'system',
		system_prompt: true,
		content: '',
	};
}

export const InstructionEditor = () => {
	const { t } = useTranslation();
	const tpl = useUnit($selectedInstruction);
	const [chat, branchId, profile] = useUnit([$currentChat, $currentBranchId, $currentEntityProfile]);
	const [isAdvancedMode, setIsAdvancedMode] = useState(false);
	const [stAdvanced, setStAdvanced] = useState<StAdvancedConfig | null>(null);
	const [newPromptIdentifier, setNewPromptIdentifier] = useState<string | null>(null);
	const [collapsedPromptById, setCollapsedPromptById] = useState<Record<string, boolean>>({});

	const [preview, setPreview] = useState<string>('');
	const [previewError, setPreviewError] = useState<string | null>(null);
	const [previewLoading, setPreviewLoading] = useState(false);

	const methods = useForm<FormValues>({
		defaultValues: {
			name: tpl?.name ?? '',
			templateText: tpl?.templateText ?? '',
		},
	});
	const { reset } = methods;
	const watchedName = methods.watch('name');
	const watchedTemplateText = methods.watch('templateText');
	const lastResetInstructionIdRef = useRef<string | null>(null);

	useEffect(() => {
		const nextInstructionId = tpl?.id ?? null;
		if (nextInstructionId === null) {
			lastResetInstructionIdRef.current = null;
			return;
		}
		if (lastResetInstructionIdRef.current === nextInstructionId) return;
		lastResetInstructionIdRef.current = nextInstructionId;

		const tsInstruction = getTsInstructionMeta(tpl?.meta);
		const mode = tsInstruction?.mode ?? 'basic';
		const advancedConfig =
			tsInstruction?.stAdvanced ?? createDefaultAdvancedConfig(tpl?.templateText ?? '');

		reset({
			name: tpl?.name ?? '',
			templateText: tpl?.templateText ?? '',
		});
		setIsAdvancedMode(mode === 'st_advanced');
		setStAdvanced(advancedConfig);
		setNewPromptIdentifier(null);
		setCollapsedPromptById({});
		setPreview('');
		setPreviewError(null);
	}, [reset, tpl?.id, tpl?.meta, tpl?.name, tpl?.templateText]);

	useEffect(() => {
		if (!tpl) {
			instructionEditorDraftChanged(null);
			return;
		}
		const ensuredAdvanced = stAdvanced ?? createDefaultAdvancedConfig(watchedTemplateText);
		instructionEditorDraftChanged({
			sourceInstructionId: tpl.id,
			name: watchedName,
			templateText: watchedTemplateText,
			meta: createTsInstructionMeta({
				meta: tpl.meta,
				mode: isAdvancedMode ? 'st_advanced' : 'basic',
				stAdvanced: ensuredAdvanced,
			}),
		});
	}, [isAdvancedMode, stAdvanced, tpl, watchedName, watchedTemplateText]);

	const preferredOrder = useMemo(() => {
		if (!stAdvanced) return null;
		return resolvePreferredPromptOrder(stAdvanced);
	}, [stAdvanced]);

	const promptMap = useMemo(() => {
		const map = new Map<string, StPrompt>();
		for (const prompt of stAdvanced?.prompts ?? []) {
			map.set(prompt.identifier, prompt);
		}
		return map;
	}, [stAdvanced]);

	const addablePromptIdentifiers = useMemo(() => {
		const used = new Set(preferredOrder?.order.map((item) => item.identifier) ?? []);
		return KNOWN_PROMPT_IDENTIFIERS.filter((identifier) => !used.has(identifier));
	}, [preferredOrder?.order]);

	const rawPresetJson = useMemo(() => {
		if (!stAdvanced) return '';
		try {
			return JSON.stringify(stAdvanced.rawPreset ?? {}, null, 2);
		} catch {
			return '{}';
		}
	}, [stAdvanced]);

	if (!tpl) return null;

	const isPromptCollapsed = (identifier: string, isMarkerPrompt: boolean): boolean => {
		const value = collapsedPromptById[identifier];
		if (typeof value === 'boolean') return value;
		return isMarkerPrompt;
	};

	const togglePromptCollapsed = (identifier: string, isMarkerPrompt: boolean) => {
		setCollapsedPromptById((current) => ({
			...current,
			[identifier]: !isPromptCollapsed(identifier, isMarkerPrompt),
		}));
	};

	const updatePreferredOrder = (updater: (order: Array<{ identifier: string; enabled: boolean }>) => Array<{ identifier: string; enabled: boolean }>) => {
		setStAdvanced((current) => {
			if (!current) return current;
			const selectedOrder = resolvePreferredPromptOrder(current);
			const nextOrder = updater(selectedOrder.order.map((item) => ({ ...item })));
			const existingIndex = current.promptOrder.findIndex((item) => item.character_id === selectedOrder.character_id);
			const nextPromptOrder = [...current.promptOrder];
			if (existingIndex >= 0) {
				nextPromptOrder[existingIndex] = {
					...nextPromptOrder[existingIndex],
					order: nextOrder,
				};
			} else {
				nextPromptOrder.unshift({
					character_id: selectedOrder.character_id,
					order: nextOrder,
				});
			}
			return {
				...current,
				promptOrder: nextPromptOrder,
			};
		});
	};

	const setPromptContent = (identifier: string, content: string) => {
		setStAdvanced((current) => {
			if (!current) return current;
			const index = current.prompts.findIndex((item) => item.identifier === identifier);
			if (index >= 0) {
				const prompts = [...current.prompts];
				prompts[index] = {
					...prompts[index],
					content,
				};
				return { ...current, prompts };
			}
			return {
				...current,
				prompts: [
					...current.prompts,
					{
						identifier,
						name: identifier,
						role: 'system',
						system_prompt: true,
						content,
					},
				],
			};
		});
	};

	const setNumericResponseConfig = (
		key:
			| 'temperature'
			| 'top_p'
			| 'top_k'
			| 'top_a'
			| 'min_p'
			| 'repetition_penalty'
			| 'frequency_penalty'
			| 'presence_penalty'
			| 'openai_max_tokens'
			| 'seed'
			| 'n',
		value: string | number
	) => {
		setStAdvanced((current) => {
			if (!current) return current;
			const responseConfig = { ...current.responseConfig };
			if (typeof value === 'number' && Number.isFinite(value)) {
				responseConfig[key] = value;
			} else {
				delete responseConfig[key];
			}
			return { ...current, responseConfig };
		});
	};

	const setStringResponseConfig = (
		key: 'reasoning_effort' | 'verbosity',
		value: string | null
	) => {
		setStAdvanced((current) => {
			if (!current) return current;
			const responseConfig = { ...current.responseConfig };
			if (typeof value === 'string' && value.trim().length > 0) {
				responseConfig[key] = value;
			} else {
				delete responseConfig[key];
			}
			return { ...current, responseConfig };
		});
	};

	const setBooleanResponseConfig = (
		key: 'enable_web_search' | 'stream_openai',
		value: boolean
	) => {
		setStAdvanced((current) => {
			if (!current) return current;
			return {
				...current,
				responseConfig: {
					...current.responseConfig,
					[key]: value,
				},
			};
		});
	};

	const onPrerender = async () => {
		setPreviewLoading(true);
		setPreviewError(null);
		try {
			const data = await prerenderInstruction({
				templateText: methods.getValues('templateText'),
				chatId: chat?.id ?? undefined,
				branchId: branchId ?? undefined,
				entityProfileId: profile?.id ?? undefined,
				historyLimit: 50,
			});
			setPreview(data.rendered);
		} catch (e) {
			setPreview('');
			setPreviewError(e instanceof Error ? e.message : String(e));
		} finally {
			setPreviewLoading(false);
		}
	};

	return (
		<FormProvider {...methods}>
			<Stack gap="md" mt="md">
				<Switch
					label={t('instructions.fields.advancedMode')}
					checked={isAdvancedMode}
					onChange={(event) => setIsAdvancedMode(event.currentTarget.checked)}
				/>

				{!isAdvancedMode && (
					<>
						<Textarea
							label={
								<Group gap={6} wrap="nowrap" align="center">
									{t('instructions.fields.templateText')}
									<LiquidDocsButton context="instruction" />
								</Group>
							}
							description={t('instructions.fields.templateTextDescription')}
							value={watchedTemplateText}
							onChange={(e) => methods.setValue('templateText', e.currentTarget.value, { shouldDirty: true })}
							minRows={14}
							autosize
							styles={{ input: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' } }}
						/>

						{previewError && (
							<Text c="red" size="sm">
								{previewError}
							</Text>
						)}

						{preview.length > 0 && (
							<Textarea
								label={t('instructions.fields.prerender')}
								description={t('instructions.fields.prerenderDescription')}
								value={preview}
								readOnly
								minRows={10}
								autosize
								styles={{ input: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' } }}
							/>
						)}
					</>
				)}

				{isAdvancedMode && stAdvanced && preferredOrder && (
					<Stack gap="sm">
						<Text fw={600}>{t('instructions.fields.fallbackTemplateText')}</Text>
						<Textarea
							description={t('instructions.fields.fallbackTemplateTextDescription')}
							value={watchedTemplateText}
							onChange={(e) => methods.setValue('templateText', e.currentTarget.value, { shouldDirty: true })}
							minRows={5}
							autosize
							styles={{ input: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' } }}
						/>

						<Group justify="space-between" align="center">
							<Text fw={600}>{t('instructions.fields.promptBlocks')}</Text>
							<Group gap="xs">
								<Select
									placeholder={t('instructions.placeholders.addPromptBlock')}
									data={addablePromptIdentifiers.map((identifier) => ({
										value: identifier,
										label: identifier,
									}))}
									value={newPromptIdentifier}
									onChange={setNewPromptIdentifier}
									clearable
									w={220}
								/>
								<Button
									size="xs"
									variant="light"
									leftSection={<LuPlus size={14} />}
									disabled={!newPromptIdentifier}
									onClick={() => {
										if (!newPromptIdentifier) return;
										updatePreferredOrder((order) => [
											...order,
											{ identifier: newPromptIdentifier, enabled: true },
										]);
										setStAdvanced((current) => {
											if (!current) return current;
											if (current.prompts.some((item) => item.identifier === newPromptIdentifier)) {
												return current;
											}
											const definition = getStPromptDefinition(newPromptIdentifier);
											return {
												...current,
												prompts: [
													...current.prompts,
													definition ?? {
														identifier: newPromptIdentifier,
														name: newPromptIdentifier,
														role: 'system',
														system_prompt: true,
														content: '',
													},
												],
											};
										});
										setNewPromptIdentifier(null);
									}}
								>
									{t('common.add')}
								</Button>
							</Group>
						</Group>

						{preferredOrder.order.map((entry, index) => {
							const prompt = normalizePromptForEdit(promptMap.get(entry.identifier), entry.identifier);
							const unsupported = !KNOWN_PROMPT_IDENTIFIERS.includes(entry.identifier);
							const isMarkerPrompt = isSystemMarkerPrompt(prompt);
							const sourceLabel = getStPromptSourceLabel(entry.identifier);
							const isCollapsed = isPromptCollapsed(entry.identifier, isMarkerPrompt);

							return (
								<Stack key={`${entry.identifier}_${index}`} gap={6} p="xs" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 8 }}>
									<Group justify="space-between" align="center">
										<Group gap="xs" align="center">
											<Button
												size="compact-sm"
												variant="subtle"
												px={4}
												onClick={() => togglePromptCollapsed(entry.identifier, isMarkerPrompt)}
												aria-label={isCollapsed ? 'Expand block' : 'Collapse block'}
											>
												{isCollapsed ? <LuChevronRight size={16} /> : <LuChevronDown size={16} />}
											</Button>
											<Switch
												checked={entry.enabled}
												onChange={(event) => {
													const enabled = event.currentTarget.checked;
													updatePreferredOrder((order) =>
														order.map((item, itemIndex) =>
															itemIndex === index ? { ...item, enabled } : item
														)
													);
												}}
												label={entry.identifier}
												size="sm"
											/>
											{unsupported && <Badge color="orange" variant="light">{t('instructions.fields.unsupportedBlock')}</Badge>}
										</Group>
										<Group gap={4}>
											<Button
												size="compact-sm"
												variant="subtle"
												leftSection={<LuArrowUp size={14} />}
												disabled={index === 0}
												onClick={() => {
													updatePreferredOrder((order) => {
														if (index === 0) return order;
														const next = [...order];
														[next[index - 1], next[index]] = [next[index], next[index - 1]];
														return next;
													});
												}}
											>
												{t('common.up')}
											</Button>
											<Button
												size="compact-sm"
												variant="subtle"
												leftSection={<LuArrowDown size={14} />}
												disabled={index === preferredOrder.order.length - 1}
												onClick={() => {
													updatePreferredOrder((order) => {
														if (index >= order.length - 1) return order;
														const next = [...order];
														[next[index], next[index + 1]] = [next[index + 1], next[index]];
														return next;
													});
												}}
											>
												{t('common.down')}
											</Button>
											<Button
												size="compact-sm"
												variant="subtle"
												color="red"
												leftSection={<LuTrash2 size={14} />}
												disabled={isMarkerPrompt}
												onClick={() => {
													updatePreferredOrder((order) => order.filter((_, itemIndex) => itemIndex !== index));
												}}
											>
												{t('common.delete')}
											</Button>
										</Group>
									</Group>

									<Collapse in={!isCollapsed}>
										<Stack gap={6}>
											{isMarkerPrompt ? (
												<Alert color="blue" variant="light" title={t('instructions.fields.systemBlockTitle')}>
													<Stack gap={4}>
														<Text size="sm">{t('instructions.fields.systemBlockDescription')}</Text>
														{sourceLabel ? (
															<Text size="sm">
																{t('instructions.fields.systemBlockSource')}: {sourceLabel}
															</Text>
														) : null}
													</Stack>
												</Alert>
											) : (
												<Textarea
													value={prompt.content ?? ''}
													onChange={(event) => setPromptContent(entry.identifier, event.currentTarget.value)}
													placeholder={t('instructions.placeholders.promptBlockContent')}
													minRows={4}
													autosize
													styles={{ input: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' } }}
												/>
											)}
										</Stack>
									</Collapse>
								</Stack>
							);
						})}

						<Text fw={600}>{t('instructions.fields.responseConfig')}</Text>
						<Group grow align="flex-start">
							<NumberInput
								label="temperature"
								value={stAdvanced.responseConfig.temperature}
								onChange={(value) => setNumericResponseConfig('temperature', value)}
								allowDecimal
							/>
							<NumberInput
								label="top_p"
								value={stAdvanced.responseConfig.top_p}
								onChange={(value) => setNumericResponseConfig('top_p', value)}
								allowDecimal
							/>
							<NumberInput
								label="top_k"
								value={stAdvanced.responseConfig.top_k}
								onChange={(value) => setNumericResponseConfig('top_k', value)}
								allowDecimal
							/>
						</Group>
						<Group grow align="flex-start">
							<NumberInput
								label="top_a"
								value={stAdvanced.responseConfig.top_a}
								onChange={(value) => setNumericResponseConfig('top_a', value)}
								allowDecimal
							/>
							<NumberInput
								label="min_p"
								value={stAdvanced.responseConfig.min_p}
								onChange={(value) => setNumericResponseConfig('min_p', value)}
								allowDecimal
							/>
							<NumberInput
								label="repetition_penalty"
								value={stAdvanced.responseConfig.repetition_penalty}
								onChange={(value) => setNumericResponseConfig('repetition_penalty', value)}
								allowDecimal
							/>
						</Group>
						<Group grow align="flex-start">
							<NumberInput
								label="frequency_penalty"
								value={stAdvanced.responseConfig.frequency_penalty}
								onChange={(value) => setNumericResponseConfig('frequency_penalty', value)}
								allowDecimal
							/>
							<NumberInput
								label="presence_penalty"
								value={stAdvanced.responseConfig.presence_penalty}
								onChange={(value) => setNumericResponseConfig('presence_penalty', value)}
								allowDecimal
							/>
							<NumberInput
								label="openai_max_tokens"
								value={stAdvanced.responseConfig.openai_max_tokens}
								onChange={(value) => setNumericResponseConfig('openai_max_tokens', value)}
								min={1}
							/>
						</Group>
						<Group grow align="flex-start">
							<NumberInput
								label="seed"
								value={stAdvanced.responseConfig.seed}
								onChange={(value) => setNumericResponseConfig('seed', value)}
							/>
							<NumberInput
								label="n"
								value={stAdvanced.responseConfig.n}
								onChange={(value) => setNumericResponseConfig('n', value)}
								min={1}
							/>
							<Select
								label="reasoning_effort"
								value={stAdvanced.responseConfig.reasoning_effort ?? null}
								onChange={(value) => setStringResponseConfig('reasoning_effort', value)}
								clearable
								data={['auto', 'low', 'medium', 'high', 'min', 'max']}
							/>
						</Group>
						<Group grow align="flex-start">
							<Select
								label="verbosity"
								value={stAdvanced.responseConfig.verbosity ?? null}
								onChange={(value) => setStringResponseConfig('verbosity', value)}
								clearable
								data={['auto', 'low', 'medium', 'high']}
							/>
							<TextInput
								label={t('instructions.fields.importSource')}
								value={stAdvanced.importInfo.source}
								readOnly
							/>
							<TextInput
								label={t('instructions.fields.importFileName')}
								value={stAdvanced.importInfo.fileName}
								readOnly
							/>
						</Group>
						<Group grow align="center">
							<Switch
								label="enable_web_search"
								checked={stAdvanced.responseConfig.enable_web_search === true}
								onChange={(event) =>
									setBooleanResponseConfig(
										'enable_web_search',
										event.currentTarget.checked
									)
								}
							/>
							<Switch
								label="stream_openai"
								checked={stAdvanced.responseConfig.stream_openai === true}
								onChange={(event) =>
									setBooleanResponseConfig('stream_openai', event.currentTarget.checked)
								}
							/>
							<TextInput
								label={t('instructions.fields.importedAt')}
								value={stAdvanced.importInfo.importedAt}
								readOnly
							/>
						</Group>
						<Accordion variant="separated">
							<Accordion.Item value="details">
								<Accordion.Control>{t('instructions.fields.details')}</Accordion.Control>
								<Accordion.Panel>
									<Stack gap="sm">
										<Textarea
											label={t('instructions.fields.rawPreset')}
											value={rawPresetJson}
											readOnly
											minRows={6}
											autosize
											styles={{ input: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' } }}
										/>
									</Stack>
								</Accordion.Panel>
							</Accordion.Item>
						</Accordion>
					</Stack>
				)}

				<Group justify="flex-end">
					{!isAdvancedMode && (
						<Button variant="light" loading={previewLoading} onClick={onPrerender}>
							{t('instructions.actions.prerender')}
						</Button>
					)}
				</Group>
			</Stack>
		</FormProvider>
	);
};
