import { ThemeOptions } from '@mui/material/styles';

type PaletteOptions = ThemeOptions['palette'];

export const palette: PaletteOptions = {
	mode: 'dark',
	primary: {
		main: '#d4af37', // Золотой - остается
		light: '#f4d775',
		dark: '#b89730',
		contrastText: '#0a0a0a',
	},
	secondary: {
		main: '#9d4edd', // Обновленный мистический пурпурный
		light: '#c77dff',
		dark: '#7b2cbf',
		contrastText: '#ffffff',
	},
	error: {
		main: '#c62828',
		light: '#d32f2f',
		dark: '#8e0000',
	},
	warning: {
		main: '#ff8f00',
		light: '#ffa733',
		dark: '#c56000',
	},
	info: {
		main: '#4a90a4',
		light: '#67a8b8',
		dark: '#2e6373',
	},
	success: {
		main: '#4a7c59',
		light: '#6b9978',
		dark: '#2e5740',
	},
	background: {
		default: '#0f0f0f', // Глубокий черный
		paper: 'rgba(255, 255, 255, 0.04)', // Очень прозрачный для glassmorphism
	},
	text: {
		primary: '#f8f9fa', // Яркий белый
		secondary: '#e0e0e0', // Светло-серый
		disabled: '#9e9e9e',
	},
	divider: 'rgba(255, 255, 255, 0.12)', // Светлые разделители
	action: {
		active: '#d4af37',
		hover: 'rgba(255, 255, 255, 0.08)',
		selected: 'rgba(212, 175, 55, 0.16)',
		disabled: 'rgba(255, 255, 255, 0.3)',
		disabledBackground: 'rgba(255, 255, 255, 0.12)',
	},
};
