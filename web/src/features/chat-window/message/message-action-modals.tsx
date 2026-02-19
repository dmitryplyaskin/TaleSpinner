import { ActionIcon, Alert, Button, Group, Modal, Paper, ScrollArea, Stack, Switch, Table, Tabs, Text, Textarea } from '@mantine/core';
import { useUnit } from 'effector-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuArrowDown, LuArrowUp, LuStar } from 'react-icons/lu';

import {
	$entries,
	$deleteConfirmState,
	$entryPartsEditorState,
	$promptInspectorState,
	$undoCanonicalizationPickerState,
	batchUpdateEntryPartsFx,
	closeEntryPartsEditorRequested,
	closeUndoCanonicalizationPickerRequested,
	closeDeleteConfirm,
	closePromptInspectorRequested,
	confirmDeleteAction,
	confirmUndoCanonicalizationRequested,
	saveEntryPartsEditorRequested,
	deleteVariantFx,
	selectUndoCanonicalizationStepRequested,
	softDeleteEntriesBulkFx,
	softDeleteEntryFx,
	softDeletePartFx,
	undoCanonicalizationFx,
	undoCanonicalizationRequested,
} from '@model/chat-entry-parts';

import type { Part } from '@shared/types/chat-entry-parts';

function formatTokenShare(value: number, total: number): string {
	if (total <= 0) return '0%';
	return `${((value / total) * 100).toFixed(1)}%`;
}

function buildRawPrompt(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>): string {
	return messages.map((item) => `[${item.role.toUpperCase()}]\n${item.content}`).join('\n\n---\n\n');
}

type DraftPartState = {
	partId: string;
	channel: Part['channel'];
	payloadFormat: Part['payloadFormat'];
	source: Part['source'];
	replacesPartId: string | null;
	deleted: boolean;
	visibilityUi: 'always' | 'never';
	visibilityPrompt: boolean;
	payloadRaw: string;
};

function sortPartsStable(left: Part, right: Part): number {
	if (left.order !== right.order) return left.order - right.order;
	return left.partId.localeCompare(right.partId);
}

function toPartPayloadRaw(part: Part): string {
	if (part.payloadFormat === 'json') {
		if (typeof part.payload === 'string') return part.payload;
		try {
			return JSON.stringify(part.payload, null, 2);
		} catch {
			return String(part.payload);
		}
	}

	if (typeof part.payload === 'string') return part.payload;
	try {
		return JSON.stringify(part.payload);
	} catch {
		return String(part.payload);
	}
}

