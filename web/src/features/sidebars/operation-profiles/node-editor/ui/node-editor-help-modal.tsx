import { Kbd, List, Modal, Stack, Text } from '@mantine/core';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Z_INDEX } from '@ui/z-index';

type Props = {
	opened: boolean;
	onClose: () => void;
};

export const NodeEditorHelpModal: React.FC<Props> = ({ opened, onClose }) => {
	const { t } = useTranslation();

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title={t('operationProfiles.nodeEditor.help.title')}
			zIndex={Z_INDEX.overlay.modal + 1}
			centered
		>
			<Stack gap="md">
				<Stack gap="xs">
					<Text fw={700}>{t('operationProfiles.nodeEditor.help.hotkeysTitle')}</Text>
					<List spacing="xs" size="sm">
						<List.Item>
							<Kbd>Shift</Kbd> {t('operationProfiles.nodeEditor.help.selectionDrag')}
						</List.Item>
						<List.Item>
							<Kbd>Ctrl</Kbd> / <Kbd>Cmd</Kbd> / <Kbd>Shift</Kbd> {t('operationProfiles.nodeEditor.help.multiSelect')}
						</List.Item>
						<List.Item>
							<Kbd>Delete</Kbd> / <Kbd>Backspace</Kbd> {t('operationProfiles.nodeEditor.help.deleteSelected')}
						</List.Item>
					</List>
				</Stack>

				<Stack gap="xs">
					<Text fw={700}>{t('operationProfiles.nodeEditor.help.contextTitle')}</Text>
					<List spacing="xs" size="sm">
						<List.Item>{t('operationProfiles.nodeEditor.help.contextPane')}</List.Item>
						<List.Item>{t('operationProfiles.nodeEditor.help.contextNode')}</List.Item>
						<List.Item>{t('operationProfiles.nodeEditor.help.contextEdge')}</List.Item>
					</List>
				</Stack>
			</Stack>
		</Modal>
	);
};
