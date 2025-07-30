import React from 'react';
import { Container, Typography, Box, Card, CardContent, Chip, Button, IconButton, Tooltip } from '@mui/material';
import { Public, AutoStories, Palette, Star, StarBorder } from '@mui/icons-material';
import { $worldCreateMoreProgress, $worlds, createMoreWorldsFx, World } from '@model/world-create';
import { useUnit } from 'effector-react';

interface ChooseWorldProps {
	onWorldSelect?: (world: World) => void;
	onToggleFavorite?: (world: World) => void;
}

export const ChooseWorld: React.FC<ChooseWorldProps> = ({ onWorldSelect, onToggleFavorite }) => {
	const worlds = useUnit($worlds);
	const createMoreWorldsProgress = useUnit($worldCreateMoreProgress);

	const handleWorldSelect = (world: World) => {
		if (onWorldSelect) {
			onWorldSelect(world);
		}
	};

	const handleToggleFavorite = (world: World, event: React.MouseEvent) => {
		event.stopPropagation();
		if (onToggleFavorite) {
			onToggleFavorite(world);
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

			<Box display="flex" flexDirection="column" gap={3} alignItems="center">
				{worlds.map((world) => (
					<Card
						key={world.id}
						sx={{
							width: '100%',
							maxWidth: 800,

							display: 'flex',
							flexDirection: 'column',
						}}
					>
						<CardContent sx={{ flexGrow: 1, p: 3 }}>
							<Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
								<Box display="flex" alignItems="center" gap={2}>
									<Public color="primary" fontSize="large" />
									<Typography variant="h5" component="h3" fontWeight="bold">
										{world.title}
									</Typography>
								</Box>
								<Tooltip title="Сохранить мир в избранное">
									<IconButton onClick={(event) => handleToggleFavorite(world, event)} color="default" size="small">
										{world.isFavorite === true ? <Star color="warning" /> : <StarBorder />}
									</IconButton>
								</Tooltip>
							</Box>

							<Box display="flex" gap={1} mb={1} flexWrap="wrap">
								<Typography variant="subtitle2" color="primary" fontWeight="bold" gutterBottom>
									Genre:{' '}
								</Typography>
								<Chip
									icon={<AutoStories />}
									label={world.genre}
									sx={{ p: 1 }}
									color="primary"
									variant="outlined"
									size="small"
								/>
							</Box>
							<Box display="flex" gap={1} mb={3} flexWrap="wrap">
								<Typography variant="subtitle2" color="primary" fontWeight="bold" gutterBottom>
									Tone:{' '}
								</Typography>
								{world.tone?.map((tone) => (
									<Chip key={tone} icon={<Palette />} label={tone} color="secondary" variant="outlined" size="small" />
								))}
							</Box>

							<Box mb={3}>
								<Typography variant="subtitle2" color="primary" fontWeight="bold" gutterBottom>
									Уникальная особенность:
								</Typography>
								<Typography variant="body2" color="text.secondary" gutterBottom>
									{world.unique_feature}
								</Typography>
							</Box>

							<Box mb={3}>
								<Typography variant="subtitle2" color="primary" fontWeight="bold" gutterBottom>
									Описание мира:
								</Typography>
								<Typography variant="body2" color="text.secondary">
									{world.synopsis}
								</Typography>
							</Box>

							<Box display="flex" justifyContent="center" mt={2}>
								<Button
									variant="contained"
									color="primary"
									size="large"
									onClick={() => handleWorldSelect(world)}
									sx={{
										px: 4,
										py: 1.5,
										borderRadius: 2,
										textTransform: 'none',
										fontSize: '1rem',
										fontWeight: 'bold',
									}}
								>
									Выбрать этот мир
								</Button>
							</Box>
						</CardContent>
					</Card>
				))}
			</Box>
			<Box display="flex" justifyContent="center" mt={2}>
				<Button
					variant="contained"
					color="primary"
					size="large"
					sx={{
						px: 4,
						py: 1.5,
						borderRadius: 2,
						textTransform: 'none',
						fontSize: '1rem',
						fontWeight: 'bold',
					}}
					disabled={createMoreWorldsProgress}
					onClick={() =>
						createMoreWorldsFx({
							lastWorldGenerationId: '123',
							worldType: 'fantasy',
						})
					}
				>
					Создать еще миры
				</Button>
			</Box>
		</Container>
	);
};
