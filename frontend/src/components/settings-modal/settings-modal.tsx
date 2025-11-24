import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, IconButton, Typography } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useUnit } from 'effector-react';
import { $isSettingsModalOpen, closeSettingsModal, $settings, saveSettingsFx } from '../../model/settings';
import { AppSettings } from '../../../../shared/types/settings';
import { ApiSettingsSection } from './api-settings-section';
import { InterfaceSettingsSection } from './interface-settings-section';
import { SettingsGroup } from './settings-group';
import { TabsSystem, TabPanel } from './tabs-system';

export const SettingsModal: React.FC = () => {
	const isOpen = useUnit($isSettingsModalOpen);
	const currentSettings = useUnit($settings);
	const [currentTab, setCurrentTab] = useState(0);

	const form = useForm<AppSettings>({
		defaultValues: currentSettings,
		values: currentSettings, // Синхронизация с актуальными настройками из стора
	});

	const handleClose = () => {
		form.reset(); // Сбрасываем форму при закрытии
		closeSettingsModal();
	};

	const onSubmit = (data: AppSettings) => {
		saveSettingsFx(data);
		closeSettingsModal();
	};

	const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
		setCurrentTab(newValue);
	};

	return (
		<Dialog
			open={isOpen}
			onClose={handleClose}
			fullScreen
			PaperProps={{
				sx: {
					display: 'flex',
					flexDirection: 'column',
				},
			}}
		>
			<DialogTitle
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					borderBottom: 1,
					borderColor: 'divider',
				}}
			>
				<Typography variant="h5">Настройки</Typography>
				<IconButton onClick={handleClose} edge="end" aria-label="закрыть">
					<Close />
				</IconButton>
			</DialogTitle>

			<TabsSystem currentTab={currentTab} onTabChange={handleTabChange} />

			<DialogContent sx={{ flex: 1, overflow: 'auto', p: 0 }}>
				<form onSubmit={form.handleSubmit(onSubmit)} id="settings-form">
					<TabPanel value={currentTab} index={0}>
						<Box display="flex" flexDirection="column" gap={4}>
							<ApiSettingsSection form={form} />

							<SettingsGroup title="Модель для работы с RAG" settingKey="rag" form={form} />

							<SettingsGroup title="Эмбединг для работы с RAG" settingKey="embedding" form={form} />

							<SettingsGroup title="Модель для генерации ответов" settingKey="responseGeneration" form={form} />
						</Box>
					</TabPanel>

					<TabPanel value={currentTab} index={1}>
						<InterfaceSettingsSection form={form} />
					</TabPanel>
				</form>
			</DialogContent>

			<DialogActions sx={{ borderTop: 1, borderColor: 'divider', p: 2 }}>
				<Button type="submit" form="settings-form" variant="contained" size="large">
					Сохранить
				</Button>
				<Button onClick={handleClose} size="large">
					Отмена
				</Button>
			</DialogActions>
		</Dialog>
	);
};
