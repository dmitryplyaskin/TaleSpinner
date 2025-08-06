import { createTheme } from '@mui/material/styles';

// Тема в стиле фэнтези для ролевых игр
export const theme = createTheme({
	palette: {
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
	},
	typography: {
		fontFamily: '"Cinzel", "Playfair Display", "Georgia", serif',
		h1: {
			fontFamily: '"Cinzel Decorative", "Cinzel", serif',
			fontWeight: 700,
			letterSpacing: '0.02em',
		},
		h2: {
			fontFamily: '"Cinzel Decorative", "Cinzel", serif',
			fontWeight: 600,
			letterSpacing: '0.01em',
		},
		h3: {
			fontFamily: '"Cinzel", serif',
			fontWeight: 600,
		},
		h4: {
			fontFamily: '"Cinzel", serif',
			fontWeight: 500,
		},
		h5: {
			fontFamily: '"Cinzel", serif',
			fontWeight: 500,
		},
		h6: {
			fontFamily: '"Cinzel", serif',
			fontWeight: 500,
		},
		subtitle1: {
			fontFamily: '"Playfair Display", "Georgia", serif',
			fontWeight: 400,
			letterSpacing: '0.00938em',
		},
		subtitle2: {
			fontFamily: '"Playfair Display", "Georgia", serif',
			fontWeight: 500,
			letterSpacing: '0.00714em',
		},
		body1: {
			fontFamily: '"Crimson Text", "Georgia", serif',
			fontSize: '1.05rem',
			lineHeight: 1.7,
			letterSpacing: '0.00938em',
		},
		body2: {
			fontFamily: '"Crimson Text", "Georgia", serif',
			fontSize: '0.95rem',
			lineHeight: 1.6,
			letterSpacing: '0.01071em',
		},
		button: {
			fontFamily: '"Cinzel", serif',
			fontWeight: 600,
			letterSpacing: '0.05em',
			textTransform: 'uppercase',
		},
		caption: {
			fontFamily: '"Crimson Text", "Georgia", serif',
			fontSize: '0.85rem',
			letterSpacing: '0.03333em',
		},
		overline: {
			fontFamily: '"Cinzel", serif',
			fontSize: '0.75rem',
			fontWeight: 600,
			letterSpacing: '0.1em',
			textTransform: 'uppercase',
		},
	},
	shape: {
		borderRadius: 8, // Мягкие углы как у старинных книг
	},
	shadows: [
		'none',
		'0px 2px 4px rgba(212, 175, 55, 0.05)',
		'0px 3px 6px rgba(212, 175, 55, 0.07)',
		'0px 3px 8px rgba(212, 175, 55, 0.08)',
		'0px 2px 10px rgba(212, 175, 55, 0.09)',
		'0px 3px 12px rgba(212, 175, 55, 0.1)',
		'0px 3px 14px rgba(212, 175, 55, 0.11)',
		'0px 4px 16px rgba(212, 175, 55, 0.12)',
		'0px 5px 18px rgba(212, 175, 55, 0.13)',
		'0px 5px 20px rgba(212, 175, 55, 0.14)',
		'0px 6px 22px rgba(212, 175, 55, 0.15)',
		'0px 6px 24px rgba(212, 175, 55, 0.16)',
		'0px 7px 26px rgba(212, 175, 55, 0.17)',
		'0px 8px 28px rgba(212, 175, 55, 0.18)',
		'0px 8px 30px rgba(212, 175, 55, 0.19)',
		'0px 9px 32px rgba(212, 175, 55, 0.2)',
		'0px 10px 34px rgba(212, 175, 55, 0.21)',
		'0px 10px 36px rgba(212, 175, 55, 0.22)',
		'0px 11px 38px rgba(212, 175, 55, 0.23)',
		'0px 12px 40px rgba(212, 175, 55, 0.24)',
		'0px 12px 42px rgba(212, 175, 55, 0.25)',
		'0px 13px 44px rgba(212, 175, 55, 0.26)',
		'0px 14px 46px rgba(212, 175, 55, 0.27)',
		'0px 14px 48px rgba(212, 175, 55, 0.28)',
		'0px 15px 50px rgba(212, 175, 55, 0.29)',
	],
	components: {
		MuiButton: {
			styleOverrides: {
				root: {
					borderRadius: '6px',
					padding: '10px 24px',
					transition: 'all 0.3s ease',
					boxShadow: '0 2px 8px rgba(212, 175, 55, 0.15)',
					'&:hover': {
						transform: 'translateY(-2px)',
						boxShadow: '0 4px 12px rgba(212, 175, 55, 0.25)',
					},
				},
				contained: {
					background: 'linear-gradient(135deg, #d4af37 0%, #b89730 100%)',
					'&:hover': {
						background: 'linear-gradient(135deg, #e6c757 0%, #d4af37 100%)',
					},
				},
				outlined: {
					borderWidth: '2px',
					'&:hover': {
						borderWidth: '2px',
						backgroundColor: 'rgba(212, 175, 55, 0.08)',
					},
				},
			},
		},
		MuiPaper: {
			styleOverrides: {
				root: {
					backgroundImage: 'linear-gradient(135deg, #1a1618 0%, #221e20 100%)',
					border: '1px solid rgba(212, 175, 55, 0.1)',
					boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
				},
			},
		},
		MuiCard: {
			styleOverrides: {
				root: {
					background: 'linear-gradient(135deg, #1a1618 0%, #1f1b1d 100%)',
					border: '1px solid rgba(212, 175, 55, 0.15)',
					transition: 'all 0.3s ease',
					'&:hover': {
						transform: 'translateY(-4px)',
						boxShadow: '0 12px 40px rgba(212, 175, 55, 0.15)',
						borderColor: 'rgba(212, 175, 55, 0.3)',
					},
				},
			},
		},
		MuiAppBar: {
			styleOverrides: {
				root: {
					background: 'linear-gradient(90deg, #1a1618 0%, #2a2426 50%, #1a1618 100%)',
					borderBottom: '2px solid rgba(212, 175, 55, 0.2)',
					boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
				},
			},
		},
		MuiTextField: {
			styleOverrides: {
				root: {
					'& .MuiOutlinedInput-root': {
						'& fieldset': {
							borderColor: 'rgba(212, 175, 55, 0.3)',
							borderWidth: '2px',
						},
						'&:hover fieldset': {
							borderColor: 'rgba(212, 175, 55, 0.5)',
						},
						'&.Mui-focused fieldset': {
							borderColor: '#d4af37',
							boxShadow: '0 0 8px rgba(212, 175, 55, 0.3)',
						},
					},
				},
			},
		},
		MuiChip: {
			styleOverrides: {
				root: {
					background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%)',
					border: '1px solid rgba(212, 175, 55, 0.3)',
					'&:hover': {
						background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(212, 175, 55, 0.2) 100%)',
					},
				},
			},
		},
		MuiTooltip: {
			styleOverrides: {
				tooltip: {
					backgroundColor: '#2a2426',
					border: '1px solid rgba(212, 175, 55, 0.3)',
					fontSize: '0.875rem',
					fontFamily: '"Crimson Text", serif',
					boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
				},
				arrow: {
					color: '#2a2426',
					'&::before': {
						border: '1px solid rgba(212, 175, 55, 0.3)',
					},
				},
			},
		},
		MuiDivider: {
			styleOverrides: {
				root: {
					borderColor: 'rgba(212, 175, 55, 0.2)',
					'&::before, &::after': {
						borderColor: 'rgba(212, 175, 55, 0.2)',
					},
				},
			},
		},
		MuiTab: {
			styleOverrides: {
				root: {
					fontFamily: '"Cinzel", serif',
					fontWeight: 500,
					letterSpacing: '0.05em',
					transition: 'all 0.3s ease',
					'&:hover': {
						color: '#d4af37',
						backgroundColor: 'rgba(212, 175, 55, 0.08)',
					},
					'&.Mui-selected': {
						color: '#d4af37',
						fontWeight: 600,
					},
				},
			},
		},
		MuiTabs: {
			styleOverrides: {
				indicator: {
					backgroundColor: '#d4af37',
					height: 3,
					boxShadow: '0 2px 8px rgba(212, 175, 55, 0.4)',
				},
			},
		},
	},
});
