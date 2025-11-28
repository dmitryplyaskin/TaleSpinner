import React from 'react';
import { Card, CardContent, CardActions, Button, Typography, Box } from '@mui/material';

interface ActionCardProps {
	title: string;
	description: string;
	icon: React.ReactNode;
	onClick: () => void;
	buttonText: string;
	variant?: 'contained' | 'outlined';
	disabled?: boolean;
	width?: number;
}

export const ActionCard: React.FC<ActionCardProps> = ({
	title,
	description,
	icon,
	onClick,
	buttonText,
	variant = 'contained',
	disabled = false,
	width = 300,
}) => {
	return (
		<Card
			sx={{
				width: width,
				minHeight: 'fit-content',
				height: 'auto',
				cursor: disabled ? 'default' : 'pointer',
				opacity: disabled ? 0.7 : 1,
				transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
				display: 'flex',
				flexDirection: 'column',
				'&:hover': disabled
					? {}
					: {
							transform: 'translateY(-6px)',
							boxShadow: '0 12px 48px rgba(0, 0, 0, 0.5), 0 0 30px rgba(212, 175, 55, 0.25)',
							borderColor: 'rgba(212, 175, 55, 0.4)',
					  },
			}}
		>
			<CardContent sx={{ flexGrow: 1, p: 3 }}>
				<Box display="flex" alignItems="center" gap={2} mb={2}>
					<Box 
						sx={{ 
							color: 'primary.main',
							filter: 'drop-shadow(0 0 10px rgba(212, 175, 55, 0.5))'
						}}
					>
						{icon}
					</Box>
					<Typography variant="h5" component="h3" sx={{ fontWeight: 600 }}>
						{title}
					</Typography>
				</Box>
				<Typography
					variant="body2"
					color="text.secondary"
					sx={{
						lineHeight: 1.8,
						display: '-webkit-box',
						WebkitLineClamp: 3,
						WebkitBoxOrient: 'vertical',
						overflow: 'hidden',
					}}
				>
					{description}
				</Typography>
			</CardContent>
			<CardActions sx={{ p: 2, pt: 0 }}>
				<Button 
					size="large" 
					fullWidth 
					variant={variant} 
					disabled={disabled} 
					onClick={disabled ? undefined : onClick}
					sx={{
						py: 1.5,
						fontSize: '1.1rem',
					}}
				>
					{buttonText}
				</Button>
			</CardActions>
		</Card>
	);
};
