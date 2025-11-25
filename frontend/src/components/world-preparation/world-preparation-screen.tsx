import React from 'react';
import {
	Box,
	Container,
	Typography,
	Button,
	Chip,
	Stack,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Card,
	CardContent,
	IconButton,
	Tooltip,
	CircularProgress,
	Divider,
} from '@mui/material';
import {
	ArrowBack,
	ExpandMore,
	Public,
	Groups,
	LocationOn,
	People,
	History,
	AutoAwesome,
	PlayArrow,
	Build,
} from '@mui/icons-material';
import { useStore } from 'effector-react';
import { $selectedWorld } from '@model/game-sessions';
import { goToWelcome } from '@model/app-navigation';
import {
	Faction,
	Location,
	Race,
	TimelineEvent,
	MagicSystem,
} from '@shared/types/world-data';

// Компонент для отображения фракции
const FactionCard: React.FC<{ faction: Faction }> = ({ faction }) => (
	<Card variant="outlined" sx={{ mb: 2 }}>
		<CardContent>
			<Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
				{faction.name}
			</Typography>
			<Chip label={faction.type} size="small" sx={{ mb: 2 }} />
			<Stack spacing={1.5}>
				<Box>
					<Typography variant="subtitle2" color="text.secondary">
						Идеология и цели
					</Typography>
					<Typography variant="body2">{faction.ideology_and_goals}</Typography>
				</Box>
				<Box>
					<Typography variant="subtitle2" color="text.secondary">
						Структура
					</Typography>
					<Typography variant="body2">{faction.structure}</Typography>
				</Box>
				<Box>
					<Typography variant="subtitle2" color="text.secondary">
						Ключевые лидеры
					</Typography>
					<Typography variant="body2">{faction.key_leaders}</Typography>
				</Box>
				<Box>
					<Typography variant="subtitle2" color="text.secondary">
						Методы
					</Typography>
					<Typography variant="body2">{faction.methods}</Typography>
				</Box>
				<Box>
					<Typography variant="subtitle2" color="text.secondary">
						Отношения
					</Typography>
					<Typography variant="body2">{faction.relationships}</Typography>
				</Box>
				<Box>
					<Typography variant="subtitle2" color="text.secondary">
						Роль в конфликте
					</Typography>
					<Typography variant="body2">{faction.role_in_conflict}</Typography>
				</Box>
				<Box>
					<Typography variant="subtitle2" color="text.secondary">
						Ресурсы и влияние
					</Typography>
					<Typography variant="body2">{faction.resources_and_influence}</Typography>
				</Box>
			</Stack>
		</CardContent>
	</Card>
);

// Компонент для отображения локации
const LocationCard: React.FC<{ location: Location }> = ({ location }) => (
	<Card variant="outlined" sx={{ mb: 2 }}>
		<CardContent>
			<Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
				{location.name}
			</Typography>
			<Chip label={location.type} size="small" sx={{ mb: 2 }} />
			<Stack spacing={1.5}>
				<Box>
					<Typography variant="subtitle2" color="text.secondary">
						Внешний вид
					</Typography>
					<Typography variant="body2">{location.appearance}</Typography>
				</Box>
				<Box>
					<Typography variant="subtitle2" color="text.secondary">
						История
					</Typography>
					<Typography variant="body2">{location.history}</Typography>
				</Box>
				<Box>
					<Typography variant="subtitle2" color="text.secondary">
						Обитатели
					</Typography>
					<Typography variant="body2">{location.inhabitants}</Typography>
				</Box>
				<Box>
					<Typography variant="subtitle2" color="text.secondary">
						Значимость
					</Typography>
					<Typography variant="body2">{location.significance}</Typography>
				</Box>
				<Box>
					<Typography variant="subtitle2" color="text.secondary">
						Особенности и секреты
					</Typography>
					<Typography variant="body2">{location.features_and_secrets}</Typography>
				</Box>
				<Box>
					<Typography variant="subtitle2" color="text.secondary">
						Возможности для приключений
					</Typography>
					<Typography variant="body2">{location.adventure_opportunities}</Typography>
				</Box>
			</Stack>
		</CardContent>
	</Card>
);

