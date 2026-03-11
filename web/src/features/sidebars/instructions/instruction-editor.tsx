import { Accordion, Alert, Button, Collapse, Group, Select, Stack, Switch, Text, TextInput, Textarea } from '@mantine/core';
import { useUnit } from 'effector-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuArrowDown, LuArrowUp, LuChevronDown, LuChevronRight, LuPlus, LuTrash2 } from 'react-icons/lu';

import { $currentBranchId, $currentChat, $currentEntityProfile } from '@model/chat-core';
import { $selectedInstruction, instructionEditorDraftChanged } from '@model/instructions';
import {
	createEmptyStBaseConfig,
	getStPromptDefinition,
	getStPromptSourceLabel,
	isSystemMarkerPrompt,
	resolvePreferredPromptOrder,
	ST_SYSTEM_PROMPT_DEFAULTS,
} from '@model/instructions/st-preset';
import { LiquidDocsButton } from '@ui/liquid-template-docs';
import { isValidSillyTavernPromptIdentifier } from '@shared/utils/sillytavern-preset';

import { prerenderInstruction } from '../../../api/instructions';

import type { StBaseConfig, StBasePrompt } from '@shared/types/instructions';

type CustomPromptDraft = {
	identifier: string;
	name: string;
	role: 'system' | 'user' | 'assistant';
	system_prompt: boolean;
	marker: boolean;
	content: string;
};

const STANDARD_PROMPT_IDENTIFIERS = ST_SYSTEM_PROMPT_DEFAULTS.map((item) => item.identifier);

