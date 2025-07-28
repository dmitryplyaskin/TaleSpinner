import React from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';

export interface TabPanelProps {
	children?: React.ReactNode;
	index: number;
	value: number;
}

export const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`settings-tabpanel-${index}`}
			aria-labelledby={`settings-tab-${index}`}
			{...other}
		>
			{value === index && <Box sx={{ p: 3 }}>{children}</Box>}
		</div>
	);
};

export interface TabsSystemProps {
	currentTab: number;
	onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
}

export const TabsSystem: React.FC<TabsSystemProps> = ({ currentTab, onTabChange }) => {
	return (
		<Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
			<Tabs value={currentTab} onChange={onTabChange} aria-label="settings tabs">
				<Tab label="API и Модели" id="settings-tab-0" aria-controls="settings-tabpanel-0" />
				{/* Будущие табы */}
				{/* <Tab label="Интерфейс" id="settings-tab-1" aria-controls="settings-tabpanel-1" />
				<Tab label="Дополнительно" id="settings-tab-2" aria-controls="settings-tabpanel-2" /> */}
			</Tabs>
		</Box>
	);
};
