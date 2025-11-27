/**
 * Секция настроек интерфейса
 */

import React from 'react';
import { Box, Typography, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { UseFormReturn, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { AppSettings, LLMOutputLanguage, InterfaceLanguage } from '../model';

interface InterfaceSectionProps {
	form: UseFormReturn<AppSettings>;
}

const languages: { value: string; label: string }[] = [
	{ value: 'ru', label: 'Русский' },
	{ value: 'en', label: 'English' },
];

export const InterfaceSection: React.FC<InterfaceSectionProps> = ({ form }) => {
	const { control } = form;
	const { i18n } = useTranslation();

	const handleInterfaceLanguageChange = (_: React.MouseEvent<HTMLElement>, newLang: InterfaceLanguage | null) => {
		if (newLang) {
			i18n.changeLanguage(newLang);
		}
	};

	return (
		<Box>
			<Typography variant="subtitle1" fontWeight={600} gutterBottom>
				Интерфейс
			</Typography>

			{/* Язык интерфейса */}
			<Box mb={3}>
				<Typography variant="body2" color="text.secondary" mb={1}>
					Язык интерфейса
				</Typography>
				<ToggleButtonGroup
					value={i18n.language}
					exclusive
					onChange={handleInterfaceLanguageChange}
					size="small"
					fullWidth
				>
					{languages.map((lang) => (
						<ToggleButton key={lang.value} value={lang.value} sx={{ flex: 1, py: 0.75 }}>
							{lang.label}
						</ToggleButton>
					))}
				</ToggleButtonGroup>
			</Box>

			{/* Язык генерации контента */}
			<Box>
				<Typography variant="body2" color="text.secondary" mb={1}>
					Язык генерации LLM
				</Typography>
				<Controller
					name="llmOutputLanguage"
					control={control}
					render={({ field }) => (
						<ToggleButtonGroup
							value={field.value}
							exclusive
							onChange={(_, value: LLMOutputLanguage | null) => {
								if (value) field.onChange(value);
							}}
							size="small"
							fullWidth
						>
							{languages.map((lang) => (
								<ToggleButton key={lang.value} value={lang.value} sx={{ flex: 1, py: 0.75 }}>
									{lang.label}
								</ToggleButton>
							))}
						</ToggleButtonGroup>
					)}
				/>
				<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
					Язык для генерации миров, персонажей и диалогов
				</Typography>
			</Box>
		</Box>
	);
};

