import React from 'react';
import { Container, Typography, Box, Card, CardContent, Chip } from '@mui/material';
import { Public, AutoStories, Palette } from '@mui/icons-material';
import { $worlds, World } from '@model/world-create';
import { useUnit } from 'effector-react';

interface ChooseWorldProps {
	onWorldSelect?: (world: World) => void;
}

export const ChooseWorld: React.FC<ChooseWorldProps> = ({ onWorldSelect }) => {
	const worlds = useUnit($worlds);

	const handleWorldClick = (world: World) => {
		if (onWorldSelect) {
			onWorldSelect(world);
		}
	};

	return (
		<Container maxWidth="lg" sx={{ py: 4 }}>
			<Typography variant="h4" component="h1" textAlign="center" gutterBottom sx={{ mb: 4 }}>
				Выберите мир для приключения
			</Typography>

			<Typography variant="h6" component="h2" textAlign="center" color="text.secondary" gutterBottom sx={{ mb: 6 }}>
				Каждый мир предлагает уникальную атмосферу и возможности для создания незабываемых историй
			</Typography>

			<Box display="flex" gap={3} flexWrap="wrap" justifyContent="center">
				{worlds.map((world) => (
					<Card
						key={world.id}
						sx={{
							width: 350,
							minHeight: 400,
							cursor: 'pointer',
							transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
							display: 'flex',
							flexDirection: 'column',
							'&:hover': {
								transform: 'translateY(-4px)',
								boxShadow: (theme) => theme.shadows[8],
							},
						}}
						onClick={() => handleWorldClick(world)}
					>
						<CardContent sx={{ flexGrow: 1, p: 3 }}>
							<Box display="flex" alignItems="center" gap={2} mb={2}>
								<Public color="primary" fontSize="large" />
								<Typography variant="h5" component="h3" fontWeight="bold">
									{world.title}
								</Typography>
							</Box>

							<Box display="flex" gap={1} mb={3} flexWrap="wrap">
								<Chip icon={<AutoStories />} label={world.genre} color="primary" variant="outlined" size="small" />
								<Chip icon={<Palette />} label={world.tone} color="secondary" variant="outlined" size="small" />
							</Box>

							<Box mb={3}>
								<Typography variant="subtitle2" color="primary" fontWeight="bold" gutterBottom>
									Уникальная особенность:
								</Typography>
								<Typography variant="body2" color="text.secondary" gutterBottom>
									{world.unique_feature}
								</Typography>
							</Box>

							<Box>
								<Typography variant="subtitle2" color="primary" fontWeight="bold" gutterBottom>
									Описание мира:
								</Typography>
								<Typography
									variant="body2"
									color="text.secondary"
									sx={{
										display: '-webkit-box',
										WebkitLineClamp: 8,
										WebkitBoxOrient: 'vertical',
										overflow: 'hidden',
										textAlign: 'justify',
										lineHeight: 1.5,
									}}
								>
									{world.synopsis}
								</Typography>
							</Box>
						</CardContent>
					</Card>
				))}
			</Box>
		</Container>
	);
};
