import { Button, Group, Modal, Paper, ScrollArea, Stack, Table, Tabs, Text } from '@mantine/core';
import { useUnit } from 'effector-react';
import { useTranslation } from 'react-i18next';

import {
	$deleteConfirmState,
	$promptInspectorState,
	$undoCanonicalizationPickerState,
	closeUndoCanonicalizationPickerRequested,
	closeDeleteConfirm,
	closePromptInspectorRequested,
	confirmDeleteAction,
	confirmUndoCanonicalizationRequested,
	deleteVariantFx,
	selectUndoCanonicalizationStepRequested,
	softDeleteEntriesBulkFx,
	softDeleteEntryFx,
	softDeletePartFx,
	undoCanonicalizationFx,
	undoCanonicalizationRequested,
} from '@model/chat-entry-parts';

function formatTokenShare(value: number, total: number): string {
	if (total <= 0) return '0%';
	return `${((value / total) * 100).toFixed(1)}%`;
}

function buildRawPrompt(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>): string {
	return messages.map((item) => `[${item.role.toUpperCase()}]\n${item.content}`).join('\n\n---\n\n');
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
