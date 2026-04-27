import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import { useUnit } from 'effector-react';
import { useTranslation } from 'react-i18next';

import {
	$deleteConfirmState,
	closeDeleteConfirm,
	confirmDeleteAction,
	deleteVariantFx,
	softDeleteEntriesBulkFx,
	softDeleteEntryFx,
	softDeletePartFx,
} from '@model/chat-entry-parts';

export const DeleteConfirmModal = () => {
	const { t } = useTranslation();
	const [deleteState, closeDelete, confirmDelete, deleteEntryPending, deleteVariantPending, deletePartPending, deleteBulkPending] = useUnit([
		$deleteConfirmState,
		closeDeleteConfirm,
		confirmDeleteAction,
		softDeleteEntryFx.pending,
		deleteVariantFx.pending,
		softDeletePartFx.pending,
		softDeleteEntriesBulkFx.pending,
	]);

	if (!deleteState) return null;

	const deleteBusy =
		deleteState.kind === 'entry'
			? deleteEntryPending
			: deleteState.kind === 'variant'
				? deleteVariantPending
				: deleteState.kind === 'part'
					? deletePartPending
					: deleteBulkPending;

	const deleteTitle =
		deleteState.kind === 'entry'
			? t('chat.confirm.deleteMessageTitle')
			: deleteState.kind === 'variant'
				? t('chat.confirm.deleteVariantTitle')
				: deleteState.kind === 'part'
					? t('chat.confirm.deletePartTitle')
					: t('chat.confirm.deleteBulkMessagesTitle');
	const deleteBody =
		deleteState.kind === 'entry'
			? t('chat.confirm.deleteMessageBody')
			: deleteState.kind === 'variant'
				? t('chat.confirm.deleteVariantBody')
				: deleteState.kind === 'part'
					? t('chat.confirm.deletePartBody')
					: t('chat.confirm.deleteBulkMessagesBody', { count: deleteState.count });

	return (
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
	);
};
