import { ThemeOptions } from '@mui/material/styles';

type TypographyOptions = ThemeOptions['typography'];

// Шрифты с поддержкой кириллицы для русского текста
const russianFontStack = '"Cormorant Garamond", "PT Serif", "Times New Roman", serif';
const russianHeadingFontStack = '"Cormorant", "Playfair Display", "PT Serif", serif';
const russianButtonFontStack = '"Cormorant", "PT Sans", "Arial", sans-serif';

// Английские шрифты для латинских символов
const englishFontStack = '"Cinzel", "Cormorant Garamond", "Georgia", serif';
const englishHeadingFontStack = '"Cinzel Decorative", "Cinzel", "Cormorant", serif';
const englishButtonFontStack = '"Cinzel", "Cormorant", serif';

// Универсальный стек шрифтов с поддержкой обоих языков
const universalFontStack = `${englishFontStack}, ${russianFontStack}`;
const universalHeadingFontStack = `${englishHeadingFontStack}, ${russianHeadingFontStack}`;
const universalButtonFontStack = `${englishButtonFontStack}, ${russianButtonFontStack}`;

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
		fontFamily: '"Playfair Display", "Cormorant Garamond", "PT Serif", serif',
		fontWeight: 400,
		letterSpacing: '0.00938em',
	},
	subtitle2: {
		fontFamily: '"Playfair Display", "Cormorant Garamond", "PT Serif", serif',
		fontWeight: 500,
		letterSpacing: '0.00714em',
	},
	body1: {
		fontFamily: '"Crimson Text", "Cormorant Garamond", "PT Serif", serif',
		fontSize: '1.05rem',
		lineHeight: 1.7,
		letterSpacing: '0.00938em',
	},
	body2: {
		fontFamily: '"Crimson Text", "Cormorant Garamond", "PT Serif", serif',
		fontSize: '0.95rem',
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
		fontFamily: '"Crimson Text", "Cormorant Garamond", "PT Serif", serif',
		fontSize: '0.85rem',
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
