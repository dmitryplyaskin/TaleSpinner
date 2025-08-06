import { ThemeOptions } from '@mui/material/styles';

type PaletteOptions = ThemeOptions['palette'];

export const palette: PaletteOptions = {
	mode: 'dark',
	primary: {
		main: '#d4af37', // Золотой - для важных элементов и магии
		light: '#e6c757',
		dark: '#b89730',
		contrastText: '#1a1a1a',
	},
	secondary: {
		main: '#8b4789', // Мистический пурпурный
		light: '#a665a3',
		dark: '#6b3569',
		contrastText: '#ffffff',
	},
	error: {
		main: '#c62828', // Кроваво-красный для опасности
		light: '#d32f2f',
		dark: '#8e0000',
	},
	warning: {
		main: '#ff8f00', // Огненно-оранжевый для предупреждений
		light: '#ffa733',
		dark: '#c56000',
	},
	info: {
		main: '#4a90a4', // Небесно-синий для информации
		light: '#67a8b8',
		dark: '#2e6373',
	},
	success: {
		main: '#4a7c59', // Лесной зеленый для успеха
		light: '#6b9978',
		dark: '#2e5740',
	},
	background: {
		default: '#0a0a0a', // Глубокий черный как ночное небо
		paper: '#1a1618', // Темно-коричневый как старый пергамент
	},
	text: {
		primary: '#f4e8d0', // Кремовый как старая бумага
		secondary: '#c9b798', // Приглушенный бежевый
		disabled: '#7a6f60',
	},
	divider: 'rgba(212, 175, 55, 0.12)', // Золотистые разделители
	action: {
		active: '#d4af37',
		hover: 'rgba(212, 175, 55, 0.08)',
		selected: 'rgba(212, 175, 55, 0.16)',
		disabled: 'rgba(244, 232, 208, 0.3)',
		disabledBackground: 'rgba(244, 232, 208, 0.12)',
	},
};
