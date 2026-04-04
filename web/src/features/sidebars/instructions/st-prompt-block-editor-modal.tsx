import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
	areStPromptBlockEditorStatesEqual,
	resolveStPromptBlockEditorCloseAction,
	type StPromptBlockEditorState,
} from './st-prompt-block-editor-state';
import { StPromptBlockFormFields } from './st-prompt-block-form-fields';

type StPromptBlockEditorModalProps = {
	opened: boolean;
	value: StPromptBlockEditorState | null;
	onClose: () => void;
	onSave: (draft: StPromptBlockEditorState) => void;
};

export function StPromptBlockEditorModal({
	opened,
	value,
	onClose,
	onSave,
}: StPromptBlockEditorModalProps) {
	const { t } = useTranslation();
	const [initialValue, setInitialValue] = useState<StPromptBlockEditorState | null>(null);
	const [draft, setDraft] = useState<StPromptBlockEditorState | null>(null);
	const [confirmCloseOpened, setConfirmCloseOpened] = useState(false);

	useEffect(() => {
		if (!opened || !value) {
			setConfirmCloseOpened(false);
			return;
		}

		setInitialValue(value);
		setDraft(value);
		setConfirmCloseOpened(false);
	}, [opened, value]);

	const hasChanges = useMemo(() => {
		if (!initialValue || !draft) return false;
		return !areStPromptBlockEditorStatesEqual(initialValue, draft);
	}, [draft, initialValue]);

	const requestClose = () => {
		if (!initialValue || !draft) {
			onClose();
			return;
		}

		const action = resolveStPromptBlockEditorCloseAction(initialValue, draft);
		if (action === 'close') {
			onClose();
			return;
		}

		setConfirmCloseOpened(true);
	};

	const handleSave = () => {
		if (!draft) return;
		onSave(draft);
		setConfirmCloseOpened(false);
		onClose();
	};

	return (
		<>
			<Modal
				opened={opened && draft !== null}
				onClose={requestClose}
				title={t('instructions.dialogs.editPromptBlockTitle', {
					name: draft?.name || '',
				})}
				centered
				size="xl"
			>
				{draft ? (
					<Stack gap="md">
						<StPromptBlockFormFields
							value={{
								name: draft.name,
								role: draft.role,
								content: draft.content,
							}}
							contentReadOnly={draft.contentReadOnly}
							onChange={(patch) =>
								setDraft((current) => (current ? { ...current, ...patch } : current))
							}
						/>

						<Group justify="flex-end">
							<Button variant="default" onClick={requestClose}>
								{t('common.close')}
							</Button>
							<Button onClick={handleSave} disabled={!hasChanges}>
								{t('common.save')}
							</Button>
						</Group>
					</Stack>
				) : null}
			</Modal>

			<Modal
				opened={confirmCloseOpened}
				onClose={() => setConfirmCloseOpened(false)}
				title={t('instructions.dialogs.savePromptBlockChangesTitle')}
				centered
			>
				<Stack gap="md">
					<Text>{t('instructions.confirm.savePromptBlockChanges')}</Text>
					<Group justify="flex-end">
						<Button variant="default" onClick={() => setConfirmCloseOpened(false)}>
							{t('common.cancel')}
						</Button>
						<Button
							variant="default"
							color="red"
							onClick={() => {
								setConfirmCloseOpened(false);
								onClose();
							}}
						>
							{t('instructions.actions.discardBlockChanges')}
						</Button>
						<Button onClick={handleSave}>{t('common.save')}</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