function normalizePromptForEdit(prompt: StBasePrompt | undefined, identifier: string): StBasePrompt {
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

function createEmptyCustomPromptDraft(): CustomPromptDraft {
	return {
		identifier: '',
		name: '',
		role: 'system',
		system_prompt: true,
		marker: false,
		content: '',
	};
}

function isCustomPrompt(identifier: string): boolean {
	return !STANDARD_PROMPT_IDENTIFIERS.includes(identifier);
}

function formatPromptMeta(prompt: StBasePrompt, t: (key: string) => string): string {
	const parts: string[] = [prompt.role ?? 'system'];
	if (prompt.system_prompt) parts.push('system_prompt');
	if (prompt.marker) parts.push(t('instructions.fields.markerLabel'));
	return parts.join(' · ');
}

export const InstructionEditor = () => {
	const { t } = useTranslation();
	const instruction = useUnit($selectedInstruction);
	const [chat, branchId, profile] = useUnit([$currentChat, $currentBranchId, $currentEntityProfile]);

	const [basicTemplateText, setBasicTemplateText] = useState('');
	const [stBase, setStBase] = useState<StBaseConfig | null>(null);
	const [addBlockOpened, setAddBlockOpened] = useState(false);
	const [newStandardPromptIdentifier, setNewStandardPromptIdentifier] = useState<string | null>(null);
	const [customPromptDraft, setCustomPromptDraft] = useState<CustomPromptDraft>(createEmptyCustomPromptDraft);
	const [customPromptError, setCustomPromptError] = useState<string | null>(null);
	const [collapsedPromptById, setCollapsedPromptById] = useState<Record<string, boolean>>({});

	const [preview, setPreview] = useState('');
	const [previewError, setPreviewError] = useState<string | null>(null);
	const [previewLoading, setPreviewLoading] = useState(false);

	const lastResetInstructionIdRef = useRef<string | null>(null);

	useEffect(() => {
		const nextInstruction = instruction;
		const nextInstructionId = nextInstruction?.id ?? null;
		if (nextInstructionId === null) {
			lastResetInstructionIdRef.current = null;
			setBasicTemplateText('');
			setStBase(null);
			return;
		}
		if (!nextInstruction) return;
		if (lastResetInstructionIdRef.current === nextInstructionId) return;
		lastResetInstructionIdRef.current = nextInstructionId;

		if (nextInstruction.kind === 'basic') {
			setBasicTemplateText(nextInstruction.templateText);
			setStBase(null);
		} else {
			setBasicTemplateText('');
			setStBase(structuredClone(nextInstruction.stBase));
		}
		setAddBlockOpened(false);
		setNewStandardPromptIdentifier(null);
		setCustomPromptDraft(createEmptyCustomPromptDraft());
		setCustomPromptError(null);
		setCollapsedPromptById({});
		setPreview('');
		setPreviewError(null);
	}, [instruction]);

	useEffect(() => {
		if (!instruction) {
			instructionEditorDraftChanged(null);
			return;
		}

		if (instruction.kind === 'basic') {
			instructionEditorDraftChanged({
				sourceInstructionId: instruction.id,
				kind: 'basic',
				name: instruction.name,
				templateText: basicTemplateText,
				meta: instruction.meta ?? undefined,
			});
			return;
		}

		instructionEditorDraftChanged({
			sourceInstructionId: instruction.id,
			kind: 'st_base',
			name: instruction.name,
			stBase: stBase ?? createEmptyStBaseConfig(),
			meta: instruction.meta ?? undefined,
		});
	}, [basicTemplateText, instruction, stBase]);

	const preferredOrder = useMemo(() => {
		if (!stBase) return null;
		return resolvePreferredPromptOrder(stBase);
	}, [stBase]);

	const promptMap = useMemo(() => {
		const map = new Map<string, StBasePrompt>();
		for (const prompt of stBase?.prompts ?? []) {
			map.set(prompt.identifier, prompt);
		}
		return map;
	}, [stBase]);

	const addablePromptIdentifiers = useMemo(() => {
		const used = new Set(preferredOrder?.order.map((item) => item.identifier) ?? []);
		return STANDARD_PROMPT_IDENTIFIERS.filter((identifier) => !used.has(identifier));
	}, [preferredOrder?.order]);

	const rawPresetJson = useMemo(() => {
		if (!stBase) return '';
		try {
			return JSON.stringify(stBase.rawPreset ?? {}, null, 2);
		} catch {
			return '{}';
		}
	}, [stBase]);

	if (!instruction) return null;

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

	const updatePreferredOrder = (
		updater: (
			order: Array<{ identifier: string; enabled: boolean }>
		) => Array<{ identifier: string; enabled: boolean }>
	) => {
		setStBase((current) => {
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

	const upsertPrompt = (prompt: StBasePrompt) => {
		setStBase((current) => {
			if (!current) return current;
			const index = current.prompts.findIndex((item) => item.identifier === prompt.identifier);
			if (index >= 0) {
				const prompts = [...current.prompts];
				prompts[index] = { ...prompts[index], ...prompt };
				return { ...current, prompts };
			}
			return {
				...current,
				prompts: [...current.prompts, prompt],
			};
		});
	};

	const addPromptToPreferredOrder = (identifier: string) => {
		updatePreferredOrder((order) => {
			if (order.some((item) => item.identifier === identifier)) {
				return order.map((item) => (item.identifier === identifier ? { ...item, enabled: true } : item));
			}
			return [...order, { identifier, enabled: true }];
		});
	};

	const setPromptContent = (identifier: string, content: string) => {
		upsertPrompt({
			...normalizePromptForEdit(promptMap.get(identifier), identifier),
			content,
		});
	};

	const updateCustomPromptField = (identifier: string, patch: Partial<StBasePrompt>) => {
		const existing = normalizePromptForEdit(promptMap.get(identifier), identifier);
		upsertPrompt({
			...existing,
			...patch,
		});
	};

	const removePrompt = (identifier: string, index: number) => {
		setStBase((current) => {
			if (!current) return current;
			const selectedOrder = resolvePreferredPromptOrder(current);
			const nextOrder = selectedOrder.order.filter((_, itemIndex) => itemIndex !== index);
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

			const stillUsed = nextPromptOrder.some((item) =>
				item.order.some((orderItem) => orderItem.identifier === identifier)
			);

			return {
				...current,
				promptOrder: nextPromptOrder,
				prompts: stillUsed
					? current.prompts
					: current.prompts.filter((item) => item.identifier !== identifier),
			};
		});
	};

	const handleAddStandardPrompt = () => {
		if (!newStandardPromptIdentifier) return;
		const definition = getStPromptDefinition(newStandardPromptIdentifier);
		upsertPrompt(
			definition ?? {
				identifier: newStandardPromptIdentifier,
				name: newStandardPromptIdentifier,
				role: 'system',
				system_prompt: true,
				content: '',
			}
		);
		addPromptToPreferredOrder(newStandardPromptIdentifier);
		setCollapsedPromptById((current) => ({ ...current, [newStandardPromptIdentifier]: false }));
		setNewStandardPromptIdentifier(null);
	};

	const handleAddCustomPrompt = () => {
		const identifier = customPromptDraft.identifier.trim();
		if (!identifier) {
			setCustomPromptError(t('instructions.validation.promptIdentifierRequired'));
			return;
		}
		if (!isValidSillyTavernPromptIdentifier(identifier)) {
			setCustomPromptError(t('instructions.validation.promptIdentifierInvalid'));
			return;
		}
		if (promptMap.has(identifier) || preferredOrder?.order.some((item) => item.identifier === identifier)) {
			setCustomPromptError(t('instructions.validation.promptIdentifierDuplicate'));
			return;
		}

		upsertPrompt({
			identifier,
			name: customPromptDraft.name.trim() || undefined,
			role: customPromptDraft.role,
			system_prompt: customPromptDraft.system_prompt,
			marker: customPromptDraft.marker,
			content: customPromptDraft.content,
		});
		addPromptToPreferredOrder(identifier);
		setCollapsedPromptById((current) => ({ ...current, [identifier]: false }));
		setCustomPromptDraft(createEmptyCustomPromptDraft());
		setCustomPromptError(null);
		setAddBlockOpened(false);
	};

	const onPrerender = async () => {
		setPreviewLoading(true);
		setPreviewError(null);
		try {
			const data = await prerenderInstruction({
				templateText: basicTemplateText,
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
		<Stack gap="md" mt="md">
			<Stack gap={2}>
				<Text fw={600}>{instruction.name}</Text>
				<Text size="sm" c="dimmed">
					{instruction.kind === 'st_base'
						? t('instructions.fields.stBaseTypeDescription')
						: t('instructions.fields.basicTypeDescription')}
				</Text>
			</Stack>

			{instruction.kind === 'basic' && (
				<>
					<Textarea
						label={
							<Group gap={6} wrap="nowrap" align="center">
								{t('instructions.fields.templateText')}
								<LiquidDocsButton context="instruction" />
							</Group>
						}
						description={t('instructions.fields.templateTextDescription')}
						value={basicTemplateText}
						onChange={(e) => setBasicTemplateText(e.currentTarget.value)}
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

					<Group justify="flex-end">
						<Button variant="light" loading={previewLoading} onClick={onPrerender}>
							{t('instructions.actions.prerender')}
						</Button>
					</Group>
				</>
			)}

			{instruction.kind === 'st_base' && stBase && preferredOrder && (
				<Stack gap="sm">
					<Group justify="space-between" align="center">
						<Text fw={600}>{t('instructions.fields.promptBlocks')}</Text>
						<Button
							size="sm"
							variant={addBlockOpened ? 'default' : 'light'}
							leftSection={<LuPlus size={14} />}
							onClick={() => {
								setAddBlockOpened((current) => !current);
								setCustomPromptError(null);
							}}
						>
							{t('instructions.actions.addPromptBlock')}
						</Button>
					</Group>

					<Collapse in={addBlockOpened}>
						<Stack gap="md" p="sm" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 8 }}>
							<Stack gap="xs">
								<Text fw={500}>{t('instructions.fields.addStandardBlock')}</Text>
								<Group align="flex-end">
									<Select
										placeholder={t('instructions.placeholders.addPromptBlock')}
										data={addablePromptIdentifiers.map((identifier) => ({
											value: identifier,
											label: getStPromptDefinition(identifier)?.name ?? identifier,
										}))}
										value={newStandardPromptIdentifier}
										onChange={setNewStandardPromptIdentifier}
										clearable
										style={{ flex: 1 }}
									/>
									<Button variant="light" disabled={!newStandardPromptIdentifier} onClick={handleAddStandardPrompt}>
										{t('common.add')}
									</Button>
								</Group>
							</Stack>

							<Stack gap="xs">
								<Text fw={500}>{t('instructions.fields.addCustomBlock')}</Text>
								<Group grow align="flex-start">
									<TextInput
										label={t('instructions.fields.promptIdentifier')}
										value={customPromptDraft.identifier}
										onChange={(event) => {
											setCustomPromptDraft((current) => ({
												...current,
												identifier: event.currentTarget.value,
											}));
											setCustomPromptError(null);
										}}
										placeholder="my.custom-block"
									/>
									<TextInput
										label={t('instructions.fields.promptName')}
										value={customPromptDraft.name}
										onChange={(event) =>
											setCustomPromptDraft((current) => ({
												...current,
												name: event.currentTarget.value,
											}))
										}
										placeholder={t('instructions.placeholders.promptName')}
									/>
									<Select
										label={t('instructions.fields.promptRole')}
										value={customPromptDraft.role}
										onChange={(value) =>
											setCustomPromptDraft((current) => ({
												...current,
												role: (value as CustomPromptDraft['role'] | null) ?? 'system',
											}))
										}
										data={[
											{ value: 'system', label: 'system' },
											{ value: 'user', label: 'user' },
											{ value: 'assistant', label: 'assistant' },
										]}
										allowDeselect={false}
									/>
								</Group>
								<Group gap="lg">
									<Switch
										label="system_prompt"
										checked={customPromptDraft.system_prompt}
										onChange={(event) =>
											setCustomPromptDraft((current) => ({
												...current,
												system_prompt: event.currentTarget.checked,
											}))
										}
									/>
									<Switch
										label={t('instructions.fields.markerLabel')}
										checked={customPromptDraft.marker}
										onChange={(event) =>
											setCustomPromptDraft((current) => ({
												...current,
												marker: event.currentTarget.checked,
											}))
										}
									/>
								</Group>
								<Textarea
									label={t('instructions.fields.promptContent')}
									value={customPromptDraft.content}
									onChange={(event) =>
										setCustomPromptDraft((current) => ({
											...current,
											content: event.currentTarget.value,
										}))
									}
									description={customPromptDraft.marker ? t('instructions.fields.markerDescription') : undefined}
									minRows={4}
									autosize
									styles={{ input: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' } }}
								/>
								{customPromptError && (
									<Text size="sm" c="red">
										{customPromptError}
									</Text>
								)}
								<Group justify="flex-end">
									<Button variant="default" onClick={() => setCustomPromptDraft(createEmptyCustomPromptDraft())}>
										{t('instructions.actions.resetCustomBlock')}
									</Button>
									<Button onClick={handleAddCustomPrompt}>{t('instructions.actions.addCustomBlock')}</Button>
								</Group>
							</Stack>
						</Stack>
					</Collapse>

					{preferredOrder.order.map((entry, index) => {
						const prompt = normalizePromptForEdit(promptMap.get(entry.identifier), entry.identifier);
						const sourceLabel = getStPromptSourceLabel(entry.identifier);
						const standardPrompt = !isCustomPrompt(entry.identifier);
						const runtimeManagedMarker = isSystemMarkerPrompt(prompt) && Boolean(sourceLabel);
						const collapsibleMarker = runtimeManagedMarker || prompt.marker === true;
						const isCollapsed = isPromptCollapsed(entry.identifier, collapsibleMarker);

						return (
							<Stack key={`${entry.identifier}_${index}`} gap={6} p="xs" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 8 }}>
								<Group justify="space-between" align="center">
									<Group gap="xs" align="center">
										<Button
											size="compact-sm"
											variant="subtle"
											px={4}
											onClick={() => togglePromptCollapsed(entry.identifier, collapsibleMarker)}
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
											size="sm"
										/>
										<Stack gap={0}>
											<Text size="sm" fw={500}>
												{prompt.name || entry.identifier}
											</Text>
											<Text size="xs" c="dimmed">
												{entry.identifier}
											</Text>
										</Stack>
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
											onClick={() => removePrompt(entry.identifier, index)}
										>
											{t('common.delete')}
										</Button>
									</Group>
								</Group>

								<Collapse in={!isCollapsed}>
									<Stack gap={8}>
										<Text size="xs" c="dimmed">
											{formatPromptMeta(prompt, t)}
										</Text>

										{isCustomPrompt(entry.identifier) && (
											<Group grow align="flex-start">
												<TextInput
													label={t('instructions.fields.promptName')}
													value={prompt.name ?? ''}
													onChange={(event) =>
														updateCustomPromptField(entry.identifier, {
															name: event.currentTarget.value.trim() || undefined,
														})
													}
												/>
												<Select
													label={t('instructions.fields.promptRole')}
													value={prompt.role ?? 'system'}
													onChange={(value) =>
														updateCustomPromptField(entry.identifier, {
															role: (value as StBasePrompt['role'] | null) ?? 'system',
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
										)}

										{isCustomPrompt(entry.identifier) && (
											<Group gap="lg">
												<Switch
													label="system_prompt"
													checked={prompt.system_prompt === true}
													onChange={(event) =>
														updateCustomPromptField(entry.identifier, {
															system_prompt: event.currentTarget.checked,
														})
													}
												/>
												<Switch
													label={t('instructions.fields.markerLabel')}
													checked={prompt.marker === true}
													onChange={(event) =>
														updateCustomPromptField(entry.identifier, {
															marker: event.currentTarget.checked,
														})
													}
												/>
											</Group>
										)}

										{runtimeManagedMarker ? (
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
												description={prompt.marker ? t('instructions.fields.markerDescription') : undefined}
												minRows={4}
												autosize
												styles={{ input: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' } }}
											/>
										)}

										{!standardPrompt && (
											<Text size="xs" c="dimmed">
												{t('instructions.fields.customBlockHint')}
											</Text>
										)}
									</Stack>
								</Collapse>
							</Stack>
						);
					})}

					<Accordion variant="separated">
						<Accordion.Item value="details">
							<Accordion.Control>{t('instructions.fields.details')}</Accordion.Control>
							<Accordion.Panel>
								<Stack gap="sm">
									<Group grow align="flex-start">
										<TextInput label={t('instructions.fields.importSource')} value={stBase.importInfo.source} readOnly />
										<TextInput label={t('instructions.fields.importFileName')} value={stBase.importInfo.fileName} readOnly />
										<TextInput label={t('instructions.fields.importedAt')} value={stBase.importInfo.importedAt} readOnly />
									</Group>
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
		</Stack>
	);
};
