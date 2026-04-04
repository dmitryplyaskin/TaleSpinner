import { Button, Group, Modal, Stack } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { StPromptBlockFormFields } from './st-prompt-block-form-fields';
import {
	createEmptyPromptBlockFields,
	type PromptBlockFields,
} from './st-prompt-blocks';

type StPromptBlockCreateModalProps = {
	opened: boolean;
	onClose: () => void;
	onCreate: (draft: PromptBlockFields) => void;
};

export function StPromptBlockCreateModal({
	opened,
	onClose,
	onCreate,
}: StPromptBlockCreateModalProps) {
	const { t } = useTranslation();
	const [draft, setDraft] = useState<PromptBlockFields>(createEmptyPromptBlockFields);

	useEffect(() => {
		if (!opened) {
			setDraft(createEmptyPromptBlockFields());
		}
	}, [opened]);

	const handleCreate = () => {
		if (!draft.name.trim()) return;
		onCreate(draft);
		setDraft(createEmptyPromptBlockFields());
		onClose();
	};

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title={t('instructions.dialogs.createPromptBlockTitle')}
			centered
			size="xl"
		>
			<Stack gap="md">
				<StPromptBlockFormFields
					value={draft}
					onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
				/>

				<Group justify="flex-end">
					<Button variant="default" onClick={onClose}>
						{t('common.cancel')}
					</Button>
					<Button onClick={handleCreate} disabled={!draft.name.trim()}>
						{t('common.create')}
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}