// Компонент для отображения расы
const RaceCard: React.FC<{ race: Race }> = ({ race }) => (
	<Card variant="outlined" sx={{ mb: 2 }}>
		<CardContent>
			<Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
				{race.name}
			</Typography>
			<Stack spacing={1.5}>
				<Box>
					<Typography variant="subtitle2" color="text.secondary">
						Описание
					</Typography>
					<Typography variant="body2">{race.description}</Typography>
				</Box>
				<Box>
					<Typography variant="subtitle2" color="text.secondary">
						Отношение к конфликту
					</Typography>
					<Typography variant="body2">{race.relationship_to_conflict}</Typography>
				</Box>
				<Box>
					<Typography variant="subtitle2" color="text.secondary">
						Особые способности
					</Typography>
					<Typography variant="body2">{race.special_abilities}</Typography>
				</Box>
				<Box>
					<Typography variant="subtitle2" color="text.secondary">
						Социальная структура
					</Typography>
					<Typography variant="body2">{race.social_structure}</Typography>
				</Box>
			</Stack>
		</CardContent>
	</Card>
);

// Компонент для отображения события истории
const TimelineEventCard: React.FC<{ event: TimelineEvent }> = ({ event }) => (
	<Card variant="outlined" sx={{ mb: 2 }}>
		<CardContent>
			<Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
				<Typography variant="h6" sx={{ fontWeight: 600 }}>
					{event.name}
				</Typography>
				<Chip label={event.timeframe} size="small" color="primary" variant="outlined" />
			</Box>
			<Stack spacing={1.5}>
				<Box>
					<Typography variant="subtitle2" color="text.secondary">
						Описание
					</Typography>
					<Typography variant="body2">{event.description}</Typography>
				</Box>
				<Box>
					<Typography variant="subtitle2" color="text.secondary">
						Влияние на настоящее
					</Typography>
					<Typography variant="body2">{event.impact_on_present}</Typography>
				</Box>
			</Stack>
		</CardContent>
	</Card>
);

// Компонент для отображения магической системы
const MagicSystemCard: React.FC<{ magic: MagicSystem }> = ({ magic }) => (
	<Stack spacing={2}>
		<Card variant="outlined">
			<CardContent>
				<Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
					Основы магии
				</Typography>
				<Typography variant="body2">{magic.magic_fundamentals}</Typography>
			</CardContent>
		</Card>
		<Card variant="outlined">
			<CardContent>
				<Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
					Источники силы
				</Typography>
				<Typography variant="body2">{magic.power_sources}</Typography>
			</CardContent>
		</Card>
		{magic.magic_schools && magic.magic_schools.length > 0 && (
			<Card variant="outlined">
				<CardContent>
					<Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
						Школы магии
					</Typography>
					<Stack spacing={1}>
						{magic.magic_schools.map((school, index) => (
							<Box key={index}>
								<Typography variant="subtitle2" color="primary.main">
									{school.name}
								</Typography>
								<Typography variant="body2">{school.description}</Typography>
							</Box>
						))}
					</Stack>
				</CardContent>
			</Card>
		)}
		<Card variant="outlined">
			<CardContent>
				<Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
					Ограничения и цена
				</Typography>
				<Typography variant="body2">{magic.limitations_and_costs}</Typography>
			</CardContent>
		</Card>
		<Card variant="outlined">
			<CardContent>
				<Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
					Отношение общества
				</Typography>
				<Typography variant="body2">{magic.societal_attitude}</Typography>
			</CardContent>
		</Card>
		<Card variant="outlined">
			<CardContent>
				<Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
					Роль в конфликте
				</Typography>
				<Typography variant="body2">{magic.role_in_conflict}</Typography>
			</CardContent>
		</Card>
		<Card variant="outlined">
			<CardContent>
				<Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
					Артефакты и места силы
				</Typography>
				<Typography variant="body2">{magic.artifacts_and_places}</Typography>
			</CardContent>
		</Card>
	</Stack>
);

