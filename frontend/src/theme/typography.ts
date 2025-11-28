import { ThemeOptions } from '@mui/material/styles';

type TypographyOptions = ThemeOptions['typography'];

/**
 * Новые шрифты с полной поддержкой кириллицы:
 * 
 * - Cormorant Garamond — элегантный serif для заголовков, похож на Cinzel
 * - Cormorant SC — версия с small caps для акцентов и кнопок
 * - Lora — книжный serif для основного текста
 * - Alegreya — альтернатива для подзаголовков с характером
 * - Alegreya SC — small caps версия
 * - Marck Script — рукописный шрифт для декоративных элементов
 */

// Основной стек шрифтов для текста
const bodyFontStack = '"Lora", "Cormorant Garamond", Georgia, serif';

// Заголовки — элегантный Cormorant Garamond
const headingFontStack = '"Cormorant Garamond", "Alegreya", Georgia, serif';

// Декоративные заголовки с small caps
const displayFontStack = '"Cormorant SC", "Alegreya SC", Georgia, serif';

// Кнопки — small caps для элегантности
const buttonFontStack = '"Alegreya SC", "Cormorant SC", Georgia, serif';

// Рукописный шрифт для особых элементов
const scriptFontStack = '"Marck Script", "Alegreya", cursive';

// Подзаголовки — Alegreya с курсивом
const subtitleFontStack = '"Alegreya", "Cormorant Garamond", Georgia, serif';

export const typography: TypographyOptions = {
	fontFamily: bodyFontStack,
	h1: {
		fontFamily: displayFontStack,
		fontWeight: 600,
		fontStyle: 'normal',
		letterSpacing: '0.1em',
		textTransform: 'uppercase',
	},
	h2: {
		fontFamily: headingFontStack,
		fontWeight: 500,
		fontStyle: 'italic',
		letterSpacing: '0.02em',
	},
	h3: {
		fontFamily: headingFontStack,
		fontWeight: 600,
		letterSpacing: '0.01em',
	},
	h4: {
		fontFamily: headingFontStack,
		fontWeight: 500,
	},
	h5: {
		fontFamily: headingFontStack,
		fontWeight: 500,
	},
	h6: {
		fontFamily: headingFontStack,
		fontWeight: 500,
	},
	subtitle1: {
		fontFamily: subtitleFontStack,
		fontWeight: 400,
		fontStyle: 'italic',
		letterSpacing: '0.01em',
	},
	subtitle2: {
		fontFamily: subtitleFontStack,
		fontWeight: 500,
		letterSpacing: '0.00714em',
	},
	body1: {
		fontFamily: bodyFontStack,
		fontSize: '1.05rem',
		fontWeight: 400,
		lineHeight: 1.75,
		letterSpacing: '0.01em',
	},
	body2: {
		fontFamily: bodyFontStack,
		fontSize: '0.95rem',
		fontWeight: 400,
		lineHeight: 1.65,
		letterSpacing: '0.01em',
	},
	button: {
		fontFamily: buttonFontStack,
		fontWeight: 500,
		letterSpacing: '0.12em',
		textTransform: 'uppercase',
	},
	caption: {
		fontFamily: bodyFontStack,
		fontSize: '0.85rem',
		fontWeight: 400,
		letterSpacing: '0.02em',
	},
	overline: {
		fontFamily: buttonFontStack,
		fontSize: '0.75rem',
		fontWeight: 500,
		letterSpacing: '0.15em',
		textTransform: 'uppercase',
	},
};
