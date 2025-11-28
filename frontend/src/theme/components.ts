import { Components, Theme } from '@mui/material/styles';

export const components: Components<Omit<Theme, 'components'>> = {
	MuiButton: {
		styleOverrides: {
			root: {
				borderRadius: '12px',
				padding: '12px 32px',
				textTransform: 'none',
				fontWeight: 500,
				transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
				'&.Mui-disabled': {
					color: '#9e9e9e !important',
					backgroundColor: 'rgba(255, 255, 255, 0.12) !important',
				},
			},
			contained: {
				background: 'linear-gradient(135deg, #d4af37 0%, #f4d775 100%)',
				color: '#0a0a0a !important',
				boxShadow: '0 4px 20px rgba(212, 175, 55, 0.4)',
				'&:hover': {
					background: 'linear-gradient(135deg, #f4d775 0%, #fff4d0 100%)',
					boxShadow: '0 6px 30px rgba(212, 175, 55, 0.6)',
					transform: 'translateY(-2px)',
				},
				'&:active': {
					transform: 'translateY(0)',
					boxShadow: '0 2px 10px rgba(212, 175, 55, 0.4)',
				},
			},
			outlined: {
				borderWidth: '2px',
				borderColor: 'rgba(212, 175, 55, 0.5)',
				color: '#d4af37 !important',
				background: 'rgba(212, 175, 55, 0.05)',
				backdropFilter: 'blur(10px)',
				'&:hover': {
					borderWidth: '2px',
					borderColor: '#d4af37',
					background: 'rgba(212, 175, 55, 0.15)',
					boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)',
					transform: 'translateY(-2px)',
				},
			},
			text: {
				color: '#d4af37 !important',
				'&:hover': {
					backgroundColor: 'rgba(212, 175, 55, 0.08)',
					color: '#f4d775 !important',
				},
			},
		},
	},
	MuiPaper: {
		styleOverrides: {
			root: {
				background: 'rgba(255, 255, 255, 0.05)',
				backdropFilter: 'blur(20px)',
				WebkitBackdropFilter: 'blur(20px)',
				border: '1px solid rgba(255, 255, 255, 0.18)',
				boxShadow: '0 8px 32px rgba(0, 0, 0, 0.37)',
			},
		},
	},
	MuiCard: {
		styleOverrides: {
			root: {
				background: 'rgba(255, 255, 255, 0.05)',
				backdropFilter: 'blur(20px) saturate(180%)',
				WebkitBackdropFilter: 'blur(20px) saturate(180%)',
				border: '1px solid rgba(255, 255, 255, 0.18)',
				borderRadius: '16px',
				boxShadow: '0 8px 32px rgba(0, 0, 0, 0.37), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
				transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
				'&:hover': {
					background: 'rgba(255, 255, 255, 0.08)',
					borderColor: 'rgba(212, 175, 55, 0.3)',
					transform: 'translateY(-6px)',
					boxShadow: '0 12px 48px rgba(0, 0, 0, 0.5), 0 0 30px rgba(212, 175, 55, 0.2)',
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
				background: 'rgba(212, 175, 55, 0.15)',
				border: '1px solid rgba(212, 175, 55, 0.3)',
				borderRadius: '12px',
				color: '#f8f9fa',
				backdropFilter: 'blur(10px)',
				'&:hover': {
					background: 'rgba(212, 175, 55, 0.25)',
				},
			},
		},
	},
	MuiTooltip: {
		styleOverrides: {
			tooltip: {
				background: 'rgba(255, 255, 255, 0.1)',
				backdropFilter: 'blur(20px)',
				WebkitBackdropFilter: 'blur(20px)',
				border: '1px solid rgba(255, 255, 255, 0.2)',
				borderRadius: '8px',
				fontSize: '0.875rem',
				boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
				color: '#f8f9fa',
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
				fontFamily: '"Cinzel", "Philosopher", "Rubik", "PT Sans", sans-serif',
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
