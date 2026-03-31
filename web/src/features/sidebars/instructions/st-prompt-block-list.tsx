import { ActionIcon, Alert, Collapse, Group, Select, Stack, Switch, Text, TextInput, Textarea } from '@mantine/core';
import { useState, type DragEvent as ReactDragEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { LuChevronDown, LuChevronRight, LuGripVertical, LuTrash2 } from 'react-icons/lu';

import {
	getStPromptDefinition,
	getStPromptSourceLabel,
	isSystemMarkerPrompt,
	ST_SYSTEM_PROMPT_DEFAULTS,
} from '@model/instructions/st-preset';

import { movePromptOrderItem, type PromptOrderItem } from './prompt-order';

import type { StBasePrompt } from '@shared/types/instructions';

const STANDARD_PROMPT_IDENTIFIERS = new Set(ST_SYSTEM_PROMPT_DEFAULTS.map((item) => item.identifier));

type StPromptBlockListProps = {
	entries: PromptOrderItem[];
	promptMap: Map<string, StBasePrompt>;
	isPromptCollapsed: (identifier: string, isMarkerPrompt: boolean) => boolean;
	onTogglePromptCollapsed: (identifier: string, isMarkerPrompt: boolean) => void;
	onUpdatePreferredOrder: (updater: (order: PromptOrderItem[]) => PromptOrderItem[]) => void;
	onRemovePrompt: (identifier: string, index: number) => void;
	onSetPromptContent: (identifier: string, content: string) => void;
	onUpdateCustomPromptField: (identifier: string, patch: Partial<StBasePrompt>) => void;
};

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

function isCustomPrompt(identifier: string): boolean {
	return !STANDARD_PROMPT_IDENTIFIERS.has(identifier);
}

function formatPromptMeta(prompt: StBasePrompt, t: (key: string) => string): string {
	const parts: string[] = [prompt.role ?? 'system'];
	if (prompt.system_prompt) parts.push('system_prompt');
	if (prompt.marker) parts.push(t('instructions.fields.markerLabel'));
	return parts.join(' · ');
}

function resolveDropSlotIndex(event: ReactDragEvent<HTMLElement>, index: number): number {
	const rect = event.currentTarget.getBoundingClientRect();
	const insertBefore = event.clientY < rect.top + rect.height / 2;
	return insertBefore ? index : index + 1;
}

function resolveDropTargetIndex(fromIndex: number, slotIndex: number): number {
	return fromIndex < slotIndex ? slotIndex - 1 : slotIndex;
}

function createCardStyle(params: {
	draggedIndex: number | null;
	dropSlotIndex: number | null;
	index: number;
}) {
	const dropBefore = params.dropSlotIndex === params.index;
	const dropAfter = params.dropSlotIndex === params.index + 1;

	return {
		border: '1px solid var(--mantine-color-gray-3)',
		borderRadius: 8,
		boxShadow: [
			dropBefore ? 'inset 0 3px 0 0 var(--mantine-color-blue-6)' : null,
			dropAfter ? 'inset 0 -3px 0 0 var(--mantine-color-blue-6)' : null,
		]
			.filter(Boolean)
			.join(', '),
		opacity: params.draggedIndex === params.index ? 0.55 : 1,
	};
}

export function StPromptBlockList({
	entries,
	promptMap,
	isPromptCollapsed,
	onTogglePromptCollapsed,
	onUpdatePreferredOrder,
	onRemovePrompt,
	onSetPromptContent,
	onUpdateCustomPromptField,
}: StPromptBlockListProps) {
	const { t } = useTranslation();
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
	const [dropSlotIndex, setDropSlotIndex] = useState<number | null>(null);

	const clearDragState = () => {
		setDraggedIndex(null);
		setDropSlotIndex(null);
	};

	const commitDrop = (slotIndex: number) => {
		if (draggedIndex === null) return;

		const targetIndex = resolveDropTargetIndex(draggedIndex, slotIndex);
		if (targetIndex < 0 || targetIndex >= entries.length || targetIndex === draggedIndex) {
			clearDragState();
			return;
		}

		onUpdatePreferredOrder((order) => movePromptOrderItem(order, draggedIndex, targetIndex));
		clearDragState();
	};

	const handleDragStart = (event: ReactDragEvent<HTMLButtonElement>, index: number) => {
		setDraggedIndex(index);
		setDropSlotIndex(index);
		event.dataTransfer.effectAllowed = 'move';
		event.dataTransfer.setData('text/plain', String(index));
	};

	const handleDragOver = (event: ReactDragEvent<HTMLDivElement>, index: number) => {
		if (draggedIndex === null) return;
		event.preventDefault();
		event.dataTransfer.dropEffect = 'move';
		setDropSlotIndex(resolveDropSlotIndex(event, index));
	};

	const handleDrop = (event: ReactDragEvent<HTMLDivElement>, index: number) => {
		if (draggedIndex === null) return;
		event.preventDefault();
		commitDrop(resolveDropSlotIndex(event, index));
	};

	const handleReorderKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
		let targetIndex: number | null = null;

		if (event.key === 'ArrowUp') {
			targetIndex = index - 1;
		} else if (event.key === 'ArrowDown') {
			targetIndex = index + 1;
		} else if (event.key === 'Home') {
			targetIndex = 0;
		} else if (event.key === 'End') {
			targetIndex = entries.length - 1;
		}

		if (targetIndex === null || targetIndex < 0 || targetIndex >= entries.length || targetIndex === index) {
			return;
		}

		event.preventDefault();
		onUpdatePreferredOrder((order) => movePromptOrderItem(order, index, targetIndex));
	};

	return (
		<>
			{entries.map((entry, index) => {
				const prompt = normalizePromptForEdit(promptMap.get(entry.identifier), entry.identifier);
				const sourceLabel = getStPromptSourceLabel(entry.identifier);
				const standardPrompt = !isCustomPrompt(entry.identifier);
				const runtimeManagedMarker = isSystemMarkerPrompt(prompt) && Boolean(sourceLabel);
				const collapsibleMarker = runtimeManagedMarker || prompt.marker === true;
				const isCollapsed = isPromptCollapsed(entry.identifier, collapsibleMarker);

				return (
					<Stack
						key={`${entry.identifier}_${index}`}
						gap={6}
						p="xs"
						style={createCardStyle({ draggedIndex, dropSlotIndex, index })}
						onDragOver={(event) => handleDragOver(event, index)}
						onDrop={(event) => handleDrop(event, index)}
					>
						<Group justify="space-between" align="center">
							<Group gap="xs" align="center" wrap="nowrap">
								<ActionIcon
									variant="subtle"
									size="sm"
									onClick={() => onTogglePromptCollapsed(entry.identifier, collapsibleMarker)}
									aria-label={
										isCollapsed
											? t('instructions.actions.expandBlock')
											: t('instructions.actions.collapseBlock')
									}
								>
									{isCollapsed ? <LuChevronRight size={16} /> : <LuChevronDown size={16} />}
								</ActionIcon>
								<ActionIcon
									variant="subtle"
									size="sm"
									draggable
									onDragStart={(event) => handleDragStart(event, index)}
									onDragEnd={clearDragState}
									onKeyDown={(event) => handleReorderKeyDown(event, index)}
									aria-label={t('instructions.actions.reorderBlock')}
									title={t('instructions.actions.reorderBlock')}
									style={{ cursor: draggedIndex === index ? 'grabbing' : 'grab' }}
								>
									<LuGripVertical size={16} />
								</ActionIcon>
								<Switch
									checked={entry.enabled}
									onChange={(event) => {
										const enabled = event.currentTarget.checked;
										onUpdatePreferredOrder((order) =>
											order.map((item, itemIndex) =>
												itemIndex === index ? { ...item, enabled } : item,
											),
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
							<ActionIcon
								variant="subtle"
								color="red"
								onClick={() => onRemovePrompt(entry.identifier, index)}
								aria-label={t('common.delete')}
								title={t('common.delete')}
							>
								<LuTrash2 size={16} />
							</ActionIcon>
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
												onUpdateCustomPromptField(entry.identifier, {
													name: event.currentTarget.value.trim() || undefined,
												})
											}
										/>
										<Select
											label={t('instructions.fields.promptRole')}
											value={prompt.role ?? 'system'}
											onChange={(value) =>
												onUpdateCustomPromptField(entry.identifier, {
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
												onUpdateCustomPromptField(entry.identifier, {
													system_prompt: event.currentTarget.checked,
												})
											}
										/>
										<Switch
											label={t('instructions.fields.markerLabel')}
											checked={prompt.marker === true}
											onChange={(event) =>
												onUpdateCustomPromptField(entry.identifier, {
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
										onChange={(event) => onSetPromptContent(entry.identifier, event.currentTarget.value)}
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
		</>
	);
}