export const MessageActionModals = () => {
	const { t } = useTranslation();
	const [
		deleteState,
		closeDelete,
		confirmDelete,
		deleteEntryPending,
		deleteVariantPending,
		deletePartPending,
		deleteBulkPending,
		promptInspector,
		closePromptInspector,
		undoPicker,
		closeUndoPicker,
		selectUndoStep,
		confirmUndoFromPicker,
		requestUndoCanonicalization,
		undoPending,
	] = useUnit([
		$deleteConfirmState,
		closeDeleteConfirm,
		confirmDeleteAction,
		softDeleteEntryFx.pending,
		deleteVariantFx.pending,
		softDeletePartFx.pending,
		softDeleteEntriesBulkFx.pending,
		$promptInspectorState,
		closePromptInspectorRequested,
		$undoCanonicalizationPickerState,
		closeUndoCanonicalizationPickerRequested,
		selectUndoCanonicalizationStepRequested,
		confirmUndoCanonicalizationRequested,
		undoCanonicalizationRequested,
		undoCanonicalizationFx.pending,
	]);
	const [entries, entryPartsEditorState, closeEntryPartsEditor, saveEntryPartsEditor, partsEditorSaving] = useUnit([
		$entries,
		$entryPartsEditorState,
		closeEntryPartsEditorRequested,
		saveEntryPartsEditorRequested,
		batchUpdateEntryPartsFx.pending,
	]);
	const [draftParts, setDraftParts] = useState<DraftPartState[]>([]);
	const [orderedPartIds, setOrderedPartIds] = useState<string[]>([]);
	const [mainPartId, setMainPartId] = useState<string>('');

	const deleteBusy =
		deleteState?.kind === 'entry'
			? deleteEntryPending
			: deleteState?.kind === 'variant'
				? deleteVariantPending
				: deleteState?.kind === 'part'
					? deletePartPending
					: deleteState?.kind === 'bulkEntries'
						? deleteBulkPending
						: false;

	const deleteTitle =
		deleteState?.kind === 'entry'
			? t('chat.confirm.deleteMessageTitle')
			: deleteState?.kind === 'variant'
				? t('chat.confirm.deleteVariantTitle')
				: deleteState?.kind === 'part'
					? t('chat.confirm.deletePartTitle')
					: t('chat.confirm.deleteBulkMessagesTitle');
	const deleteBody =
		deleteState?.kind === 'entry'
			? t('chat.confirm.deleteMessageBody')
			: deleteState?.kind === 'variant'
				? t('chat.confirm.deleteVariantBody')
				: deleteState?.kind === 'part'
					? t('chat.confirm.deletePartBody')
					: t('chat.confirm.deleteBulkMessagesBody', { count: deleteState?.kind === 'bulkEntries' ? deleteState.count : 0 });

	const total = promptInspector.data?.prompt.approxTokens.total ?? 0;
	const roleRows = promptInspector.data
		? [
				{
					label: t('chat.promptInspector.roles.system'),
					value: promptInspector.data.prompt.approxTokens.byRole.system,
				},
				{
					label: t('chat.promptInspector.roles.user'),
					value: promptInspector.data.prompt.approxTokens.byRole.user,
				},
				{
					label: t('chat.promptInspector.roles.assistant'),
					value: promptInspector.data.prompt.approxTokens.byRole.assistant,
				},
			]
		: [];
	const sectionRows = promptInspector.data
		? [
				{
					label: t('chat.promptInspector.sections.systemInstruction'),
					value: promptInspector.data.prompt.approxTokens.sections.systemInstruction,
				},
				{
					label: t('chat.promptInspector.sections.chatHistory'),
					value: promptInspector.data.prompt.approxTokens.sections.chatHistory,
				},
				{
					label: t('chat.promptInspector.sections.worldInfoBefore'),
					value: promptInspector.data.prompt.approxTokens.sections.worldInfoBefore,
				},
				{
					label: t('chat.promptInspector.sections.worldInfoAfter'),
					value: promptInspector.data.prompt.approxTokens.sections.worldInfoAfter,
				},
				{
					label: t('chat.promptInspector.sections.worldInfoDepth'),
					value: promptInspector.data.prompt.approxTokens.sections.worldInfoDepth,
				},
				{
					label: t('chat.promptInspector.sections.worldInfoOutlets'),
					value: promptInspector.data.prompt.approxTokens.sections.worldInfoOutlets,
				},
				{
					label: t('chat.promptInspector.sections.worldInfoAN'),
					value: promptInspector.data.prompt.approxTokens.sections.worldInfoAN,
				},
				{
					label: t('chat.promptInspector.sections.worldInfoEM'),
					value: promptInspector.data.prompt.approxTokens.sections.worldInfoEM,
				},
			]
		: [];
	const turnCanonicalizations = promptInspector.data?.turnCanonicalizations ?? [];
	const canConfirmUndoFromPicker =
		undoPicker.open && undoPicker.steps.length > 0 && typeof undoPicker.selectedPartId === 'string';
	const editedEntry = useMemo(() => {
		if (!entryPartsEditorState.entryId) return null;
		return entries.find((item) => item.entry.entryId === entryPartsEditorState.entryId) ?? null;
	}, [entries, entryPartsEditorState.entryId]);
	const sourceParts = useMemo(
		() =>
			(editedEntry?.variant?.parts ?? [])
				.filter((part) => !part.softDeleted)
				.slice()
				.sort(sortPartsStable),
		[editedEntry?.variant?.parts],
	);

	useEffect(() => {
		if (!entryPartsEditorState.open) return;
		const nextDraft = sourceParts.map((part) => ({
			partId: part.partId,
			channel: part.channel,
			payloadFormat: part.payloadFormat,
			source: part.source,
			replacesPartId: typeof part.replacesPartId === 'string' && part.replacesPartId.trim().length > 0 ? part.replacesPartId : null,
			deleted: false,
			visibilityUi: part.visibility?.ui === 'never' ? ('never' as const) : ('always' as const),
			visibilityPrompt: Boolean(part.visibility?.prompt),
			payloadRaw: toPartPayloadRaw(part),
		}));
		setDraftParts(nextDraft);
		setOrderedPartIds(nextDraft.map((part) => part.partId));
		const fallbackMain =
			nextDraft.find((part) => part.channel === 'main') ??
			nextDraft.find((part) => part.payloadFormat === 'text' || part.payloadFormat === 'markdown') ??
			nextDraft[0] ??
			null;
		setMainPartId(fallbackMain?.partId ?? '');
	}, [entryPartsEditorState.open, sourceParts]);

	const orderIndexByPartId = useMemo(() => {
		const map = new Map<string, number>();
		orderedPartIds.forEach((partId, index) => {
			map.set(partId, index);
		});
		return map;
	}, [orderedPartIds]);

	const orderedDraftParts = useMemo(() => {
		return draftParts
			.slice()
			.sort((left, right) => {
				const leftIndex = orderIndexByPartId.get(left.partId);
				const rightIndex = orderIndexByPartId.get(right.partId);
				if (typeof leftIndex === 'number' && typeof rightIndex === 'number') return leftIndex - rightIndex;
				if (typeof leftIndex === 'number') return -1;
				if (typeof rightIndex === 'number') return 1;
				return left.partId.localeCompare(right.partId);
			});
	}, [draftParts, orderIndexByPartId]);

	const nonDeletedPartIds = useMemo(
		() => draftParts.filter((part) => !part.deleted).map((part) => part.partId),
		[draftParts],
	);
	const nonDeletedPartSet = useMemo(() => new Set(nonDeletedPartIds), [nonDeletedPartIds]);
	const jsonInvalidPartIds = useMemo(() => {
		const invalid = new Set<string>();
		for (const part of draftParts) {
			if (part.deleted || part.payloadFormat !== 'json') continue;
			try {
				JSON.parse(part.payloadRaw);
			} catch {
				invalid.add(part.partId);
			}
		}
		return invalid;
	}, [draftParts]);
	const mainDraftPart = useMemo(
		() => draftParts.find((part) => part.partId === mainPartId) ?? null,
		[draftParts, mainPartId],
	);
	const orderMatchesVisibleParts = useMemo(() => {
		if (orderedPartIds.length !== nonDeletedPartIds.length) return false;
		const seen = new Set<string>();
		for (const partId of orderedPartIds) {
			if (seen.has(partId)) return false;
			if (!nonDeletedPartSet.has(partId)) return false;
			seen.add(partId);
		}
		return true;
	}, [orderedPartIds, nonDeletedPartIds.length, nonDeletedPartSet]);
	const mainPartValid = Boolean(
		mainDraftPart &&
			!mainDraftPart.deleted &&
			(mainDraftPart.payloadFormat === 'text' || mainDraftPart.payloadFormat === 'markdown'),
	);
	const canSavePartsEditor =
		entryPartsEditorState.open &&
		Boolean(editedEntry?.variant) &&
		nonDeletedPartIds.length > 0 &&
		orderMatchesVisibleParts &&
		mainPartValid &&
		jsonInvalidPartIds.size === 0 &&
		!partsEditorSaving;

	const updateDraftPart = (partId: string, updater: (part: DraftPartState) => DraftPartState) => {
		setDraftParts((prev) => prev.map((part) => (part.partId === partId ? updater(part) : part)));
	};

	const movePart = (partId: string, direction: 'up' | 'down') => {
		setOrderedPartIds((prev) => {
			const fromIndex = prev.indexOf(partId);
			if (fromIndex < 0) return prev;
			if (direction === 'up' && fromIndex === 0) return prev;
			if (direction === 'down' && fromIndex === prev.length - 1) return prev;
			const targetIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
			const next = prev.slice();
			const tmp = next[targetIndex];
			next[targetIndex] = next[fromIndex] as string;
			next[fromIndex] = tmp as string;
			return next;
		});
	};

	const togglePartDeleted = (partId: string, deleted: boolean) => {
		const nextDraftParts = draftParts.map((part) => (part.partId === partId ? { ...part, deleted } : part));
		setDraftParts(nextDraftParts);
		setOrderedPartIds((prev) => {
			if (deleted) return prev.filter((id) => id !== partId);
			if (prev.includes(partId)) return prev;
			return [...prev, partId];
		});
		if (!deleted || mainPartId !== partId) return;
		const fallbackMain =
			nextDraftParts.find(
				(part) => !part.deleted && (part.payloadFormat === 'text' || part.payloadFormat === 'markdown'),
			) ??
			nextDraftParts.find((part) => !part.deleted) ??
			null;
		setMainPartId(fallbackMain?.partId ?? '');
	};

	const savePartsEditorChanges = () => {
		if (!editedEntry?.variant) return;
		if (!canSavePartsEditor) return;
		let payloadParts: Array<{
			partId: string;
			deleted: boolean;
			visibility: { ui: 'always' | 'never'; prompt: boolean };
			payload: string | object | number | boolean | null;
		}> = [];
		try {
			payloadParts = draftParts.map((part) => {
				let payload: string | object | number | boolean | null = part.payloadRaw;
				if (part.payloadFormat === 'json') {
					payload = JSON.parse(part.payloadRaw) as string | object | number | boolean | null;
				}
				return {
					partId: part.partId,
					deleted: part.deleted,
					visibility: {
						ui: part.visibilityUi,
						prompt: part.visibilityPrompt,
					},
					payload,
				};
			});
		} catch {
			return;
		}
		saveEntryPartsEditor({
			entryId: editedEntry.entry.entryId,
			variantId: editedEntry.variant.variantId,
			mainPartId,
			orderedPartIds,
			parts: payloadParts,
		});
	};

	return (
		<>
			{deleteState && (
				<Modal opened onClose={() => closeDelete()} title={deleteTitle} centered closeOnClickOutside={!deleteBusy} closeOnEscape={!deleteBusy}>
					<Stack gap="md">
						<Text size="sm">{deleteBody}</Text>
						<Group justify="flex-end">
							<Button variant="subtle" onClick={() => closeDelete()} disabled={deleteBusy}>
								{t('common.cancel')}
							</Button>
							<Button color="red" onClick={() => confirmDelete()} loading={deleteBusy}>
								{t('common.delete')}
							</Button>
						</Group>
					</Stack>
				</Modal>
			)}

			<Modal
				opened={entryPartsEditorState.open}
				onClose={() => {
					if (partsEditorSaving) return;
					closeEntryPartsEditor();
				}}
				title={t('chat.partsEditor.title')}
				centered
				size="xl"
				closeOnClickOutside={!partsEditorSaving}
				closeOnEscape={!partsEditorSaving}
			>
				<Stack gap="sm">
					{!editedEntry?.variant && (
						<Text size="sm" c="dimmed">
							{t('chat.partsEditor.empty')}
						</Text>
					)}
					{editedEntry?.variant && (
						<>
							{nonDeletedPartIds.length === 0 && (
								<Alert color="red" variant="light">
									{t('chat.partsEditor.validation.noParts')}
								</Alert>
							)}
							{!mainPartValid && (
								<Alert color="red" variant="light">
									{t('chat.partsEditor.validation.mainPart')}
								</Alert>
							)}
							{jsonInvalidPartIds.size > 0 && (
								<Alert color="red" variant="light">
									{t('chat.partsEditor.validation.json')}
								</Alert>
							)}
							<ScrollArea.Autosize mah={460}>
								<Stack gap="xs">
									{orderedDraftParts.map((part) => {
										const orderIndex = orderedPartIds.indexOf(part.partId);
										const isMain = part.partId === mainPartId;
										const canSelectAsMain =
											!part.deleted && (part.payloadFormat === 'text' || part.payloadFormat === 'markdown');
										const isJsonInvalid =
											part.payloadFormat === 'json' && jsonInvalidPartIds.has(part.partId);
										return (
											<Paper key={part.partId} withBorder radius="sm" p="sm" style={part.deleted ? { opacity: 0.6 } : undefined}>
												<Stack gap="xs">
													<Group justify="space-between" align="flex-start" wrap="nowrap">
														<Stack gap={0}>
															<Text size="sm" fw={600}>
																{part.partId}
															</Text>
															<Text size="xs" c="dimmed">
																{t('chat.partsEditor.meta.channel')}: {part.channel} | {t('chat.partsEditor.meta.source')}:{' '}
																{part.source}
															</Text>
															<Text size="xs" c="dimmed">
																{t('chat.partsEditor.meta.format')}: {part.payloadFormat}
															</Text>
															{part.replacesPartId && (
																<Text size="xs" c="dimmed">
																	{t('chat.partsEditor.meta.replaces')}: {part.replacesPartId}
																</Text>
															)}
														</Stack>
														<Group gap={6} align="center" wrap="nowrap">
															<ActionIcon
																variant="subtle"
																onClick={() => movePart(part.partId, 'up')}
																disabled={part.deleted || orderIndex <= 0}
																aria-label={t('chat.partsEditor.actions.moveUp')}
															>
																<LuArrowUp size={14} />
															</ActionIcon>
															<ActionIcon
																variant="subtle"
																onClick={() => movePart(part.partId, 'down')}
																disabled={part.deleted || orderIndex < 0 || orderIndex >= orderedPartIds.length - 1}
																aria-label={t('chat.partsEditor.actions.moveDown')}
															>
																<LuArrowDown size={14} />
															</ActionIcon>
															<Button
																size="xs"
																variant={isMain ? 'filled' : 'light'}
																color={isMain ? 'yellow' : 'gray'}
																leftSection={<LuStar size={12} />}
																disabled={!canSelectAsMain}
																onClick={() => setMainPartId(part.partId)}
															>
																{isMain
																	? t('chat.partsEditor.actions.mainSelected')
																	: t('chat.partsEditor.actions.makeMain')}
															</Button>
														</Group>
													</Group>
													<Group gap="md" wrap="wrap">
														<Switch
															checked={part.deleted}
															label={t('chat.partsEditor.fields.deleted')}
															onChange={(event) => togglePartDeleted(part.partId, event.currentTarget.checked)}
														/>
														<Switch
															checked={part.visibilityUi === 'always'}
															disabled={part.deleted}
															label={t('chat.partsEditor.fields.showInUi')}
															onChange={(event) => {
																const checked = event.currentTarget.checked;
																updateDraftPart(part.partId, (prev) => ({
																	...prev,
																	visibilityUi: checked ? 'always' : 'never',
																}));
															}}
														/>
														<Switch
															checked={part.visibilityPrompt}
															disabled={part.deleted}
															label={t('chat.partsEditor.fields.includeInPrompt')}
															onChange={(event) => {
																const checked = event.currentTarget.checked;
																updateDraftPart(part.partId, (prev) => ({
																	...prev,
																	visibilityPrompt: checked,
																}));
															}}
														/>
													</Group>
													<Textarea
														label={
															part.payloadFormat === 'json'
																? t('chat.partsEditor.fields.payloadJson')
																: t('chat.partsEditor.fields.payloadText')
														}
														value={part.payloadRaw}
														disabled={part.deleted}
														minRows={part.payloadFormat === 'json' ? 5 : 3}
														autosize
														onChange={(event) => {
															const value = event.currentTarget.value;
															updateDraftPart(part.partId, (prev) => ({
																...prev,
																payloadRaw: value,
															}));
														}}
													/>
													{isJsonInvalid && (
														<Text size="xs" c="red">
															{t('chat.partsEditor.validation.jsonPart', { partId: part.partId })}
														</Text>
													)}
												</Stack>
											</Paper>
										);
									})}
								</Stack>
							</ScrollArea.Autosize>
							<Group justify="flex-end">
								<Button variant="subtle" disabled={partsEditorSaving} onClick={() => closeEntryPartsEditor()}>
									{t('common.cancel')}
								</Button>
								<Button onClick={savePartsEditorChanges} loading={partsEditorSaving} disabled={!canSavePartsEditor}>
									{t('common.save')}
								</Button>
							</Group>
						</>
					)}
				</Stack>
			</Modal>

			<Modal
				opened={promptInspector.open}
				onClose={() => closePromptInspector()}
				title={t('chat.promptInspector.title')}
				centered
				size="xl"
			>
				<Stack gap="sm">
					{promptInspector.loading && <Text size="sm">{t('chat.promptInspector.loading')}</Text>}
					{!promptInspector.loading && promptInspector.error && (
						<Text size="sm" c="red">
							{t('chat.promptInspector.error')}: {promptInspector.error}
						</Text>
					)}
					{!promptInspector.loading && !promptInspector.error && promptInspector.data && (
						<>
							<Group justify="space-between" align="flex-start">
								<Stack gap={0}>
									<Text size="sm">
										{t('chat.promptInspector.generationId')}: {promptInspector.data.generationId}
									</Text>
									<Text size="xs" c="dimmed">
										{t('chat.promptInspector.estimator')}: {promptInspector.data.estimator}
									</Text>
								</Stack>
								<Text size="sm">
									{t('chat.promptInspector.totalTokens')}: {promptInspector.data.prompt.approxTokens.total}
								</Text>
							</Group>
							<Tabs defaultValue="tokens">
								<Tabs.List>
									<Tabs.Tab value="tokens">{t('chat.promptInspector.tabs.tokens')}</Tabs.Tab>
									<Tabs.Tab value="raw">{t('chat.promptInspector.tabs.raw')}</Tabs.Tab>
								</Tabs.List>
								<Tabs.Panel value="tokens" pt="sm">
									<Stack gap="sm">
										<Paper withBorder p="sm" radius="md">
											<Text size="sm" fw={600} mb={6}>
												{t('chat.promptInspector.byRole')}
											</Text>
											<Table striped highlightOnHover withTableBorder>
												<Table.Thead>
													<Table.Tr>
														<Table.Th>{t('chat.promptInspector.column.part')}</Table.Th>
														<Table.Th>{t('chat.promptInspector.column.tokens')}</Table.Th>
														<Table.Th>{t('chat.promptInspector.column.share')}</Table.Th>
													</Table.Tr>
												</Table.Thead>
												<Table.Tbody>
													{roleRows.map((row) => (
														<Table.Tr key={row.label}>
															<Table.Td>{row.label}</Table.Td>
															<Table.Td>{row.value}</Table.Td>
															<Table.Td>{formatTokenShare(row.value, total)}</Table.Td>
														</Table.Tr>
													))}
												</Table.Tbody>
											</Table>
										</Paper>
										<Paper withBorder p="sm" radius="md">
											<Text size="sm" fw={600} mb={6}>
												{t('chat.promptInspector.bySections')}
											</Text>
											<Table striped highlightOnHover withTableBorder>
												<Table.Thead>
													<Table.Tr>
														<Table.Th>{t('chat.promptInspector.column.part')}</Table.Th>
														<Table.Th>{t('chat.promptInspector.column.tokens')}</Table.Th>
														<Table.Th>{t('chat.promptInspector.column.share')}</Table.Th>
													</Table.Tr>
												</Table.Thead>
												<Table.Tbody>
													{sectionRows.map((row) => (
														<Table.Tr key={row.label}>
															<Table.Td>{row.label}</Table.Td>
															<Table.Td>{row.value}</Table.Td>
															<Table.Td>{formatTokenShare(row.value, total)}</Table.Td>
														</Table.Tr>
													))}
												</Table.Tbody>
											</Table>
										</Paper>
									</Stack>
								</Tabs.Panel>
								<Tabs.Panel value="raw" pt="sm">
									<Stack gap="sm">
										<Paper withBorder p="sm" radius="md">
											<ScrollArea.Autosize mah={420}>
												<Text
													size="sm"
													style={{
														whiteSpace: 'pre-wrap',
														wordBreak: 'break-word',
														fontFamily:
															'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
													}}
												>
													{buildRawPrompt(promptInspector.data.prompt.messages)}
												</Text>
											</ScrollArea.Autosize>
										</Paper>
										{turnCanonicalizations.length > 0 && (
											<Paper withBorder p="sm" radius="md">
												<Text size="sm" fw={600} mb={6}>
													{t('chat.promptInspector.turnCanonicalization.title')}
												</Text>
												<ScrollArea.Autosize mah={320}>
													<Stack gap="xs">
														{turnCanonicalizations.map((item, idx) => {
															const canUndo = typeof item.canonicalPartId === 'string' && item.canonicalPartId.length > 0;
															return (
																<Paper key={`${item.opId}-${item.committedAt}-${idx}`} withBorder p="xs" radius="sm">
																	<Group justify="space-between" align="flex-start" mb={4}>
																		<Stack gap={0}>
																			<Text size="xs" c="dimmed">
																				#{idx + 1}
																			</Text>
																			<Text size="xs" c="dimmed">
																				{t('chat.promptInspector.turnCanonicalization.hook')}: {item.hook}
																			</Text>
																			<Text size="xs" c="dimmed">
																				{t('chat.promptInspector.turnCanonicalization.opId')}: {item.opId}
																			</Text>
																			<Text size="xs" c="dimmed">
																				{t('chat.promptInspector.turnCanonicalization.committedAt')}: {item.committedAt}
																			</Text>
																		</Stack>
																		<Button
																			size="xs"
																			variant="light"
																			color="orange"
																			disabled={!canUndo || undoPending}
																			loading={undoPending}
																			onClick={() => {
																				if (!canUndo) return;
																				requestUndoCanonicalization({ partId: item.canonicalPartId as string });
																			}}
																		>
																			{t('chat.promptInspector.turnCanonicalization.undo')}
																		</Button>
																	</Group>
																	<Text
																		size="sm"
																		style={{
																			whiteSpace: 'pre-wrap',
																			wordBreak: 'break-word',
																			fontFamily:
																				'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
																		}}
																	>
																		[{t('chat.promptInspector.turnCanonicalization.before')}]
																		{'\n'}
																		{item.beforeText}
																		{'\n\n'}
																		[{t('chat.promptInspector.turnCanonicalization.after')}]
																		{'\n'}
																		{item.afterText}
																	</Text>
																	{!canUndo && (
																		<Text size="xs" c="dimmed" mt={4}>
																			{t('chat.promptInspector.turnCanonicalization.undoUnavailable')}
																		</Text>
																	)}
																</Paper>
															);
														})}
													</Stack>
												</ScrollArea.Autosize>
											</Paper>
										)}
									</Stack>
								</Tabs.Panel>
							</Tabs>
						</>
					)}
					{!promptInspector.loading && !promptInspector.error && !promptInspector.data && (
						<Text size="sm" c="dimmed">
							{t('chat.promptInspector.empty')}
						</Text>
					)}
				</Stack>
			</Modal>

			<Modal
				opened={undoPicker.open}
				onClose={() => {
					if (undoPending) return;
					closeUndoPicker();
				}}
				title={t('chat.undoCanonicalization.title')}
				centered
				size="lg"
				closeOnEscape={!undoPending}
				closeOnClickOutside={!undoPending}
			>
				<Stack gap="sm">
					{undoPicker.steps.length === 0 ? (
						<Text size="sm" c="dimmed">
							{t('chat.undoCanonicalization.empty')}
						</Text>
					) : (
						<>
							<Text size="sm" c="dimmed">
								{t('chat.undoCanonicalization.selectStep')}
							</Text>
							<ScrollArea.Autosize mah={320}>
								<Stack gap="xs">
									{undoPicker.steps.map((step, idx) => {
										const selected = undoPicker.selectedPartId === step.partId;
										return (
											<Paper key={step.partId} withBorder p="xs" radius="sm">
												<Group justify="space-between" align="flex-start" mb={6}>
													<Stack gap={0}>
														<Text size="sm" fw={600}>
															#{idx + 1}
														</Text>
														<Text size="xs" c="dimmed">
															{step.partId}
														</Text>
													</Stack>
													<Button
														size="xs"
														variant={selected ? 'filled' : 'light'}
														color={selected ? 'orange' : 'gray'}
														disabled={undoPending}
														onClick={() => selectUndoStep({ partId: step.partId })}
													>
														{selected ? t('chat.undoCanonicalization.selected') : t('chat.undoCanonicalization.select')}
													</Button>
												</Group>
												<Text
													size="sm"
													style={{
														whiteSpace: 'pre-wrap',
														wordBreak: 'break-word',
														fontFamily:
															'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
													}}
												>
													[{t('chat.promptInspector.turnCanonicalization.before')}]
													{'\n'}
													{step.beforeText}
													{'\n\n'}
													[{t('chat.promptInspector.turnCanonicalization.after')}]
													{'\n'}
													{step.afterText}
												</Text>
											</Paper>
										);
									})}
								</Stack>
							</ScrollArea.Autosize>
						</>
					)}
					<Group justify="flex-end">
						<Button variant="subtle" disabled={undoPending} onClick={() => closeUndoPicker()}>
							{t('common.cancel')}
						</Button>
						<Button
							color="orange"
							loading={undoPending}
							disabled={!canConfirmUndoFromPicker}
							onClick={() => confirmUndoFromPicker()}
						>
							{t('chat.undoCanonicalization.confirm')}
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
};
