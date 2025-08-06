import { Components, Theme } from '@mui/material/styles';

export const components: Components<Omit<Theme, 'components'>> = {
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
				// Исправляем читаемость текста в разных состояниях
				'&.Mui-disabled': {
					color: '#7a6f60 !important',
					backgroundColor: 'rgba(244, 232, 208, 0.12) !important',
				},
			},
			contained: {
				background: 'linear-gradient(135deg, #d4af37 0%, #b89730 100%)',
				color: '#1a1a1a !important', // Принудительно темный текст на золотом фоне
				'&:hover': {
					background: 'linear-gradient(135deg, #e6c757 0%, #d4af37 100%)',
					color: '#1a1a1a !important',
				},
				'&:active': {
					background: 'linear-gradient(135deg, #b89730 0%, #9c8429 100%)',
					color: '#1a1a1a !important',
				},
				'&:focus': {
					background: 'linear-gradient(135deg, #d4af37 0%, #b89730 100%)',
					color: '#1a1a1a !important',
					boxShadow: '0 0 0 3px rgba(212, 175, 55, 0.3)',
				},
			},
			outlined: {
				borderWidth: '2px',
				color: '#d4af37 !important',
				borderColor: '#d4af37',
				'&:hover': {
					borderWidth: '2px',
					backgroundColor: 'rgba(212, 175, 55, 0.08)',
					borderColor: '#e6c757',
					color: '#e6c757 !important',
				},
				'&:active': {
					borderColor: '#b89730',
					color: '#b89730 !important',
				},
				'&:focus': {
					borderColor: '#d4af37',
					color: '#d4af37 !important',
					boxShadow: '0 0 0 2px rgba(212, 175, 55, 0.2)',
				},
			},
			text: {
				color: '#d4af37 !important',
				'&:hover': {
					backgroundColor: 'rgba(212, 175, 55, 0.08)',
					color: '#e6c757 !important',
				},
				'&:active': {
					color: '#b89730 !important',
				},
				'&:focus': {
					color: '#d4af37 !important',
					backgroundColor: 'rgba(212, 175, 55, 0.12)',
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
				color: '#f4e8d0',
				'&:hover': {
					background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(212, 175, 55, 0.2) 100%)',
				},
				'&:focus': {
					background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(212, 175, 55, 0.2) 100%)',
					boxShadow: '0 0 0 2px rgba(212, 175, 55, 0.4)',
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
				fontFamily: '"Crimson Text", "Cormorant Garamond", "PT Serif", serif',
				boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
				color: '#f4e8d0',
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
				fontFamily: '"Cinzel", "Cormorant", "PT Sans", sans-serif',
				fontWeight: 500,
				letterSpacing: '0.05em',
				transition: 'all 0.3s ease',
				color: '#c9b798',
				'&:hover': {
					color: '#d4af37',
					backgroundColor: 'rgba(212, 175, 55, 0.08)',
				},
				'&.Mui-selected': {
					color: '#d4af37 !important',
					fontWeight: 600,
				},
				'&:focus': {
					color: '#d4af37',
					backgroundColor: 'rgba(212, 175, 55, 0.12)',
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
	MuiIconButton: {
		styleOverrides: {
			root: {
				color: '#d4af37',
				transition: 'all 0.3s ease',
				'&:hover': {
					color: '#e6c757',
					backgroundColor: 'rgba(212, 175, 55, 0.08)',
					transform: 'scale(1.1)',
				},
				'&:focus': {
					color: '#d4af37',
					backgroundColor: 'rgba(212, 175, 55, 0.12)',
					boxShadow: '0 0 0 2px rgba(212, 175, 55, 0.3)',
				},
			},
		},
	},
	MuiSwitch: {
		styleOverrides: {
			switchBase: {
				'&.Mui-checked': {
					color: '#d4af37',
					'& + .MuiSwitch-track': {
						backgroundColor: 'rgba(212, 175, 55, 0.5)',
					},
				},
			},
			track: {
				backgroundColor: 'rgba(201, 183, 152, 0.3)',
			},
		},
	},
};
