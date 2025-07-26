import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Divider } from '@mui/material';
import { useUnit } from 'effector-react';
import { $isSettingsModalOpen, closeSettingsModal } from '../../model/settings';
import { ApiSettingsSection } from './api_settings_section';
import { SettingsGroup } from './settings_group';

export const SettingsModal: React.FC = () => {
	const isOpen = useUnit($isSettingsModalOpen);

	const handleClose = () => {
		closeSettingsModal();
	};

	const handleSave = () => {
		console.log('save');
	};

	return (
		<Dialog
			open={isOpen}
			onClose={handleClose}
			maxWidth="sm"
			fullWidth
			PaperProps={{
				sx: { minHeight: '600px' },
			}}
		>
			<DialogTitle>Настройки</DialogTitle>

			<DialogContent>
				<Box display="flex" flexDirection="column" gap={3}>
					<ApiSettingsSection />

					<Divider />

					<SettingsGroup title="Модель для работы с RAG" settingKey="rag" />

					<SettingsGroup title="Эмбединг для работы с RAG" settingKey="embedding" />

					<SettingsGroup title="Модель для генерации ответов" settingKey="responseGeneration" />
				</Box>
			</DialogContent>

			<DialogActions>
				<Button onClick={handleSave}>Сохранить</Button>
				<Button onClick={handleClose}>Закрыть</Button>
			</DialogActions>
		</Dialog>
	);
};
