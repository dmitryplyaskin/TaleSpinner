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
				transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
				display: 'flex',
				flexDirection: 'column',
				'&:hover': disabled
					? {}
					: {
							transform: 'translateY(-2px)',
							boxShadow: (theme) => theme.shadows[8],
					  },
			}}
		>
			<CardContent sx={{ flexGrow: 1 }}>
				<Box display="flex" alignItems="center" gap={2} mb={2}>
					{icon}
					<Typography variant="h5" component="h3">
						{title}
					</Typography>
				</Box>
				<Typography
					variant="body2"
					color="text.secondary"
					sx={{
						minHeight: '2.5em', // обеспечиваем минимальную высоту для выравнивания карточек
						display: '-webkit-box',
						WebkitLineClamp: 3,
						WebkitBoxOrient: 'vertical',
						overflow: 'hidden',
					}}
				>
					{description}
				</Typography>
			</CardContent>
			<CardActions>
				<Button size="large" fullWidth variant={variant} disabled={disabled} onClick={disabled ? undefined : onClick}>
					{buttonText}
				</Button>
			</CardActions>
		</Card>
	);
};
