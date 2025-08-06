import { ThemeOptions } from '@mui/material/styles';

type TypographyOptions = ThemeOptions['typography'];

// Шрифты для кириллицы - более жирные и читаемые
const cyrillicFontStack = '"Philosopher", "Rubik", "Roboto", "Arial", sans-serif';
const cyrillicHeadingFontStack = '"Philosopher", "Rubik", "PT Sans", sans-serif';
const cyrillicButtonFontStack = '"Rubik", "PT Sans", "Arial", sans-serif';

// Шрифты для латиницы
const latinFontStack = '"Cinzel", "Playfair Display", "Georgia", serif';
const latinHeadingFontStack = '"Cinzel Decorative", "Cinzel", serif';
const latinButtonFontStack = '"Cinzel", serif';

// Универсальный стек шрифтов с поддержкой обоих алфавитов
const universalFontStack = `${latinFontStack}, ${cyrillicFontStack}`;
const universalHeadingFontStack = `${latinHeadingFontStack}, ${cyrillicHeadingFontStack}`;
const universalButtonFontStack = `${latinButtonFontStack}, ${cyrillicButtonFontStack}`;

export const typography: TypographyOptions = {
	fontFamily: universalFontStack,
	h1: {
		fontFamily: universalHeadingFontStack,
		fontWeight: 700,
		letterSpacing: '0.02em',
	},
	h2: {
		fontFamily: universalHeadingFontStack,
		fontWeight: 600,
		letterSpacing: '0.01em',
	},
	h3: {
		fontFamily: universalHeadingFontStack,
		fontWeight: 600,
	},
	h4: {
		fontFamily: universalHeadingFontStack,
		fontWeight: 500,
	},
	h5: {
		fontFamily: universalHeadingFontStack,
		fontWeight: 500,
	},
	h6: {
		fontFamily: universalHeadingFontStack,
		fontWeight: 500,
	},
	subtitle1: {
		fontFamily: `"Playfair Display", ${cyrillicFontStack}`,
		fontWeight: 500,
		letterSpacing: '0.00938em',
	},
	subtitle2: {
		fontFamily: `"Playfair Display", ${cyrillicFontStack}`,
		fontWeight: 600,
		letterSpacing: '0.00714em',
	},
	body1: {
		fontFamily: `"Crimson Text", ${cyrillicFontStack}`,
		fontSize: '1.05rem',
		fontWeight: 400,
		lineHeight: 1.7,
		letterSpacing: '0.00938em',
	},
	body2: {
		fontFamily: `"Crimson Text", ${cyrillicFontStack}`,
		fontSize: '0.95rem',
		fontWeight: 400,
		lineHeight: 1.6,
		letterSpacing: '0.01071em',
	},
	button: {
		fontFamily: universalButtonFontStack,
		fontWeight: 600,
		letterSpacing: '0.05em',
		textTransform: 'uppercase',
	},
	caption: {
		fontFamily: `"Crimson Text", ${cyrillicFontStack}`,
		fontSize: '0.85rem',
		fontWeight: 400,
		letterSpacing: '0.03333em',
	},
	overline: {
		fontFamily: universalButtonFontStack,
		fontSize: '0.75rem',
		fontWeight: 600,
		letterSpacing: '0.1em',
		textTransform: 'uppercase',
	},
};
