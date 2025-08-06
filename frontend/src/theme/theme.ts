import { createTheme } from '@mui/material/styles';
import { palette } from './palette';
import { typography } from './typography';
import { shadows } from './shadows';
import { components } from './components';

// Тема в стиле фэнтези для ролевых игр с поддержкой русского языка
export const theme = createTheme({
	palette,
	typography,
	shadows,
	shape: {
		borderRadius: 8, // Мягкие углы как у старинных книг
	},
	components,
});
