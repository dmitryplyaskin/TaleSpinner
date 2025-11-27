/**
 * Боковая панель настроек
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Drawer, Box, Typography, IconButton, Button } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useUnit } from 'effector-react';
import { $isSettingsOpen, closeSettings, $settings, saveSettingsFx } from '../model';
import type { AppSettings } from '../model';
import { TabsSystem, TabPanel } from './tabs-system';
import { ApiSection } from './api-section';
import { InterfaceSection } from './interface-section';

const DRAWER_WIDTH = 420;

export const SettingsDrawer: React.FC = () => {
	const isOpen = useUnit($isSettingsOpen);
	const currentSettings = useUnit($settings);
	const [currentTab, setCurrentTab] = useState(0);

	const form = useForm<AppSettings>({
		defaultValues: currentSettings,
		values: currentSettings,
	});

	const handleClose = () => {
		form.reset();
		closeSettings();
	};

	const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
		setCurrentTab(newValue);
	};

	const onSubmit = (data: AppSettings) => {
		const settingsToSave = {
			api: {
				model: data.api.model,
				providerOrder: data.api.providerOrder,
			},
			rag: data.rag,
			embedding: data.embedding,
			responseGeneration: data.responseGeneration,
			llmOutputLanguage: data.llmOutputLanguage,
		};

		saveSettingsFx(settingsToSave);
	};

	return (
		<Drawer
			anchor="right"
			open={isOpen}
			onClose={handleClose}
			PaperProps={{
				sx: {
					width: DRAWER_WIDTH,
					bgcolor: 'background.paper',
					backgroundImage: 'none',
				},
			}}
		>
			{/* Header */}
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					px: 2,
					py: 1.5,
					borderBottom: 1,
					borderColor: 'divider',
				}}
			>
				<Typography variant="h6" fontWeight={600}>
					Настройки
				</Typography>
				<IconButton onClick={handleClose} size="small" edge="end">
					<Close />
				</IconButton>
			</Box>

			{/* Tabs */}
			<TabsSystem currentTab={currentTab} onTabChange={handleTabChange} />

			{/* Content */}
			<Box
				component="form"
				onSubmit={form.handleSubmit(onSubmit)}
				sx={{
					flex: 1,
					display: 'flex',
					flexDirection: 'column',
					overflow: 'hidden',
				}}
			>
				<Box sx={{ flex: 1, overflow: 'auto', px: 2 }}>
					<TabPanel value={currentTab} index={0}>
						<ApiSection form={form} />
					</TabPanel>

					<TabPanel value={currentTab} index={1}>
						<InterfaceSection form={form} />
					</TabPanel>
				</Box>

				{/* Footer */}
				<Box
					sx={{
						display: 'flex',
						gap: 1,
						px: 2,
						py: 1.5,
						borderTop: 1,
						borderColor: 'divider',
					}}
				>
					<Button type="submit" variant="contained" fullWidth size="small">
						Сохранить
					</Button>
					<Button onClick={handleClose} variant="outlined" fullWidth size="small">
						Отмена
					</Button>
				</Box>
			</Box>
		</Drawer>
	);
};