export const WorldPreparationScreen: React.FC = () => {
	const selectedWorld = useStore($selectedWorld);

	const handleBack = () => {
		goToWelcome();
	};

	const handlePrepareWorld = () => {
		// TODO: Реализовать подготовку мира для игры
		console.log('Prepare world for game');
	};

	const handleStartGame = () => {
		// TODO: Реализовать начало игры
		console.log('Start game');
	};

	if (!selectedWorld) {
		return (
			<Box
				sx={{
					minHeight: '100vh',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<CircularProgress />
			</Box>
		);
	}

	const { data } = selectedWorld;
	const hasFactions = data.factions && data.factions.length > 0;
	const hasLocations = data.locations && data.locations.length > 0;
	const hasRaces = data.races && data.races.length > 0;
	const hasHistory = data.history && data.history.length > 0;
	const hasMagic = !!data.magic;

	return (
		<Box sx={{ minHeight: '100vh', pb: 4 }}>
			{/* Шапка с кнопкой назад */}
			<Box
				sx={{
					position: 'sticky',
					top: 0,
					zIndex: 10,
					backgroundColor: 'background.paper',
					borderBottom: '1px solid',
					borderColor: 'divider',
					py: 2,
				}}
			>
				<Container maxWidth="md">
					<Box display="flex" alignItems="center" gap={2}>
						<Tooltip title="Назад">
							<IconButton onClick={handleBack}>
								<ArrowBack />
							</IconButton>
						</Tooltip>
						<Box sx={{ flex: 1 }}>
							<Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
								{selectedWorld.name}
							</Typography>
							<Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
								<Chip
									label={selectedWorld.genre}
									size="small"
									icon={<Public sx={{ fontSize: '0.875rem' }} />}
									variant="outlined"
									color="primary"
								/>
								<Chip
									label={selectedWorld.tone}
									size="small"
									variant="outlined"
									color="secondary"
								/>
							</Stack>
						</Box>
					</Box>
				</Container>
			</Box>

			<Container maxWidth="md" sx={{ py: 4 }}>
				{/* Описание мира */}
				<Card sx={{ mb: 4 }}>
					<CardContent>
						<Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
							Описание мира
						</Typography>
						<Typography
							variant="body1"
							sx={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}
						>
							{data.world_primer}
						</Typography>
					</CardContent>
				</Card>

				{/* Аккордеоны с данными мира */}
				<Stack spacing={2}>
					{/* Фракции */}
					{hasFactions && (
						<Accordion defaultExpanded>
							<AccordionSummary expandIcon={<ExpandMore />}>
								<Box display="flex" alignItems="center" gap={1}>
									<Groups color="primary" />
									<Typography variant="h6">
										Фракции ({data.factions!.length})
									</Typography>
								</Box>
							</AccordionSummary>
							<AccordionDetails>
								{data.factions!.map((faction, index) => (
									<FactionCard key={index} faction={faction} />
								))}
							</AccordionDetails>
						</Accordion>
					)}

					{/* Локации */}
					{hasLocations && (
						<Accordion>
							<AccordionSummary expandIcon={<ExpandMore />}>
								<Box display="flex" alignItems="center" gap={1}>
									<LocationOn color="primary" />
									<Typography variant="h6">
										Локации ({data.locations!.length})
									</Typography>
								</Box>
							</AccordionSummary>
							<AccordionDetails>
								{data.locations!.map((location, index) => (
									<LocationCard key={index} location={location} />
								))}
							</AccordionDetails>
						</Accordion>
					)}

					{/* Расы */}
					{hasRaces && (
						<Accordion>
							<AccordionSummary expandIcon={<ExpandMore />}>
								<Box display="flex" alignItems="center" gap={1}>
									<People color="primary" />
									<Typography variant="h6">
										Расы ({data.races!.length})
									</Typography>
								</Box>
							</AccordionSummary>
							<AccordionDetails>
								{data.races!.map((race, index) => (
									<RaceCard key={index} race={race} />
								))}
							</AccordionDetails>
						</Accordion>
					)}

					{/* История */}
					{hasHistory && (
						<Accordion>
							<AccordionSummary expandIcon={<ExpandMore />}>
								<Box display="flex" alignItems="center" gap={1}>
									<History color="primary" />
									<Typography variant="h6">
										История ({data.history!.length})
									</Typography>
								</Box>
							</AccordionSummary>
							<AccordionDetails>
								{data.history!.map((event, index) => (
									<TimelineEventCard key={index} event={event} />
								))}
							</AccordionDetails>
						</Accordion>
					)}

					{/* Магия */}
					{hasMagic && (
						<Accordion>
							<AccordionSummary expandIcon={<ExpandMore />}>
								<Box display="flex" alignItems="center" gap={1}>
									<AutoAwesome color="primary" />
									<Typography variant="h6">Магическая система</Typography>
								</Box>
							</AccordionSummary>
							<AccordionDetails>
								<MagicSystemCard magic={data.magic!} />
							</AccordionDetails>
						</Accordion>
					)}
				</Stack>

				{/* Кнопки действий */}
				<Divider sx={{ my: 4 }} />
				<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
					<Button
						variant="outlined"
						size="large"
						startIcon={<Build />}
						onClick={handlePrepareWorld}
						sx={{ flex: 1 }}
					>
						Подготовить мир для игры
					</Button>
					<Button
						variant="contained"
						size="large"
						startIcon={<PlayArrow />}
						onClick={handleStartGame}
						sx={{ flex: 1 }}
					>
						Начать играть
					</Button>
				</Stack>
			</Container>
		</Box>
	);
};

